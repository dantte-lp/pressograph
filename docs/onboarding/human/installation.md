# Installation Guide

This guide will walk you through installing Pressograph on your system.

## Prerequisites

Before installing Pressograph, ensure you have the following:

- **Podman** or **Docker** (v20.10+)
- **Podman Compose** or **Docker Compose** (v2.0+)
- **Git** for cloning the repository
- At least **2GB RAM** available
- At least **10GB disk space**

## Installation Methods

### Method 1: Podman Compose (Recommended)

This is the recommended method for production deployments.

#### 1. Clone the repository

```bash
git clone https://github.com/dantte-lp/pressograph.git
cd pressograph
```

#### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and configure the following variables:

```bash
# Database
POSTGRES_PASSWORD=your_secure_password_here

# JWT Secrets (IMPORTANT: Change in production!)
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# CORS
ALLOWED_ORIGINS=https://yourdomain.com

# Base URL
BASE_URL=https://api.yourdomain.com
```

#### 3. Start services

```bash
podman-compose up -d
```

This will:

- Start PostgreSQL 18.0 with optimized configuration
- Run database migrations
- Start the backend API server
- Start the frontend web server

#### 4. Verify installation

Check that all services are running:

```bash
podman-compose ps
```

You should see three services: `postgres`, `backend`, and `frontend`.

#### 5. Access the application

Open your browser and navigate to:

```
http://localhost:5173
```

You'll be greeted with the setup wizard to create your admin account.

### Method 2: Development Installation

For development purposes, you can run the services locally without containers.

#### 1. Install dependencies

```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

#### 2. Setup PostgreSQL

Install PostgreSQL 18.0 locally and create a database:

```bash
createdb pressograph
psql pressograph < server/migrations/1_initial_schema.sql
```

#### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your local database credentials.

#### 4. Start development servers

Terminal 1 (Frontend):

```bash
npm run dev
```

Terminal 2 (Backend):

```bash
cd server
npm run dev
```

#### 5. Access the application

Frontend: `http://localhost:5173`
Backend API: `http://localhost:3001`

## Initial Setup

### Creating Admin Account

On first launch, you'll see the setup wizard:

1. Navigate to `http://localhost:5173/setup`
2. Fill in admin account details:
   - Username
   - Email
   - Password (minimum 8 characters)
3. Click "Complete Setup"

Your admin account will be created and you'll be automatically logged in.

## Verification

### Health Check

Verify the backend is running:

```bash
curl http://localhost:3001/health
```

Expected response:

```json
{
  "status": "healthy",
  "uptime": 123.45,
  "timestamp": "2025-10-28T12:00:00.000Z"
}
```

### Database Connection

Check PostgreSQL is accessible:

```bash
podman exec -it pressograph-db psql -U pressograph -c "SELECT version();"
```

## Troubleshooting

### Port Already in Use

If ports 3001 or 5173 are already in use, modify them in `.env`:

```bash
BACKEND_PORT=8001
FRONTEND_PORT=8080
```

### Database Connection Issues

Check PostgreSQL logs:

```bash
podman logs pressograph-db
```

Verify database credentials in `.env` match the configuration.

### Permission Denied

Ensure the current user has permissions to run Podman:

```bash
sudo usermod -aG podman $USER
newgrp podman
```

## Next Steps

- [API Reference](../api/overview.md) - API documentation
- [Release Notes](../release-notes.md) - Version history and changes
- [TODO](../TODO.md) - Roadmap and planned features

## Uninstallation

To remove Pressograph:

```bash
podman-compose down -v
```

This will stop and remove all containers and volumes (including the database).
