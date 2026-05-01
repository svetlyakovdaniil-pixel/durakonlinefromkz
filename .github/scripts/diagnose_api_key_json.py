#!/usr/bin/env python3
"""Diagnose api_key.json content (without exposing the key)."""
import json
import os
import sys

path = os.environ.get('RUNNER_TEMP', '/tmp') + '/api_key.json'

try:
    with open(path) as f:
        d = json.load(f)
    print(f"key_id: {d.get('key_id', 'MISSING')}")
    print(f"issuer_id: {d.get('issuer_id', 'MISSING')}")
    print(f"key_len: {len(d.get('key', ''))}")
    print(f"in_house: {d.get('in_house', 'MISSING')}")
    print(f"is_key_content_base64: {d.get('is_key_content_base64', 'MISSING')}")
except FileNotFoundError:
    print(f"ERROR: File not found: {path}", file=sys.stderr)
    sys.exit(1)
except json.JSONDecodeError as e:
    print(f"ERROR: Invalid JSON: {e}", file=sys.stderr)
    sys.exit(1)
