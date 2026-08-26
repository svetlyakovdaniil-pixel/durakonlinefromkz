#!/usr/bin/env python3
"""Deprecated: local Apple Sign In registration is handled by MyViewController."""
import json
import os
import sys

config_path = os.path.join("ios", "App", "App", "capacitor.config.json")
if not os.path.exists(config_path):
    print(f"capacitor.config.json not found at {config_path}")
    sys.exit(0)

with open(config_path, "r", encoding="utf-8") as f:
    config = json.load(f)

print("No packageClassList changes needed; MyViewController registers AppleSignInPlugin.")
