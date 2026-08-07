#!/usr/bin/env python3
"""
Add AppleSignInPlugin to packageClassList in the native capacitor.config.json.
`cap sync` regenerates packageClassList from node_modules plugins, which drops
our custom local AppleSignInPlugin. This re-adds it so Capacitor's
autoRegisterPlugins (NSClassFromString) can find it.
"""
import json
import os
import sys

config_path = os.path.join("ios", "App", "App", "capacitor.config.json")
if not os.path.exists(config_path):
    print(f"capacitor.config.json not found at {config_path}")
    sys.exit(0)

with open(config_path, "r", encoding="utf-8") as f:
    config = json.load(f)

class_list = config.get("packageClassList", [])
if not isinstance(class_list, list):
    class_list = []

for plugin in ("AppleSignInPlugin", "MyViewController"):
    if plugin not in class_list:
        class_list.append(plugin)

config["packageClassList"] = class_list

with open(config_path, "w", encoding="utf-8") as f:
    json.dump(config, f, indent="\t", ensure_ascii=False)

print(f"packageClassList now: {class_list}")
