
# tests/integration/test_training_workflow.py
import pytest
import asyncio
import tempfile
import shutil
from pathlib import Path
from unittest.mock import patch, MagicMock

from training_service import ProductTrainingService
from training_queue_manager import TrainingQueueManager, TrainingJobRequest, ResourceRequirements
from services.fluxgym_adapter import FluxGymAdapter, FluxGymConfig


class TestTrainingWorkflow:
    
    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for integration tests"""
        temp_dir = tempfile.mkdtemp()
        yield Path(temp_dir)
        shutil.rmtree(temp_dir)
    
    @pytest.fixture
    def mock_db_session(self):
        """Mock database session"""
        session = MagicMock()
        return lambda: session
    
    @pytest.fixture
    def queue_manager(self, mock_db_session):
        """Create queue manager instance"""
        return TrainingQueueManager(mock_db_session)
    
    @pytest.fixture
    def training_service(self, temp_dir):
        """Create training service instance"""
        return ProductTrainingService(base_path=str(temp_dir))
    
    @pytest.fixture
    def sample_job_request(self):
        """Sample training job request"""
        return TrainingJobRequest(
            job_id="test-job-123",
            product_id="product-456",
            user_id="user-789",
            priority=1,
            resource_requirements=ResourceRequirements(vram_gb=16),
            config={
                "base_model": "flux-dev",
                "trigger_word": "TESTPROD",
                "max_epochs": 2,
                "vram": "16G"
            }
        )
    
    @pytest.mark.asyncio
    async def test_complete_training_workflow(self, queue_manager, training_service, sample_job_request, temp_dir):
        """Test complete training workflow from queue to completion"""
        
        # Mock the actual training execution
        with patch.object(training_service, '_execute_training') as mock_execute:
            mock_execute.return_value = 0  # Success return code
            
            # Add job to queue
            await queue_manager.add_job(sample_job_request)
            
            # Verify job is in queue
            assert len(queue_manager.job_queue) == 1
            
            # Start queue processor (run one iteration)
            with patch.object(queue_manager, '_find_available_node') as mock_find_node:
                mock_node = MagicMock()
                mock_node.can_run_job.return_value = True
                mock_node.node_id = "test-node"
                mock_find_node.return_value = mock_node
                
                await queue_manager._process_queue()
                
                # Verify job was started
                assert len(queue_manager.running_jobs) == 1
                assert len(queue_manager.job_queue) == 0
    
    @pytest.mark.asyncio
    async def test_queue_priority_ordering(self, queue_manager):
        """Test that jobs are processed in priority order"""
        
        # Create jobs with different priorities
        jobs = [
            TrainingJobRequest(job_id="low", product_id="p1", user_id="u1", priority=1),
            TrainingJobRequest(job_id="high", product_id="p2", user_id="u1", priority=10),
            TrainingJobRequest(job_id="medium", product_id="p3", user_id="u1", priority=5),
        ]
        
        # Add jobs in random order
        for job in jobs:
            await queue_manager.add_job(job)
        
        # Verify they're ordered by priority (high to low)
        job_ids = [job.job_id for job in queue_manager.job_queue]
        assert job_ids == ["high", "medium", "low"]
    
    @pytest.mark.asyncio
    async def test_resource_validation(self, queue_manager):
        """Test resource requirement validation"""
        
        # Create job requiring more VRAM than available
        high_vram_job = TrainingJobRequest(
            job_id="high-vram",
            product_id="p1",
            user_id="u1",
            resource_requirements=ResourceRequirements(vram_gb=128)  # Unrealistic requirement
        )
        
        # This should fail validation
        result = await queue_manager.add_job(high_vram_job)
        assert result == False
    
    @pytest.mark.asyncio
    async def test_job_cancellation(self, queue_manager, sample_job_request):
        """Test job cancellation functionality"""
        
        # Add job to queue
        await queue_manager.add_job(sample_job_request)
        assert len(queue_manager.job_queue) == 1
        
        # Cancel the job
        result = await queue_manager.cancel_job(sample_job_request.job_id)
        assert result == True
        assert len(queue_manager.job_queue) == 0
    
    def test_fluxgym_adapter_integration(self, temp_dir):
        """Test FluxGym adapter integration"""
        
        # Create mock FluxGym directory
        fluxgym_dir = temp_dir / "fluxgym"
        fluxgym_dir.mkdir()
        
        # Create mock models.yaml
        models_file = fluxgym_dir / "models.yaml"
        models_file.write_text("""
flux-dev:
  repo: "test/repo"
  file: "test.safetensors"
  base: "test-base"
""")
        
        # Create mock sd-scripts directory with required files
        sd_scripts_dir = fluxgym_dir / "sd-scripts"
        sd_scripts_dir.mkdir()
        
        (sd_scripts_dir / "flux_train_network.py").touch()
        
        networks_dir = sd_scripts_dir / "networks"
        networks_dir.mkdir()
        (networks_dir / "lora_flux.py").touch()
        
        # Test adapter initialization
        adapter = FluxGymAdapter(str(fluxgym_dir))
        
        assert adapter.fluxgym_path == fluxgym_dir
        assert "flux-dev" in adapter.get_available_models()
    
    def test_config_validation(self, temp_dir):
        """Test training configuration validation"""
        
        fluxgym_dir = temp_dir / "fluxgym"
        fluxgym_dir.mkdir()
        
        # Create minimal setup for adapter
        models_file = fluxgym_dir / "models.yaml"
        models_file.write_text("flux-dev:\n  repo: test\n  file: test.safetensors")
        
        sd_scripts_dir = fluxgym_dir / "sd-scripts"
        sd_scripts_dir.mkdir()
        (sd_scripts_dir / "flux_train_network.py").touch()
        
        networks_dir = sd_scripts_dir / "networks"
        networks_dir.mkdir()
        (networks_dir / "lora_flux.py").touch()
        
        adapter = FluxGymAdapter(str(fluxgym_dir))
        
        # Test valid configuration
        valid_config = FluxGymConfig(
            base_model="flux-dev",
            lora_name="test",
            concept_sentence="TEST",
            max_train_epochs=4,
            network_dim=8,
            resolution=512
        )
        
        issues = adapter.validate_training_setup(valid_config)
        assert len(issues) == 0
        
        # Test invalid configuration
        invalid_config = FluxGymConfig(
            base_model="nonexistent-model",
            lora_name="test",
            concept_sentence="TEST",
            max_train_epochs=2000,  # Too high
            network_dim=256,  # Too high
            resolution=64  # Too low
        )
        
        issues = adapter.validate_training_setup(invalid_config)
        assert len(issues) > 0