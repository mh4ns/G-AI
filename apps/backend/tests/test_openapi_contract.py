import pytest

from app.export_openapi import OUTPUT, render


def test_published_openapi_schema_is_current():
    if not OUTPUT.parent.parent.exists():  # backend-only checkout (e.g. Docker build context)
        pytest.skip("packages/shared-types not present")
    assert OUTPUT.exists() and OUTPUT.read_text(encoding="utf-8") == render(), (
        "Run `python -m app.export_openapi` and commit packages/shared-types/openapi/backend-v1.json"
    )
