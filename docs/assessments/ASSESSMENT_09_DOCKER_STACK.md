# Assessment 09 — Docker HRMS Stack Implementation Guide

## Objective
Containerize frontend, API, payroll service, analytics, PostgreSQL, Redis, and scheduled workers with secure configuration.

## Docker Architecture

1. `docker/Dockerfile.backend`: Multi-stage Alpine container for Express API with dumb-init for graceful signal handling.
2. `docker/Dockerfile.python`: Lightweight Python 3.11 container with non-root security user (`appuser`).
3. `docker/Dockerfile.frontend`: Multi-stage Next.js standalone container.
4. `docker/nginx.conf`: Hardened reverse proxy with security headers and rate-limiting.
5. `docker-compose.yml`:
   - Orchestrates `postgres`, `redis`, `python-service`, `backend`, `frontend`, and `nginx`.
   - Healthcheck dependencies ensure orderly startup (Postgres healthy -> Backend boot).
   - Segregated bridge network (`peoplecore-network`) and persistent storage volumes.

## Verification
- Run compose stack: `docker compose up -d --build`
- Verify services: `docker compose ps`
