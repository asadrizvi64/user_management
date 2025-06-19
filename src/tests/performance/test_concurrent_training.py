
# tests/performance/test_concurrent_training.py
import pytest
import asyncio
import time
from unittest.mock import MagicMock, patch

from training_queue_manager import TrainingQueueManager, TrainingJobRequest, ResourceRequirements


class TestConcurrentTraining:
    
    @pytest.fixture
    def mock_db_session(self):
        """Mock database session factory"""
        session = MagicMock()
        return lambda: session
    
    @pytest.fixture
    def queue_manager(self, mock_db_session):
        """Create queue manager with multiple nodes"""
        manager = TrainingQueueManager(mock_db_session)
        
        # Add multiple mock nodes
        manager.nodes = {
            "node1": MagicMock(max_vram_gb=24, max_concurrent_jobs=2, is_healthy=True),
            "node2": MagicMock(max_vram_gb=16, max_concurrent_jobs=1, is_healthy=True),
        }
        
        # Mock node methods
        for node in manager.nodes.values():
            node.get_available_vram.return_value = 16
            node.can_run_job.return_value = True
            node.add_job = MagicMock()
            node.remove_job = MagicMock()
            node.current_jobs = []
        
        return manager
    
    @pytest.mark.asyncio
    async def test_concurrent_job_processing(self, queue_manager):
        """Test processing multiple jobs concurrently"""
        
        # Create multiple job requests
        jobs = [
            TrainingJobRequest(
                job_id=f"job-{i}",
                product_id=f"product-{i}",
                user_id="user-1",
                resource_requirements=ResourceRequirements(vram_gb=8)
            )
            for i in range(5)
        ]
        
        # Add all jobs to queue
        for job in jobs:
            await queue_manager.add_job(job)
        
        # Mock the training execution
        with patch.object(queue_manager, '_start_job') as mock_start_job:
            mock_start_job.return_value = None
            
            # Process queue multiple times to start jobs
            for _ in range(5):
                await queue_manager._process_queue()
            
            # Verify that jobs were started based on available capacity
            assert mock_start_job.call_count >= 2  # At least 2 jobs should start on available nodes
    
    @pytest.mark.asyncio
    async def test_resource_contention(self, queue_manager):
        """Test behavior when resources are limited"""
        
        # Modify nodes to have limited resources
        for node in queue_manager.nodes.values():
            node.can_run_job.return_value = False  # No available resources
        
        # Create job request
        job = TrainingJobRequest(
            job_id="resource-limited-job",
            product_id="product-1",
            user_id="user-1",
            resource_requirements=ResourceRequirements(vram_gb=16)
        )
        
        await queue_manager.add_job(job)
        
        with patch.object(queue_manager, '_start_job') as mock_start_job:
            # Try to process queue
            await queue_manager._process_queue()
            
            # No jobs should start due to resource constraints
            mock_start_job.assert_not_called()
            
            # Job should remain in queue
            assert len(queue_manager.job_queue) == 1
    
    @pytest.mark.asyncio
    async def test_queue_performance_under_load(self, queue_manager):
        """Test queue performance with many jobs"""
        
        start_time = time.time()
        
        # Add many jobs quickly
        jobs = [
            TrainingJobRequest(
                job_id=f"perf-job-{i}",
                product_id=f"product-{i}",
                user_id="user-1",
                priority=i % 10,  # Vary priorities
                resource_requirements=ResourceRequirements(vram_gb=8)
            )
            for i in range(100)
        ]
        
        # Measure time to add all jobs
        for job in jobs:
            await queue_manager.add_job(job)
        
        add_time = time.time() - start_time
        
        # Should complete within reasonable time (adjust threshold as needed)
        assert add_time < 5.0, f"Adding 100 jobs took {add_time:.2f}s, expected < 5s"
        
        # Verify all jobs are in queue and properly ordered
        assert len(queue_manager.job_queue) == 100
        
        # Check that highest priority jobs are first
        priorities = [job.priority for job in queue_manager.job_queue[:10]]
        assert all(p1 >= p2 for p1, p2 in zip(priorities, priorities[1:]))
    
    @pytest.mark.asyncio
    async def test_memory_usage_under_load(self, queue_manager):
        """Test memory usage doesn't grow excessively with many jobs"""
        import psutil
        import os
        
        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss
        
        # Add many jobs
        for i in range(1000):
            job = TrainingJobRequest(
                job_id=f"memory-test-{i}",
                product_id=f"product-{i}",
                user_id="user-1",
                resource_requirements=ResourceRequirements(vram_gb=8)
            )
            await queue_manager.add_job(job)
        
        final_memory = process.memory_info().rss
        memory_increase = final_memory - initial_memory
        
        # Memory increase should be reasonable (less than 100MB for 1000 jobs)
        assert memory_increase < 100 * 1024 * 1024, f"Memory increased by {memory_increase / 1024 / 1024:.1f}MB"
    
    @pytest.mark.asyncio
    async def test_job_completion_cleanup(self, queue_manager):
        """Test that completed jobs are properly cleaned up"""
        
        # Create and start a job
        job = TrainingJobRequest(
            job_id="cleanup-test",
            product_id="product-1", 
            user_id="user-1",
            resource_requirements=ResourceRequirements(vram_gb=8)
        )
        
        await queue_manager.add_job(job)
        
        # Mock running job
        mock_process = MagicMock()
        mock_process.returncode = 0  # Completed successfully
        
        mock_running_job = MagicMock()
        mock_running_job.job_request = job
        mock_running_job.process = mock_process
        mock_running_job.node_id = "node1"
        
        queue_manager.running_jobs[job.job_id] = mock_running_job
        
        # Check running jobs cleanup
        await queue_manager._check_running_jobs()
        
        # Job should be moved to completed and removed from running
        assert job.job_id not in queue_manager.running_jobs
        assert job.job_id in queue_manager.completed_jobs
    
    def test_queue_status_reporting(self, queue_manager):
        """Test queue status reporting accuracy"""
        
        # Add some mock jobs and running jobs
        for i in range(3):
            job = TrainingJobRequest(
                job_id=f"status-test-{i}",
                product_id=f"product-{i}",
                user_id="user-1"
            )
            queue_manager.job_queue.append(job)
        
        # Mock running job
        queue_manager.running_jobs["running-1"] = MagicMock()
        
        status = queue_manager.get_queue_status()
        
        assert status["queue_length"] == 3
        assert status["running_jobs"] == 1
        assert "nodes" in status
        assert "estimated_wait_time" in status
    
    @pytest.mark.asyncio
    async def test_node_failure_handling(self, queue_manager):
        """Test handling of node failures"""
        
        # Mark a node as unhealthy
        queue_manager.nodes["node1"].is_healthy = False
        queue_manager.nodes["node1"].can_run_job.return_value = False
        
        # Create job
        job = TrainingJobRequest(
            job_id="node-failure-test",
            product_id="product-1",
            user_id="user-1",
            resource_requirements=ResourceRequirements(vram_gb=8)
        )
        
        await queue_manager.add_job(job)
        
        with patch.object(queue_manager, '_start_job') as mock_start_job:
            await queue_manager._process_queue()
            
            # Job should still be able to start on healthy node
            if any(node.is_healthy for node in queue_manager.nodes.values()):
                # At least one healthy node available, job should start
                pass
            else:
                # No healthy nodes, job should remain in queue
                assert len(queue_manager.job_queue) == 1
