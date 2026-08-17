from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config.settings import get_settings
from app.schemas.employee import EmployeeSchema
from app.schemas.upload import UploadResponse
from app.schemas.validation import OrgSummary
from app.services.excel_service import ExcelParseError, parse_workbook
from app.services.hierarchy_service import build_hierarchy
from app.services.org_chart_service import build_chart_payload
from app.services.validation_service import validate_employees

router = APIRouter()

ALLOWED_EXTENSIONS = (".xlsx", ".xls")


@router.post("/upload", response_model=UploadResponse)
async def upload_organization_file(file: UploadFile = File(...)) -> UploadResponse:
    settings = get_settings()

    if not file.filename or not file.filename.lower().endswith(ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a .xlsx or .xls file.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File is too large. Maximum allowed size is {settings.max_upload_mb} MB.",
        )
    if not file_bytes:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    try:
        employees = parse_workbook(file_bytes, file.filename)
    except ExcelParseError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not employees:
        raise HTTPException(
            status_code=400,
            detail="No employee rows were found in the uploaded file. Please use the provided template.",
        )

    if len(employees) > settings.max_employees:
        raise HTTPException(
            status_code=400,
            detail=(
                f"This file contains {len(employees)} employees, which exceeds the "
                f"maximum supported ({settings.max_employees})."
            ),
        )

    validation = validate_employees(employees)

    if validation.has_errors:
        fallback_employees = [
            EmployeeSchema(
                row_number=e.row_number,
                employee_id=e.employee_id,
                name=e.name,
                designation=e.designation,
                department=e.department,
                reports_to=e.reports_to,
                location=e.location,
                email=e.email,
                level=e.level,
                employment_type=e.employment_type,
                status=e.status,
            )
            for e in employees
        ]
        return UploadResponse(
            employees=fallback_employees,
            trees=[],
            summary=OrgSummary(
                employee_count=len(employees),
                error_count=len(validation.errors),
                warning_count=len(validation.warnings),
            ),
            validation=validation,
            chart_generated=False,
        )

    hierarchy = build_hierarchy(employees)
    employee_schemas, trees, summary = build_chart_payload(hierarchy, validation)

    return UploadResponse(
        employees=employee_schemas,
        trees=trees,
        summary=summary,
        validation=validation,
        chart_generated=True,
    )
