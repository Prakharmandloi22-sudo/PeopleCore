from fastapi import FastAPI, Depends, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

from .config import settings
from .payroll.models import PayrollCalculationRequest, PayrollCalculationResponse
from .payroll.engine import PayrollEngine
from .payroll.benchmark import run_payroll_benchmark
from .analytics.models import WorkforceAnalyticsSummary
from .analytics.engine import AnalyticsEngine

app = FastAPI(
    title="PeopleCore Python Microservice",
    description="High-precision Decimal Payroll Calculation Engine & Workforce Analytics Service",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def verify_internal_secret(x_internal_secret: Optional[str] = Header(None)):
    """Verifies internal secret key for communication from backend Node API"""
    if settings.environment == "production":
        if not x_internal_secret or x_internal_secret != settings.internal_api_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unauthorized: Invalid internal secret key."
            )
    return True

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "peoplecore-python-payroll-analytics",
        "version": settings.app_version,
        "precision_engine": "Python Decimal (ROUND_HALF_UP)"
    }

@app.post(
    "/api/v1/payroll/calculate",
    response_model=PayrollCalculationResponse,
    dependencies=[Depends(verify_internal_secret)]
)
def calculate_payroll(payload: PayrollCalculationRequest):
    """
    Assessment 05: Computes salary, prorations, overtime, allowances, deductions, and net pay
    using high-precision Decimal math.
    """
    try:
        return PayrollEngine.calculate(payload)
    except AssertionError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@app.get("/api/v1/payroll/benchmark")
def execute_benchmark(iterations: int = 1000):
    """
    Assessment 05: Performance and correctness benchmark
    """
    return run_payroll_benchmark(iterations=iterations)

@app.get("/api/v1/analytics/summary", response_model=WorkforceAnalyticsSummary)
def get_workforce_analytics():
    """
    Assessment 06: Returns headcount trends, turnover rate, retention,
    department distribution, attendance, and leave utilization metrics.
    """
    return AnalyticsEngine.compute_summary()

@app.post("/api/v1/analytics/synthetic-generate")
def regenerate_synthetic_report(sample_size: int = 200):
    """
    Assessment 06: Generates customized synthetic dataset and computes analytics summary.
    """
    from .analytics.synthetic_data import generate_synthetic_workforce_data
    dataset = generate_synthetic_workforce_data(sample_size)
    return AnalyticsEngine.compute_summary(dataset)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.port, reload=True)
