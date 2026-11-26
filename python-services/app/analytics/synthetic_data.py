import random
from datetime import date, timedelta
from typing import List, Dict, Any

def generate_synthetic_workforce_data(num_records: int = 150) -> List[Dict[str, Any]]:
    """
    Assessment 06: Generates realistic synthetic workforce data
    covering 24 months of hiring, promotions, departments, and attrition.
    """
    random.seed(42) # Deterministic synthetic seed
    departments = ["Software Engineering", "Human Resources", "Finance & Payroll", "Cloud Operations", "Product & Design"]
    employment_types = ["FULL_TIME", "FULL_TIME", "FULL_TIME", "CONTRACTOR"]
    
    records = []
    base_start_date = date(2024, 1, 1)

    for i in range(1, num_records + 1):
        emp_num = f"EMP-{1000 + i}"
        hire_offset_days = random.randint(0, 700)
        hire_date = base_start_date + timedelta(days=hire_offset_days)
        dept = random.choice(departments)
        
        # Determine if employee has departed (attrition modeling)
        is_terminated = random.random() < 0.14 # ~14% baseline attrition
        termination_date = None
        if is_terminated:
            tenure_days = random.randint(90, 600)
            candidate_term_date = hire_date + timedelta(days=tenure_days)
            if candidate_term_date <= date(2026, 3, 1):
                termination_date = candidate_term_date
            else:
                is_terminated = False

        status = "TERMINATED" if is_terminated else "ACTIVE"
        
        records.append({
            "employeeNumber": emp_num,
            "department": dept,
            "employmentType": random.choice(employment_types),
            "status": status,
            "hireDate": hire_date,
            "terminationDate": termination_date,
            "daysPresent": random.randint(18, 22),
            "daysLate": random.randint(0, 3),
            "daysAbsent": random.randint(0, 2),
            "annualLeaveAllocated": 20.0,
            "annualLeaveUsed": round(random.uniform(5.0, 18.0), 1),
            "sickLeaveAllocated": 10.0,
            "sickLeaveUsed": round(random.uniform(1.0, 7.0), 1)
        })

    return records
