# PeopleCore HRMS — Secure Production Deployment Architecture
**Assessment 14 | Technical Skills Evaluation Cohort**

---

## 1. Network Topology & VPC Isolation

PeopleCore is architected with three segregated network tiers:

```
+--------------------------------------------------------------------------------+
| AWS / GCP Cloud VPC (10.0.0.0/16)                                              |
|                                                                                |
|  [Public DMZ Subnet: 10.0.1.0/24]                                              |
|      +-------------------------------------------------------------+           |
|      | Nginx Reverse Proxy / Cloud Load Balancer                   |           |
|      | - Port 443 (HTTPS / TLS 1.3 Only with Strict HSTS)          |           |
|      | - DDoS Mitigation & Rate Limiting (20 req/sec)              |           |
|      +-------------------------------------------------------------+           |
|                                     |                                          |
|  [Private Application Subnet: 10.0.2.0/24]                                     |
|      +--------------------------------+   +------------------------------+     |
|      | Next.js Frontend (Port 3000)   |-->| Express API Core (Port 5000) |     |
|      +--------------------------------+   +------------------------------+     |
|                                                         |                      |
|                                           +------------------------------+     |
|                                           | Python Microservice (8000)   |     |
|                                           +------------------------------+     |
|                                                         |                      |
|  [Isolated Database Subnet: 10.0.3.0/24] (No Internet Inbound Access)          |
|      +--------------------------------+   +------------------------------+     |
|      | PostgreSQL 16 (Port 5432)      |   | Redis 7 Broker (Port 6379)  |     |
|      | - Encrypted Storage at Rest    |   | - Encrypted in transit       |     |
|      +--------------------------------+   +------------------------------+     |
+--------------------------------------------------------------------------------+
```

---

## 2. Hardened HTTPS & TLS Configuration

Nginx enforces high-grade cipher suites and security headers:
- **Protocols**: TLSv1.2, TLSv1.3 only (SSLv3, TLSv1.0, and TLSv1.1 disabled).
- **Ciphers**: `ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384`.
- **HSTS**: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
- **Content Security Policy (CSP)**: Disallows unauthorized external scripts and framing.

---

## 3. Secret Management & Non-Exposure Standards

- **Zero Secrets in Git**: No credentials, private keys, or API tokens are checked into version control.
- **Runtime Injection**: Secrets are injected at container boot via AWS Secrets Manager, HashiCorp Vault, or Docker Secret files.
- **Key Rotation**:
  - JWT Access Secrets rotated every 90 days.
  - Database master credentials rotated automatically using cloud managed rotation.

---

## 4. Automated Encrypted Backup & Restore Verification

Database protection employs automated daily backups using `scripts/backup_postgres.sh`:
1. **Atomic Dump**: `pg_dump` with gzip compression.
2. **Cryptographic Checksum**: SHA-256 fingerprint generated prior to encryption.
3. **AES-256 Encryption**: `openssl enc -aes-256-cbc -salt -pbkdf2` encrypts the archive with a secure passphrase.
4. **Off-site Sync**: Transferred to an air-gapped immutable S3 bucket with Object Lock enabled.
5. **Automated Verification**: `scripts/restore_postgres.sh` executes weekly in an isolated test environment to verify decryptability, schema integrity, and record counts.

---

## 5. Data Retention & Privacy Policy (GDPR / Statutory Compliance)

| Data Entity | Retention Period | Statutory Driver | Disposal Mechanism |
| :--- | :--- | :--- | :--- |
| Payroll Records & Payslips | 7 Years | IRS / Statutory Tax Law | Automated archival to cold glacier storage |
| Identity Scans & Contracts | Employment Term + 5 Years | Labor & Contract Law | Cryptographic shredding upon retention expiry |
| Daily Attendance & Check-in | 3 Years | FLSA Overtime Compliance | Partition drop and automated archival |
| Security Audit Logs | 3 Years | SOC 2 / ISO 27001 | Immutable write-once audit storage |
