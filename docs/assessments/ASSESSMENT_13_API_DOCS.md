# Assessment 13 — HRMS API Documentation Guide

## Objective
Document employee, attendance, leave, payroll, payslip, performance, and export APIs with validation and error cases.

## Documentation Deliverables
1. **OpenAPI 3.0 Specification**:
   - Location: `openapi/openapi.yaml`
   - Defines all data schemas, request parameters, responses, and security bearer token requirements.
2. **Postman Collection v2.1**:
   - Location: `openapi/peoplecore_postman_collection.json`
   - Contains 9 pre-configured requests covering authentication, employees, clock-in, overnight clock-out, leave requests, idempotent payroll execution, NACHA ACH exports, and Python analytics queries.
3. **Interactive Swagger UI**:
   - Available at `http://localhost:8000/docs` when running the Python microservice.
