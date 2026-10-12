-- ============================================================================
-- ProductionPulse BPMS - Relational SQL Database Architecture (PostgreSQL)
-- Fresh Database Initialization, Schema Definition & Clean-Slate Migration
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean-Slate: Purge any legacy tables and custom types
DROP TABLE IF EXISTS project_feedback CASCADE;
DROP TABLE IF EXISTS hour_logs CASCADE;
DROP TABLE IF EXISTS project_assignments CASCADE;
DROP TABLE IF EXISTS access_requests CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS admin_audit_logs CASCADE;

DROP TYPE IF EXISTS feedback_sentiment CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS access_request_status CASCADE;
DROP TYPE IF EXISTS availability_status CASCADE;
DROP TYPE IF EXISTS primary_discipline CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- ----------------------------------------------------------------------------
-- 1. ENUMS DEFINITIONS
-- ----------------------------------------------------------------------------

CREATE TYPE user_role AS ENUM (
    'SUPER_ADMIN',
    'ADMIN',
    'BIM_DIRECTOR',
    'BIM_COORDINATOR',
    'BIM_SPECIALIST',
    'EDITOR',
    'VIEWER'
);

CREATE TYPE primary_discipline AS ENUM (
    'BIM - ACS',
    'Structure',
    'MEP - HVAC',
    'MEP - Electrical',
    'MEP - Plumbing',
    'Fire Protection',
    'Façade / Envelope',
    'Coordination & QA',
    'AI & Automation'
);

CREATE TYPE availability_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'ON_LEAVE'
);

CREATE TYPE access_request_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);

CREATE TYPE project_status AS ENUM (
    'ACTIVE',
    'COMPLETED',
    'ARCHIVED'
);

CREATE TYPE feedback_sentiment AS ENUM (
    'Positive / Commendation',
    'Neutral / Note',
    'Critical / Action Required'
);

-- ----------------------------------------------------------------------------
-- 2. TABLES DEFINITIONS
-- ----------------------------------------------------------------------------

-- A. users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    role user_role NOT NULL DEFAULT 'EDITOR',
    primary_discipline primary_discipline NOT NULL DEFAULT 'BIM - ACS',
    weekly_capacity_hrs INT NOT NULL DEFAULT 40,
    availability_status availability_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- B. access_requests Table (Sign-in & Gating Queue)
CREATE TABLE access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    applicant_email VARCHAR(255) NOT NULL,
    discipline VARCHAR(100) NOT NULL DEFAULT 'BIM - ACS',
    reason_for_access TEXT NOT NULL,
    requested_role VARCHAR(50) NOT NULL DEFAULT 'Editor',
    status access_request_status NOT NULL DEFAULT 'PENDING',
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- C. projects Table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_code VARCHAR(50) UNIQUE NOT NULL,
    project_name VARCHAR(200) NOT NULL,
    status project_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- D. project_assignments Table
CREATE TABLE project_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_hours DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    logged_hours DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    start_date DATE,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_project_user_assignment UNIQUE (project_id, user_id)
);

-- D2. hour_logs Table
CREATE TABLE hour_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_hours DECIMAL(10,2) DEFAULT 0.00,
    logged_hours DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    start_date DATE,
    due_date DATE,
    work_date DATE DEFAULT CURRENT_DATE,
    task_description TEXT,
    discipline VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- E. project_feedback Table (Public Client Portal)
CREATE TABLE project_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    star_rating DECIMAL(2,1) NOT NULL,
    feedback_category VARCHAR(100) NOT NULL,
    sentiment feedback_sentiment NOT NULL,
    author_name VARCHAR(150) NOT NULL,
    author_role VARCHAR(100) NOT NULL,
    comments TEXT NOT NULL,
    action_items TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_star_rating_range CHECK (star_rating >= 1.0 AND star_rating <= 5.0)
);

-- ----------------------------------------------------------------------------
-- 3. INDEXES FOR PERFORMANCE & QUERY OPTIMIZATION
-- ----------------------------------------------------------------------------

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_access_requests_applicant_email ON access_requests(applicant_email);
CREATE INDEX idx_access_requests_status ON access_requests(status);
CREATE INDEX idx_projects_code ON projects(project_code);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_assignments_project ON project_assignments(project_id);
CREATE INDEX idx_assignments_user ON project_assignments(user_id);
CREATE INDEX idx_hour_logs_project ON hour_logs(project_id);
CREATE INDEX idx_hour_logs_user ON hour_logs(user_id);
CREATE INDEX idx_feedback_project ON project_feedback(project_id);

-- ----------------------------------------------------------------------------
-- 4. PRE-SEEDED SINGLE SUPER ADMIN ACCOUNT
-- ----------------------------------------------------------------------------

INSERT INTO users (
    full_name,
    email,
    role,
    primary_discipline,
    weekly_capacity_hrs,
    availability_status
) VALUES (
    'Sushoovan Das',
    'modelatech2026@gmail.com',
    'SUPER_ADMIN',
    'BIM - ACS',
    40,
    'ACTIVE'
) ON CONFLICT (email) DO UPDATE SET
    role = 'SUPER_ADMIN',
    availability_status = 'ACTIVE';
