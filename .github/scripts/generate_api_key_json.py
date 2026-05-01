#!/usr/bin/env python3
"""Generate App Store Connect API key JSON for Fastlane."""
import json
import os
import sys
import base64

key_id = os.environ.get('APP_STORE_CONNECT_API_KEY_ID', '').strip()
issuer_id = os.environ.get('APP_STORE_CONNECT_ISSUER_ID', '').strip()
key_content = os.environ.get('APP_STORE_CONNECT_API_KEY_CONTENT', '').strip()
runner_temp = os.environ.get('RUNNER_TEMP', '/tmp')

if not key_id or not issuer_id or not key_content:
    print("ERROR: Missing required environment variables", file=sys.stderr)
    sys.exit(1)

# Decode if base64-encoded
try:
    decoded = base64.b64decode(key_content).decode('utf-8')
    if '-----BEGIN' in decoded:
        key_content = decoded
        print("Decoded base64 API key content")
except Exception:
    pass

data = {
    'key_id': key_id,
    'issuer_id': issuer_id,
    'key': key_content,
    'in_house': False,
    'is_key_content_base64': False
}

output_path = os.path.join(runner_temp, 'api_key.json')
with open(output_path, 'w') as f:
    json.dump(data, f)

print(f"API key JSON written to {output_path}")
print(f"Key ID: {key_id}")
print(f"Issuer ID: {issuer_id}")
