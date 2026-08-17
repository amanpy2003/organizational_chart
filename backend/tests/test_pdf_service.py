from app.schemas.export import CardFieldConfig
from app.services.excel_service import parse_workbook
from app.services.hierarchy_service import build_hierarchy
from app.services.org_chart_service import build_chart_payload
from app.services.pdf_service import generate_org_chart_pdf
from app.services.validation_service import validate_employees
from tests.conftest import SAMPLE_DIR


def _trees_for(filename: str):
    path = SAMPLE_DIR / filename
    employees = parse_workbook(path.read_bytes(), filename)
    validation = validate_employees(employees)
    assert validation.is_valid
    hierarchy = build_hierarchy(employees)
    _, trees, _ = build_chart_payload(hierarchy, validation)
    return trees


def test_generates_pdf_for_small_org():
    trees = _trees_for("valid_small_50.xlsx")
    pdf_bytes = generate_org_chart_pdf(
        trees=trees,
        fields=CardFieldConfig(),
        direction="vertical",
        page_size="AUTO",
        orientation="landscape",
        title="Test Org Chart",
        scope_label="Entire Organization",
    )
    assert pdf_bytes.startswith(b"%PDF")
    assert len(pdf_bytes) > 500


def test_generates_multi_page_pdf_for_large_org():
    trees = _trees_for("valid_large_500.xlsx")
    pdf_bytes = generate_org_chart_pdf(
        trees=trees,
        fields=CardFieldConfig(show_employee_id=True, show_location=True),
        direction="vertical",
        page_size="A4",
        orientation="landscape",
        title="Large Org Chart",
        scope_label="Entire Organization",
    )
    assert pdf_bytes.startswith(b"%PDF")
    # A 500-employee chart forced onto A4 pages must produce many pages.
    assert pdf_bytes.count(b"/Type /Page") > 5 or pdf_bytes.count(b"/Type/Page") > 5


def test_generates_pdf_horizontal_direction():
    trees = _trees_for("valid_small_50.xlsx")
    pdf_bytes = generate_org_chart_pdf(
        trees=trees,
        fields=CardFieldConfig(),
        direction="horizontal",
        page_size="AUTO",
        orientation="landscape",
        title="Horizontal Org Chart",
        scope_label=None,
    )
    assert pdf_bytes.startswith(b"%PDF")


def test_generates_pdf_for_single_employee_chain():
    trees = _trees_for("valid_small_50.xlsx")
    single = [trees[0]]
    # Trim to just the reporting chain of one leaf for the "employee + chain" scope.
    single[0] = single[0].model_copy(update={"children": []})
    pdf_bytes = generate_org_chart_pdf(
        trees=single,
        fields=CardFieldConfig(),
        direction="vertical",
        page_size="A4",
        orientation="portrait",
        title="Employee Chain",
        scope_label="Selected Employee",
    )
    assert pdf_bytes.startswith(b"%PDF")
