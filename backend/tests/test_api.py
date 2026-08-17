from fastapi.testclient import TestClient

from app.main import app
from tests.conftest import SAMPLE_DIR

client = TestClient(app)


def test_health():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_template_download():
    resp = client.get("/api/template")
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    assert len(resp.content) > 1000


def test_upload_valid_file_generates_chart():
    path = SAMPLE_DIR / "valid_small_50.xlsx"
    with path.open("rb") as f:
        resp = client.post(
            "/api/upload",
            files={"file": (path.name, f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        )
    assert resp.status_code == 200
    body = resp.json()
    assert body["chart_generated"] is True
    assert len(body["trees"]) == 1
    assert body["summary"]["employee_count"] > 30
    assert body["validation"]["errors"] == []


def test_upload_invalid_file_blocks_chart():
    path = SAMPLE_DIR / "invalid_circular_reference.xlsx"
    with path.open("rb") as f:
        resp = client.post(
            "/api/upload",
            files={"file": (path.name, f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        )
    assert resp.status_code == 200
    body = resp.json()
    assert body["chart_generated"] is False
    assert body["trees"] == []
    assert any(e["code"] == "CIRCULAR_REPORTING" for e in body["validation"]["errors"])


def test_upload_rejects_wrong_extension():
    resp = client.post(
        "/api/upload", files={"file": ("notes.txt", b"hello", "text/plain")}
    )
    assert resp.status_code == 400


def test_export_pdf_end_to_end():
    path = SAMPLE_DIR / "valid_small_50.xlsx"
    with path.open("rb") as f:
        upload_resp = client.post(
            "/api/upload",
            files={"file": (path.name, f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        )
    trees = upload_resp.json()["trees"]

    resp = client.post(
        "/api/export/pdf",
        json={
            "trees": trees,
            "title": "Organization Chart",
            "fields": {"show_designation": True, "show_department": True},
            "direction": "vertical",
            "page_size": "AUTO",
            "orientation": "landscape",
            "scope_label": "Entire Organization",
        },
    )
    assert resp.status_code == 200
    assert resp.content.startswith(b"%PDF")


def test_export_excel_end_to_end():
    path = SAMPLE_DIR / "valid_small_50.xlsx"
    with path.open("rb") as f:
        upload_resp = client.post(
            "/api/upload",
            files={"file": (path.name, f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        )
    trees = upload_resp.json()["trees"]

    resp = client.post("/api/export/excel", json={"trees": trees})
    assert resp.status_code == 200
    assert len(resp.content) > 500
