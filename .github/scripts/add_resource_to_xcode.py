#!/usr/bin/env python3
"""Add a resource file to an Xcode project's resources build phase."""

import os
import re
import sys
import uuid


def new_uuid():
    return str(uuid.uuid4()).replace("-", "").upper()[:24]


def main():
    if len(sys.argv) < 3:
        print("Usage: add_resource_to_xcode.py <project.pbxproj> <resource>")
        sys.exit(1)

    pbx_path = sys.argv[1]
    resource_path = sys.argv[2]
    resource_filename = os.path.basename(resource_path)
    project_root = os.path.dirname(os.path.dirname(pbx_path))
    project_relative_path = os.path.relpath(resource_path, project_root).replace(
        os.sep, "/"
    )

    if not os.path.exists(pbx_path):
        print(f"pbxproj not found at {pbx_path}, skipping")
        sys.exit(0)
    if not os.path.exists(resource_path):
        print(f"Resource not found at {resource_path}, skipping")
        sys.exit(0)

    with open(pbx_path, "r", encoding="utf-8") as f:
        content = f.read()

    if resource_filename in content:
        print(f"{resource_filename} already registered in Xcode project")
        return

    file_ref_uuid = new_uuid()
    build_file_uuid = new_uuid()

    file_ref = (
        f"\t\t{file_ref_uuid} /* {resource_filename} */ = "
        f"{{isa = PBXFileReference; lastKnownFileType = text.plist.xml; "
        f"path = {project_relative_path}; sourceTree = \"<group>\"; }};"
    )
    build_file = (
        f"\t\t{build_file_uuid} /* {resource_filename} in Resources */ = "
        f"{{isa = PBXBuildFile; fileRef = {file_ref_uuid} /* {resource_filename} */; }};"
    )

    file_ref_match = re.search(
        r"(?m)^(\s*[A-F0-9]+ /\* AppDelegate\.swift \*/ = \{[^\n]+\};)$",
        content,
    )
    if not file_ref_match:
        raise RuntimeError("Could not find AppDelegate.swift file reference")
    content = content[: file_ref_match.end()] + "\n" + file_ref + content[file_ref_match.end() :]

    build_file_match = re.search(
        r"(?m)^(\s*[A-F0-9]+ /\* AppDelegate\.swift in Sources \*/ = \{[^\n]+\};)$",
        content,
    )
    if not build_file_match:
        raise RuntimeError("Could not find AppDelegate.swift build file")
    content = content[: build_file_match.end()] + "\n" + build_file + content[build_file_match.end() :]

    resources_phase_match = re.search(
        r"(?m)^(\s*[A-F0-9]+ /\* Resources \*/ = \{\n\s*isa = PBXResourcesBuildPhase;[\s\S]*?^\s*files = \(\n)",
        content,
    )
    if not resources_phase_match:
        raise RuntimeError("Could not find PBXResourcesBuildPhase")
    content = (
        content[: resources_phase_match.end()]
        + f"\t\t\t\t{build_file_uuid} /* {resource_filename} in Resources */,\n"
        + content[resources_phase_match.end() :]
    )

    with open(pbx_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(
        f"Successfully added {resource_filename} to Xcode resources "
        f"(fileRef={file_ref_uuid}, buildFile={build_file_uuid})"
    )


if __name__ == "__main__":
    main()
