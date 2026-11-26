# Assessment 11 — HRMS CI/CD Implementation Guide

## Objective
Run payroll calculation tests, API tests, security scans, Docker builds, migration validation, and approval-controlled deployment.

## GitHub Actions Workflow (`.github/workflows/ci.yml`)

### Pipeline Stages
1. **lint-and-typecheck**: Validates TypeScript contracts and Prisma schema.
2. **python-tests**: Executes pytest suite for Decimal payroll math and analytics formulas.
3. **backend-tests**: Spins up a transient PostgreSQL service container, runs database migrations, and executes the Jest test suite.
4. **docker-build**: Validates multi-stage Docker builds for backend, frontend, and Python microservices.
5. **security-scan**: Audits npm and pip dependencies for high/critical vulnerabilities.
