# Backend — Organizational Chart Generator API

FastAPI service that parses, validates, and builds the org hierarchy from an
uploaded Excel file, and renders PDF/Excel exports.

## Structure

```
app/
  main.py                 FastAPI app, CORS, router registration
  api/                     upload.py, template.py, export.py, health.py
  models/                  Employee, OrgNode dataclasses
  schemas/                 Pydantic request/response models
  services/
    excel_service.py        Excel -> list[Employee]
    validation_service.py   business-rule validation (see below)
    hierarchy_service.py    builds the tree/forest from Employee ID / Reports-To
    org_chart_service.py    decorates tree with department colors + summary stats
    template_service.py     builds the downloadable .xlsx template
    pdf_service.py           tree layout + ReportLab pagination/drawing
  utils/                   tree_layout.py (shared layout math), colors.py
  config/                  settings.py (.env-driven)
scripts/generate_sample_data.py   fixture generator
sample_data/                      generated .xlsx fixtures
tests/                             pytest suite
```

## Validation rules

Implemented in `validation_service.py`, all keyed off `Employee ID` /
`Reports To Employee ID` only:

- Missing Employee ID → error (row number reported)
- Duplicate Employee ID → error (all rows reported)
- Reports-To references a non-existent Employee ID → error
- Circular reporting (A→B→C→A) → error, cycle members named
- Multiple blank-Reports-To rows → warning (not blocking — the frontend
  renders it as a forest)

Errors block chart generation entirely (`chart_generated: false` in the
`/api/upload` response); warnings do not.

## API

- `GET /api/health`
- `GET /api/template` — downloads the `.xlsx` template
- `POST /api/upload` — multipart file upload → employees + tree(s) + validation + summary
- `POST /api/export/pdf` — `{ trees, fields, direction, page_size, orientation, scope_label }` → PDF
- `POST /api/export/excel` — `{ trees }` → flat `.xlsx` re-export

Interactive docs at `/docs` once the server is running.

## Running

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python scripts/generate_sample_data.py
uvicorn app.main:app --reload --port 8000
pytest
```
