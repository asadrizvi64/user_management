-- Migration: Add cloud integration fields to training_jobs and create model_deployments table
-- Date: 2025-11-30
-- Description: Adds support for RunPod and fal.ai cloud integration

-- Step 1: Add cloud-related fields to training_jobs table
ALTER TABLE training_jobs ADD COLUMN provider VARCHAR(20) DEFAULT 'local';
ALTER TABLE training_jobs ADD COLUMN cloud_pod_id VARCHAR(200);
ALTER TABLE training_jobs ADD COLUMN cloud_metadata JSON;

-- Step 2: Create model_deployments table for tracking fal.ai deployments
CREATE TABLE IF NOT EXISTS model_deployments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_name VARCHAR(100) NOT NULL,
    training_job_id INTEGER,
    provider VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    lora_url VARCHAR(500),
    endpoint_url VARCHAR(500),
    trigger_word VARCHAR(100),
    metadata JSON,
    deployed_by INTEGER NOT NULL,
    deployed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (training_job_id) REFERENCES training_jobs(id),
    FOREIGN KEY (deployed_by) REFERENCES users(id)
);

CREATE INDEX idx_model_deployments_product ON model_deployments(product_name);
CREATE INDEX idx_model_deployments_status ON model_deployments(status);

-- Step 3: Add index for cloud_pod_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_training_jobs_cloud_pod ON training_jobs(cloud_pod_id);
CREATE INDEX IF NOT EXISTS idx_training_jobs_provider ON training_jobs(provider);
