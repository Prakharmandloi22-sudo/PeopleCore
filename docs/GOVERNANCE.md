# PeopleCore HRMS — Git & Payroll Code Governance Manual
**Assessment 10 | Technical Skills Evaluation Cohort**

---

## 1. Governance Principles & Strict Separation of Concerns

Because PeopleCore manages financial compensation, tax withholding, bank direct deposits, and sensitive employee identity documents, code governance is subject to formal financial and security controls.

1. **Least Privilege Commit Authority**: Direct commits to `main` and `develop` branches are permanently blocked.
2. **Dual-Signoff Financial Policy**: Any change affecting `python-services/app/payroll/`, `SalaryComponent`, or Prisma financial models requires mandatory review and signoff from at least two designated codeowners:
   - **Lead Payroll / Financial Architect** (`@finance-lead`)
   - **Principal Systems / Security Architect** (`@sec-arch`)
3. **Traceability & Non-Repudiation**: Every commit must be signed with a GPG key, linked to an approved issue/RFC ticket, and validated by automated CI/CD checks.

---

## 2. GitHub Protected Branch Ruleset

| Branch Pattern | Minimum Required Approvals | Dismiss Stale Approvals | Require Linear History | Enforce Admins | Required Status Checks |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `main` | 2 Approvals (Inc. Codeowner) | Enabled | Enabled | Enabled | `lint-and-typecheck`, `python-tests`, `backend-tests`, `docker-build` |
| `develop` | 1 Approval | Enabled | Enabled | Enabled | `lint-and-typecheck`, `python-tests`, `backend-tests` |

---

## 3. Database Migration Governance Checklist

Before any database migration is merged to `main`, the author and reviewer must complete the following checklist:

- [ ] **Zero Data Loss**: Migration does not drop columns containing live data without a staged transition.
- [ ] **Expand-and-Contract Pattern**: New columns are created as nullable or with safe defaults first before deprecating old columns.
- [ ] **Lock Contention Analysis**: Schema modifications do not perform heavy table rewrites without analyzing `ACCESS EXCLUSIVE` table lock times.
- [ ] **Backward-Compatible Prisma Client**: Running applications can continue operating against the database during zero-downtime rolling deploys.
- [ ] **Automated Rollback Script**: Down migration or safe rollback script tested against staging snapshot.
- [ ] **Idempotent Constraints**: Unique composite indexes (e.g. `[payrollPeriodId, employeeId]`) verified for race condition prevention.

---

## 4. Payroll Formula & Tax Change Protocol (RFC Process)

When statutory tax percentages, overtime multipliers, or allowance formulas require updates:
1. **RFC Submission**: Document legal statutory change citation, effective calendar date, and sample gross-to-net calculations.
2. **Test Driven Implementation**: Add test assertions in `python-services/app/tests/test_payroll_engine.py` covering:
   - High-precision Decimal quantization (`ROUND_HALF_UP`).
   - Boundary values (e.g. fractional cents $0.005 vs $0.004).
   - Balance invariant: `grossPay == netPay + totalDeductions`.
3. **Benchmark Regression**: Run `run_payroll_benchmark` to guarantee no latency regressions.
4. **Approval & Staged Rollout**: Approvals verified from Finance and Security codeowners.

---

## 5. Semantic Release Notes Standard

All releases adhere to Semantic Versioning (`vMAJOR.MINOR.PATCH`):
- `MAJOR`: Incompatible API changes or fundamental schema reorganizations.
- `MINOR`: New HRMS modules (e.g. Shift Bidding, Asset Tracking) or backward-compatible feature enhancements.
- `PATCH`: Bug fixes, security patches, or statutory tax percentage adjustments.
