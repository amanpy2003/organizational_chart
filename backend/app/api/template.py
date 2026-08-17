from fastapi import APIRouter, Response

from app.services.template_service import build_template_workbook

router = APIRouter()


@router.get("/template")
def download_template() -> Response:
    content = build_template_workbook()
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": 'attachment; filename="organization_chart_template.xlsx"'
        },
    )
