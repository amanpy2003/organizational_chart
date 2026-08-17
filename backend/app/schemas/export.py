from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

from app.schemas.employee import OrgNodeSchema

PageSize = Literal["A4", "A3", "A2", "A1", "A0", "AUTO"]
Orientation = Literal["portrait", "landscape"]
ChartDirection = Literal["vertical", "horizontal", "compact"]


class CardFieldConfig(BaseModel):
    show_employee_id: bool = False
    show_designation: bool = True
    show_department: bool = True
    show_location: bool = False
    show_email: bool = False


class ExportPdfRequest(BaseModel):
    trees: list[OrgNodeSchema]
    title: str = "Organization Chart"
    fields: CardFieldConfig = CardFieldConfig()
    direction: ChartDirection = "vertical"
    page_size: PageSize = "AUTO"
    orientation: Orientation = "landscape"
    scope_label: str | None = None
    fit_to_one_page: bool = False
