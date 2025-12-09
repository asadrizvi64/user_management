-- Migration: Restructure database for multi-tenant support
-- Date: 2025-12-09
-- Description: Add organization support and update user roles

-- WARNING: This migration will delete all existing data!
-- Backup your database before running this migration.

-- Step 1: Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT 1,
    max_workers INTEGER NOT NULL DEFAULT 10,
    max_storage_gb INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON organizations(is_active);

-- Step 2: Drop and recreate users table with new structure
-- (This will delete all existing users!)
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'worker',  -- super_admin, admin, worker
    is_active BOOLEAN NOT NULL DEFAULT 1,
    organization_id INTEGER,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Step 3: Add organization_id to products table
-- Backup products if you need the data
ALTER TABLE products ADD COLUMN organization_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_products_organization_id ON products(organization_id);

-- Step 4: Add organization_id to training_jobs table
ALTER TABLE training_jobs ADD COLUMN organization_id INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_training_jobs_organization_id ON training_jobs(organization_id);

-- Step 5: Add organization_id to generations table
ALTER TABLE generations ADD COLUMN organization_id INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_generations_organization_id ON generations(organization_id);

-- Step 6: Add organization_id to reports table (if exists)
CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    data JSON,
    parameters JSON,
    generated_by INTEGER NOT NULL,
    organization_id INTEGER NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (generated_by) REFERENCES users(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE INDEX IF NOT EXISTS idx_reports_organization_id ON reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_reports_report_type ON reports(report_type);

-- Step 7: Insert default data
-- Create super admin
INSERT INTO users (username, email, hashed_password, full_name, role, is_active, organization_id, created_by)
VALUES ('superadmin', 'superadmin@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyiUjpbvz7sO', 'Super Administrator', 'super_admin', 1, NULL, NULL);
-- Note: Password is 'superadmin123' (you should change the hash or regenerate it)

-- Create sample organization
INSERT INTO organizations (name, description, contact_email, contact_phone, max_workers, max_storage_gb, is_active)
VALUES ('Sample Organization', 'A sample organization for testing', 'admin@sampleorg.com', '+1234567890', 50, 500, 1);

-- Create sample admin for organization (org_id = 1)
INSERT INTO users (username, email, hashed_password, full_name, role, is_active, organization_id, created_by)
VALUES ('admin', 'admin@sampleorg.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyiUjpbvz7sO', 'Organization Admin', 'admin', 1, 1, 1);
-- Note: Password is 'admin123' (you should change the hash or regenerate it)

-- Create sample worker for organization (org_id = 1)
INSERT INTO users (username, email, hashed_password, full_name, role, is_active, organization_id, created_by)
VALUES ('worker', 'worker@sampleorg.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyiUjpbvz7sO', 'Sample Worker', 'worker', 1, 1, 2);
-- Note: Password is 'worker123' (you should change the hash or regenerate it)

-- Migration complete!
-- Remember to:
-- 1. Update all existing products, training_jobs, generations with correct organization_id
-- 2. Change all default passwords
-- 3. Test the multi-tenant isolation
