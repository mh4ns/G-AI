"""
Writes the API's OpenAPI schema to packages/shared-types/openapi/backend-v1.json so the web apps
can read the contract without a running backend (Swagger is disabled in production).

    python -m app.export_openapi           # rewrite the file
    python -m app.export_openapi --check   # exit 1 if the committed file is stale
"""

import json
import sys
from pathlib import Path

OUTPUT = Path(__file__).resolve().parents[3] / "packages" / "shared-types" / "openapi" / "backend-v1.json"


def render() -> str:
    from app.main import app

    return json.dumps(app.openapi(), indent=2, ensure_ascii=False, sort_keys=True) + "\n"


def main() -> int:
    content = render()
    if "--check" in sys.argv:
        if not OUTPUT.exists() or OUTPUT.read_text(encoding="utf-8") != content:
            print(f"{OUTPUT} is stale; run `python -m app.export_openapi`.", file=sys.stderr)
            return 1
        return 0
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(content, encoding="utf-8")
    print(f"wrote {OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
