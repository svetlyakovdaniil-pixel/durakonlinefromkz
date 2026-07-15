#!/usr/bin/env python3
"""
add_swift_to_xcode.py <path/to/project.pbxproj> <path/to/File.swift>

Adds a Swift source file to an Xcode project's pbxproj if it isn't already there.
Inserts a PBXFileReference and PBXBuildFile entry, and adds the file to the
App target's Sources build phase and the App group.
"""

import sys
import os
import re
import uuid


def new_uuid():
    return str(uuid.uuid4()).replace("-", "").upper()[:24]


def main():
    if len(sys.argv) < 3:
        print("Usage: add_swift_to_xcode.py <project.pbxproj> <File.swift>")
        sys.exit(1)

    pbx_path = sys.argv[1]
    swift_path = sys.argv[2]
    swift_filename = os.path.basename(swift_path)

    if not os.path.exists(pbx_path):
        print(f"pbxproj not found at {pbx_path}, skipping")
        sys.exit(0)

    if not os.path.exists(swift_path):
        print(f"Swift file not found at {swift_path}, skipping")
        sys.exit(0)

    with open(pbx_path, "r") as f:
        content = f.read()

    if swift_filename in content:
        print(f"{swift_filename} already registered in Xcode project")
        sys.exit(0)

    file_ref_uuid = new_uuid()
    build_file_uuid = new_uuid()

    # PBXFileReference entry
    file_ref = (
        f"\t\t{file_ref_uuid} /* {swift_filename} */ = "
        f"{{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; "
        f"path = {swift_filename}; sourceTree = \"<group>\"; }};"
    )

    # PBXBuildFile entry
    build_file = (
        f"\t\t{build_file_uuid} /* {swift_filename} in Sources */ = "
        f"{{isa = PBXBuildFile; fileRef = {file_ref_uuid} /* {swift_filename} */; }};"
    )

    # 1. Insert PBXFileReference after AppDelegate.swift file ref
    content = re.sub(
        r"(\t\t[A-F0-9]+ /\* AppDelegate\.swift \*/ = \{[^\}]+\};)",
        r"\1\n" + file_ref,
        content,
        count=1,
    )

    # 2. Insert PBXBuildFile after AppDelegate.swift build file
    content = re.sub(
        r"(\t\t[A-F0-9]+ /\* AppDelegate\.swift in Sources \*/ = \{[^\}]+\};)",
        r"\1\n" + build_file,
        content,
        count=1,
    )

    # 3. Add to Sources build phase (after AppDelegate.swift in Sources)
    content = re.sub(
        r"(\t\t\t\t[A-F0-9]+ /\* AppDelegate\.swift in Sources \*/,)",
        r"\1\n\t\t\t\t" + build_file_uuid + f" /* {swift_filename} in Sources */,",
        content,
        count=1,
    )

    # 4. Add to App group (after AppDelegate.swift file ref in group)
    content = re.sub(
        r"(\t\t\t\t[A-F0-9]+ /\* AppDelegate\.swift \*/,)",
        r"\1\n\t\t\t\t" + file_ref_uuid + f" /* {swift_filename} */,",
        content,
        count=1,
    )

    with open(pbx_path, "w") as f:
        f.write(content)

    print(
        f"Successfully added {swift_filename} to Xcode project "
        f"(fileRef={file_ref_uuid}, buildFile={build_file_uuid})"
    )


if __name__ == "__main__":
    main()
