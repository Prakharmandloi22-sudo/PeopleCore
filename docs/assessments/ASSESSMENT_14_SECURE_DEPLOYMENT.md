# Assessment 14 — Secure HRMS Deployment Guide

## Objective
Deploy with HTTPS, private database access, secret management, encrypted backups, restore verification, monitoring, and retention policies.

## Key Deployment Implementations
- **Detailed Specification**: Refer to `docs/DEPLOYMENT.md`.
- **Private Database VPC**: PostgreSQL and Redis run on private isolated subnets without public internet exposure.
- **Automated Encrypted Backups**:
  - Script: `scripts/backup_postgres.sh` (compressed dump + SHA-256 hash + AES-256-CBC encryption).
- **Automated Restore Verification**:
  - Script: `scripts/restore_postgres.sh` (decrypts, validates gzip, restores to verification DB, asserts employee counts).
- **Data Retention Standards**: 7-year payroll tax retention with automated policy-based disposal.
