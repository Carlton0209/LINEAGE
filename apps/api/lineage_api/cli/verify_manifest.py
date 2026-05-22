import argparse
import json
import sys
from pathlib import Path

from lineage_api.manifest_verifier import verification_result


def main() -> None:
    parser = argparse.ArgumentParser(description="Verify a signed LINEAGE manifest JSON file.")
    parser.add_argument("manifest", type=Path, help="Path to the signed manifest JSON file.")
    args = parser.parse_args()

    try:
        manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
        result = verification_result(manifest)
    except Exception as exc:
        print(f"invalid: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc

    if not result["valid"]:
        print(f"invalid: {result['reason']}", file=sys.stderr)
        raise SystemExit(1)

    print("valid")


if __name__ == "__main__":
    main()
