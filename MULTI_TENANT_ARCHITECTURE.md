# Multi-Tenant Architecture Documentation

## Overview

The database has been restructured to support a **multi-tenant architecture** with a three-tier user hierarchy:

```
┌─────────────────────────────────────────┐
│         SUPER ADMIN (You)               │
│  - System owner                         │
│  - Access to all organizations          │
│  - Manage all admins and stats          │
└────────────┬────────────────────────────┘
             │
             │ manages
             ├──────────────────┬──────────────────┬──────────────────┐
             ▼                  ▼                  ▼                  ▼
    ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
    │  ADMIN (Org 1) │  │  ADMIN (Org 2) │  │  ADMIN (Org 3) │  │  ADMIN (Org N) │
    │  - Client 1    │  │  - Client 2    │  │  - Client 3    │  │  - Client N    │
    │  - Paid access │  │  - Paid access │  │  - Paid access │  │  - Paid access │
    └───────┬────────┘  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘
            │                   │                   │                   │
            │ creates           │ creates           │ creates           │ creates
            ▼                   ▼                   ▼                   ▼
    ┌───────────────┐   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
    │ WORKER 1      │   │ WORKER 1      │   │ WORKER 1      │   │ WORKER 1      │
    │ WORKER 2      │   │ WORKER 2      │   │ WORKER 2      │   │ WORKER 2      │
    │ WORKER N      │   │ WORKER N      │   │ WORKER N      │   │ WORKER N      │
    │               │   │               │   │               │   │               │
    │ Use image     │   │ Use image     │   │ Use image     │   │ Use image     │
    │ generator     │   │ generator     │   │ generator     │   │ generator     │
    └───────────────┘   └───────────────┘   └───────────────┘   └───────────────┘
```

## User Roles

### 1. SUPER_ADMIN
- **Who**: You (the system owner)
- **Access**: Full system access
- **Capabilities**:
  - View and manage all organizations
  - View and manage all users across all organizations
  - Create new organizations
  - Create admins for organizations
  - Access all statistics and data
  - System-level configuration

### 2. ADMIN
- **Who**: Your clients who purchased the product
- **Access**: Limited to their own organization
- **Capabilities**:
  - Create and manage workers/artists in their organization
  - View all workers in their organization
  - Access statistics for their organization
  - Use the image generator tool
  - Cannot access other organizations' data
  - Cannot create other admins

### 3. WORKER
- **Who**: Artists/employees created by admins
- **Access**: Limited to their own account within an organization
- **Capabilities**:
  - Use the image generator tool
  - View their own profile
  - Cannot create users
  - Cannot access other users' data

## Database Schema Changes

### New Tables

#### 1. `organizations`
```sql
CREATE TABLE organizations (
    id INTEGER PRIMARY KEY,
    name VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    max_workers INTEGER DEFAULT 10,
    max_storage_gb INTEGER DEFAULT 100,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Updated Tables

#### 2. `users` (Updated)
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'worker',  -- super_admin | admin | worker
    is_active BOOLEAN DEFAULT TRUE,

    -- New multi-tenant fields
    organization_id INTEGER REFERENCES organizations(id),  -- NULL for super_admin
    created_by INTEGER REFERENCES users(id),  -- Who created this user

    created_at TIMESTAMP,
    last_login TIMESTAMP
);
```

#### 3. Other Tables (Updated)
All data tables now include `organization_id` for tenant isolation:
- `products` → organization_id
- `training_jobs` → organization_id
- `generations` → organization_id
- `reports` → organization_id

## API Endpoints

### Organizations (`/api/organizations/`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Super Admin, Admin | List organizations |
| GET | `/{id}` | Super Admin, Admin (own) | Get organization details |
| POST | `/` | Super Admin only | Create organization |
| PUT | `/{id}` | Super Admin only | Update organization |
| DELETE | `/{id}` | Super Admin only | Delete organization |
| GET | `/{id}/stats` | Super Admin, Admin (own) | Get organization statistics |

### Users (`/api/users/`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Super Admin, Admin | List users (filtered by organization) |
| GET | `/{id}` | Super Admin, Admin (org), Worker (self) | Get user details |
| POST | `/` | Super Admin, Admin | Create user |
| PUT | `/{id}` | Super Admin, Admin (org), Worker (self, limited) | Update user |
| DELETE | `/{id}` | Super Admin, Admin (org) | Delete user |
| POST | `/{id}/toggle-status` | Super Admin, Admin (org) | Toggle user status |
| GET | `/organization/{id}/workers` | Super Admin, Admin (own org) | List workers in organization |

## Data Isolation

### How It Works

1. **Super Admin Access**
   - Can query all data across all organizations
   - No filtering applied

2. **Admin Access**
   - All queries automatically filtered by `organization_id`
   - Can only see data belonging to their organization
   - Cannot access other organizations' data

3. **Worker Access**
   - Can only access their own data
   - Cannot view other users in their organization

### Example Queries

```python
# Super Admin - sees all users
users = db.query(User).all()

# Admin - only sees users in their organization
users = db.query(User).filter(
    User.organization_id == current_user.organization_id
).all()

# Worker - only sees themselves
user = db.query(User).filter(
    User.id == current_user.id
).first()
```

## Security Implementation

### Authorization Helpers (`backend/core/security.py`)

```python
# Check if user has access to organization
check_organization_access(user, organization_id)

# Check if user can access target user
check_user_access(current_user, target_user)

# Check if user can create specific role
can_create_user(current_user, role, organization_id)
```

### Dependencies

```python
# Require any authenticated user
Depends(get_current_user)

# Require admin or super admin
Depends(get_current_admin_user)

# Require super admin only
Depends(get_current_super_admin_user)
```

## Setup Instructions

### 1. Initialize Database

```bash
cd backend
python init_db.py
```

This creates:
- Super admin account: `superadmin` / `superadmin123`
- Sample organization: "Sample Organization"
- Sample admin: `admin` / `admin123`
- Sample worker: `worker` / `worker123`

### 2. Change Default Passwords

⚠️ **IMPORTANT**: Change all default passwords immediately!

### 3. Create Your First Client Organization

As super admin:

```bash
# Login as super admin
POST /api/auth/login
{
  "username": "superadmin",
  "password": "superadmin123"
}

# Create organization
POST /api/organizations/
{
  "name": "Client Company Inc",
  "description": "First client organization",
  "contact_email": "admin@clientcompany.com",
  "max_workers": 20,
  "max_storage_gb": 500
}

# Create admin for the organization
POST /api/users/
{
  "username": "client_admin",
  "email": "admin@clientcompany.com",
  "password": "secure_password",
  "full_name": "Client Admin",
  "role": "admin",
  "organization_id": 2  # ID from previous step
}
```

### 4. Admin Creates Workers

As admin:

```bash
# Login as admin
POST /api/auth/login
{
  "username": "client_admin",
  "password": "secure_password"
}

# Create worker
POST /api/users/
{
  "username": "artist1",
  "email": "artist1@clientcompany.com",
  "password": "worker_password",
  "full_name": "Artist One",
  "role": "worker",
  "organization_id": 2  # Admin's organization
}
```

## Migration from Old Database

If you have existing data:

1. **Backup your database**
   ```bash
   cp product_training.db product_training.db.backup
   ```

2. **Run migration**
   ```bash
   # For SQLite
   sqlite3 product_training.db < migrations/restructure_multi_tenant.sql
   ```

3. **Manually assign organization IDs**
   - All existing data will be assigned to organization ID 1 (Sample Organization)
   - You may need to reassign data to correct organizations

⚠️ **WARNING**: The migration will delete all existing users! Backup first!

## Testing Multi-Tenant Isolation

### Test 1: Admin Can Only See Their Organization

```bash
# Login as admin from Org 1
POST /api/auth/login
{
  "username": "admin_org1",
  "password": "password"
}

# Try to list users - should only see Org 1 users
GET /api/users/

# Try to access user from Org 2 - should get 403
GET /api/users/{org2_user_id}
```

### Test 2: Worker Can Only Access Their Own Data

```bash
# Login as worker
POST /api/auth/login
{
  "username": "worker1",
  "password": "password"
}

# Try to list users - should get 403
GET /api/users/

# Try to access own profile - should work
GET /api/users/{own_user_id}
```

### Test 3: Super Admin Has Full Access

```bash
# Login as super admin
POST /api/auth/login
{
  "username": "superadmin",
  "password": "superadmin123"
}

# Can see all organizations
GET /api/organizations/

# Can see all users across all organizations
GET /api/users/

# Can filter by organization
GET /api/users/?organization_id=2
```

## Best Practices

### 1. Organization Management
- Create one organization per client
- Set appropriate `max_workers` limits
- Set realistic `max_storage_gb` limits
- Use descriptive organization names

### 2. User Management
- Admins should create workers as needed
- Workers should only be created by their organization's admin
- Regularly audit user accounts

### 3. Security
- Change all default passwords immediately
- Use strong passwords for all accounts
- Regularly review user access
- Monitor failed login attempts

### 4. Data Isolation
- Always verify organization_id when creating data
- Test multi-tenant isolation regularly
- Ensure all queries filter by organization

## Troubleshooting

### Issue: Admin can't create workers

**Solution**: Ensure the admin is creating workers with their own organization_id:

```python
# Correct
{
  "organization_id": admin.organization_id  # Admin's org
}

# Wrong
{
  "organization_id": 999  # Different org - will fail
}
```

### Issue: Worker can't use image generator

**Solution**: Verify the worker has an active account and belongs to an active organization:

```sql
SELECT u.*, o.is_active as org_active
FROM users u
JOIN organizations o ON u.organization_id = o.id
WHERE u.id = {worker_id};
```

### Issue: Data not isolated between organizations

**Solution**: Check that all queries include organization filtering:

```python
# Always filter by organization for admins
if user.role == UserRole.ADMIN:
    query = query.filter(
        Model.organization_id == user.organization_id
    )
```

## Support

For issues or questions:
1. Check the logs in `backend/logs/`
2. Verify database schema with `sqlite3 product_training.db ".schema"`
3. Test authorization with different user roles
4. Review the security.py helpers

## Future Enhancements

Potential improvements:
- [ ] Organization billing and subscription management
- [ ] Usage quotas per organization
- [ ] Organization-level settings
- [ ] Cross-organization sharing (with permissions)
- [ ] Organization analytics dashboard
- [ ] API rate limiting per organization
- [ ] Organization-specific branding
