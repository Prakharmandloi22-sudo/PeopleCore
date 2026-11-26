# PeopleCore — Employee Lifecycle, Attendance, Leave & Payroll Platform
**Assessment Level: Advanced / Very Difficult | 15 Mandatory Hands-On Assessments**

[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-Passing-emerald)](.github/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-Proprietary-blue)](#)
[![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)](python-services/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)](backend/)
[![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black?logo=next.js)](frontend/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](backend/prisma/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](docker-compose.yml)

---

## 1. Project Overview

**PeopleCore** is a production-grade enterprise Human Resource Management System (HRMS) and Workforce Management platform. Built using a decoupled, modular microservices architecture, PeopleCore manages the complete employee lifecycle from onboarding to offboarding, shift schedules, biometric/portal attendance, multi-category leave approvals, high-precision Decimal-based payroll preparation, payslip distribution, and workforce analytics.

### Five Enterprise User Roles Supported
- 👤 **Employee**: Self-service portal, live attendance clock-in/out, leave applications, personal payslips.
- 👔 **Manager**: Department overview, team attendance rosters, leave approvals, performance scorecards.
- 📋 **HR Officer**: Employee onboarding/offboarding, organization hierarchy, document compliance.
- 💰 **Payroll Specialist**: Compensation components, idempotent payroll runs, payslips, NACHA ACH bank exports.
- 🛡️ **Administrator**: System governance, role permissions, audit trails, database maintenance.

---

## 2. Mandatory Hands-on Assessment Deliverables Matrix

| Assessment | Title | Delivered Code & Artifacts | Specific Guide |
| :--- | :--- | :--- | :--- |
| **01** | **HRMS Frontend** | Next.js 14 App Router, Tailwind CSS, Lucide icons, responsive dashboards | [Assessment 01 Doc](docs/assessments/ASSESSMENT_01_FRONTEND.md) |
| **02** | **HRMS Backend APIs** | Node.js Express modular REST APIs, Zod validation, JWT, Winston logging | [Assessment 02 Doc](docs/assessments/ASSESSMENT_02_BACKEND_APIS.md) |
| **03** | **HR Database Model** | PostgreSQL 16 schema, Prisma migrations, constraints, synthetic seed script | [Assessment 03 Doc](docs/assessments/ASSESSMENT_03_DATABASE_MODEL.md) |
| **04** | **HR Data Security** | 5 RBAC roles, dynamic field-level salary masking, immutable audit logging | [Assessment 04 Doc](docs/assessments/ASSESSMENT_04_SECURITY_RBAC.md) |
| **05** | **Python Payroll Engine** | FastAPI Decimal engine, `ROUND_HALF_UP`, proration, overtime, benchmark | [Assessment 05 Doc](docs/assessments/ASSESSMENT_05_PAYROLL_ENGINE.md) |
| **06** | **FastAPI Workforce Analytics** | Headcount trends, turnover/retention rates, attendance metrics, transparent formulas | [Assessment 06 Doc](docs/assessments/ASSESSMENT_06_WORKFORCE_ANALYTICS.md) |
| **07** | **Attendance & Leave Engine** | Overnight shift evaluation (22:00-06:00), grace periods, overlap collision rejection | [Assessment 07 Doc](docs/assessments/ASSESSMENT_07_ATTENDANCE_LEAVE.md) |
| **08** | **HR Integrations** | RFC 5545 `.ics` iCalendar invites, NACHA ACH 94-char export, SHA-256 vault | [Assessment 08 Doc](docs/assessments/ASSESSMENT_08_INTEGRATIONS.md) |
| **09** | **Docker HRMS Stack** | Multi-stage Dockerfiles, `docker-compose.yml`, Nginx reverse proxy | [Assessment 09 Doc](docs/assessments/ASSESSMENT_09_DOCKER_STACK.md) |
| **10** | **Git & Payroll Governance** | Branch protection rules, dual financial codeowner signoffs, migration checklist | [Assessment 10 Doc](docs/assessments/ASSESSMENT_10_GIT_GOVERNANCE.md) |
| **11** | **HRMS CI/CD** | GitHub Actions (`.github/workflows/ci.yml`), multi-stage pipeline, security scans | [Assessment 11 Doc](docs/assessments/ASSESSMENT_11_CICD_PIPELINE.md) |
| **12** | **Payroll & HR Testing** | Pytest Decimal precision tests, Jest API tests, leap-year Feb 29 verification | [Assessment 12 Doc](docs/assessments/ASSESSMENT_12_TESTING_SUITE.md) |
| **13** | **HRMS API Documentation** | OpenAPI 3.0 YAML spec (`openapi/openapi.yaml`), Postman Collection v2.1 | [Assessment 13 Doc](docs/assessments/ASSESSMENT_13_API_DOCS.md) |
| **14** | **Secure HRMS Deployment** | VPC private subnet architecture, AES-256 backup & restore scripts, GDPR policy | [Assessment 14 Doc](docs/assessments/ASSESSMENT_14_SECURE_DEPLOYMENT.md) |
| **15** | **HRMS Incident Simulation** | Executable Python simulation (`scripts/incident_simulation.py`), 5 detailed runbooks | [Assessment 15 Doc](docs/assessments/ASSESSMENT_15_INCIDENT_SIMULATION.md) |

---

## 3. Domain Capstone Challenge

> **Challenge Requirement**: A payroll run must be reproducible and idempotent for a defined pay period. Re-running it must not create duplicate payroll entries or payments.

### Resolution & Prevention Architecture:
1. **Database Constraint**: `@@unique([payrollPeriodId, employeeId])` in PostgreSQL prevents duplicate payslip generation at the relational engine level.
2. **Status Locking**: When `status === 'FINALIZED'`, subsequent triggers are rejected with `409 Conflict`:
   ```json
   {
     "success": false,
     "error": {
       "code": "PAYROLL_ALREADY_FINALIZED",
       "message": "Payroll for period 2026-03-MONTHLY is already finalized and locked. Re-running is prohibited."
     }
   }
   ```
3. **Automated Verification**: Verified via `backend/tests/payroll_idempotency.test.ts` and `scripts/incident_simulation.py` (Scenario 2).

---

## 4. Quick Start & Local Setup

### Prerequisites
- Node.js v20+ & npm
- Python 3.10+
- PostgreSQL 16
- Git

### 1. Clone & Configure Environment
```bash
git clone <repo_url>
cd PeopleCore
cp .env.example .env
```

### 2. Setup Database & Seed Synthetic Enterprise Data
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
```

### 3. Start Python Decimal Calculation Microservice
```bash
cd python-services
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 4. Start Core Express Backend API
```bash
cd backend
npm run dev
```

### 5. Start Next.js Frontend UI
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 5. Sample Evaluator Logins

| Role | Email | Password | Access Highlights |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@peoplecore.local` | `Admin@123456` | Unmasked salary, audit logs, system config |
| **HR Officer** | `hr@peoplecore.local` | `Password@123` | Employee onboarding, document uploads |
| **Manager** | `manager@peoplecore.local` | `Password@123` | Team attendance, leave approvals |
| **Payroll Specialist** | `payroll@peoplecore.local` | `Password@123` | Payroll cycles, payslips, NACHA exports |
| **Employee** | `employee@peoplecore.local` | `Password@123` | Self-service, attendance clock, leave request |

---

## 6. Running Automated Tests & Incident Simulation

### Python Pytest Suite (Rounding, Invariants, Analytics)
```bash
set PYTHONPATH=python-services
python -m pytest python-services/app/tests -v
```

### Incident Simulation Script (5 Scenarios)
```bash
python scripts/incident_simulation.py
```

### Core API Jest Test Suite
```bash
cd backend
npm test
```

---

## 7. Running with Docker Compose

```bash
docker compose up -d --build
```
This spins up:
- `http://localhost:80` — Nginx Reverse Proxy (Routes `/` to Frontend, `/api/v1/` to Backend, `/api/python/` to Python)
- `http://localhost:3000` — Next.js Frontend
- `http://localhost:5000` — Express API (`/health` & `/ready`)
- `http://localhost:8000` — Python Microservice (`/docs`)
- `localhost:5432` — PostgreSQL 16
- `localhost:6379` — Redis 7
