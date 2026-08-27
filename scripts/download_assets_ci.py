#!/usr/bin/env python3
"""
Download all card and table assets from Manus S3 storage into dist/public/manus-storage/
so they are bundled inside the iOS .ipa (no network needed at runtime).

Required env vars:
  BUILT_IN_FORGE_API_URL  — Manus Forge API base URL
  BUILT_IN_FORGE_API_KEY  — Bearer token for Forge API
"""

import os
import sys
import json
import urllib.request
import urllib.parse
import urllib.error
from urllib.parse import urlsplit
from pathlib import Path

FORGE_API_URL = os.environ.get("BUILT_IN_FORGE_API_URL", "").rstrip("/")
FORGE_API_KEY = os.environ.get("BUILT_IN_FORGE_API_KEY", "")

if not FORGE_API_URL or not FORGE_API_KEY:
    print("ERROR: BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY must be set")
    sys.exit(1)

if urlsplit(FORGE_API_URL).scheme != "https" or not urlsplit(FORGE_API_URL).netloc:
    print("ERROR: BUILT_IN_FORGE_API_URL must be an HTTPS URL")
    sys.exit(1)

# All 84 asset keys as stored in Manus S3 (from asset_upload_map.txt)
ASSET_KEYS = [
    # ── Card deck: Batyr (Russian suits) ────────────────────────────────────
    "6буби_ad2767e9_e7334a85.jpg",
    "6крести_0ddfbd72_c0df3d9c.jpg",
    "6пики_a5e66aa5_14f1b8e0.jpg",
    "6черви_c788e629_d8f61a15.jpg",
    "7буби_bd386fe2_67e3eef9.jpg",
    "7крести_35ebf9d6_8109cbf3.jpg",
    "7пики_8726d725_ae87faa6.jpg",
    "7черви_6eca967e_fdff33cb.jpg",
    "8буби_06844441_5cdc6a83.jpg",
    "8крести_697e7dd4_d01565e9.jpg",
    "8пики_369be7af_bfc06294.jpg",
    "8черви_eca9d1b3_5ed379c1.jpg",
    "9буби_4e6a4a6f_f29b8e07.jpg",
    "9крести_b6e7c97b_5e64bd9c.jpg",
    "9пики_79ac5272_ee094081.jpg",
    "9черви_76fc201c_d872b6b7.jpg",
    "10буби_f2b92276_5366e62b.jpg",
    "10крести_543e49e3_30c2b9d8.jpg",
    "10пики_fd8cb013_c5e28a61.jpg",
    "10черви_4788eaaa_d2cea0a5.jpg",
    "валетбуби_e3ef742d_e05199bb.jpg",
    "валеткрести_a53d6bec_888d4c4c.jpg",
    "валетпики_d06bd63c_1301c4e1.jpg",
    "валетчерви_b0836a37_89053f44.jpg",
    "дамабуби_fd98a66d_9e8691a1.jpg",
    "дамакрести_cd155fb8_ae505100.jpg",
    "дамапики_db668c78_33950f47.jpg",
    "дамачерви_077a6864_e990b3b9.jpg",
    "корольбуби_a70fa103_16131f05.jpg",
    "королькрести_0b5476f9_598e4cec.jpg",
    "корольпики_5f451693_013c9db5.jpg",
    "корольчерви_ed4da7ef_3ee22c23.jpg",
    "тузбуби_a0ebe640_18fcb92c.jpg",
    "тузкрести_3a4828b5_a99e65ae.jpg",
    "тузпики_c747bd96_537eae67.jpg",
    "тузчерви_dffa2bc3_435abd3b.jpg",
    # ── Card deck: Batyr (English suits) ────────────────────────────────────
    "six_clubs_batyr_8b569939_ea55fba4.png",
    "six_diamonds_batyr_8a5da4e6_9eb1b680.png",
    "six_hearts_batyr_46cec60c_ef12fcd2.png",
    "six_spades_batyr_71aa2b41_95ded933.png",
    "seven_clubs_batyr_c02d8c46_ba187b49.png",
    "seven_diamonds_batyr_6e56edaa_39237a8c.png",
    "seven_hearts_batyr_abecf834_7b3db4ae.png",
    "seven_spades_batyr_6482695f_98756540.png",
    "eight_clubs_batyr_d5cb78a9_d55d1526.png",
    "eight_diamonds_batyr_12f2b438_4c1cdf24.png",
    "eight_hearts_batyr_dda206ca_6d90305e.png",
    "eight_spades_batyr_ca32183c_f3b53c4e.png",
    "nine_clubs_batyr_aac27927_7d57c7d6.png",
    "nine_diamonds_batyr_2e9f5185_3c41c1cc.png",
    "nine_hearts_batyr_9497c114_5a1b5130.png",
    "nine_spades_batyr_d9836dea_dfbfb014.png",
    "ten_clubs_batyr_v5_8d520041_e5d48e50.png",
    "ten_diamonds_batyr_v6_8c90ef70_52bae331.png",
    "ten_hearts_batyr_v6_e35bafe3_040cc1aa.png",
    "ten_spades_batyr_v4_056053c0_d8d2ac62.png",
    "jack_clubs_batyr_v2_bab9b3cf_2ea4bcf4.png",
    "jack_diamonds_batyr_v2_14f1a706_6b06be91.png",
    "jack_hearts_batyr_v2_baf92fb7_ebaf3571.png",
    "jack_spades_batyr_v2_87356e9c_971c108b.png",
    "queen_clubs_batyr_v2_b3ca7ee9_3cc61486.png",
    "queen_diamonds_batyr_v2_96b1337e_5bcbf343.png",
    "queen_hearts_batyr_v2_76f970ba_b83f31f8.png",
    "queen_spades_batyr_v2_96732a86_9c3ca2e4.png",
    "king_clubs_batyr_v2_42b6c3f2_7679f01f.png",
    "king_diamonds_batyr_v2_58b932e2_733b1fa4.png",
    "king_hearts_batyr_v2_c3155002_23b172f1.png",
    "king_spades_batyr_78c9c564_fff3b909.png",
    "ace_clubs_batyr_11b7c939_5c23a20e.png",
    "ace_diamonds_batyr_v2_8a564d82_38e97424.png",
    "ace_hearts_batyr_v2_32b73b45_3b29931b.png",
    "ace_spades_batyr_v2_79316376_3999bef6.png",
    # ── Card deck: 777 ──────────────────────────────────────────────────────
    "777_66c2a698_00863983.jpg",
    "joker_777_batyr_v2_2c59f1ad_5482b7dc.png",
    "хорошаяобложка_1d8ecf26_9166a4e1.jpg",
    # ── Card backs ──────────────────────────────────────────────────────────
    "ТоварищМырза_61b514ca_10f9a743.png",
    # ── Game tables ─────────────────────────────────────────────────────────
    "game_table-9KeBRLr2mzuAL8uVYsQsVq_1f2b0e6d.webp",   # Classic
    "khansky_oktogon_table_523470d5_a182782b.webp",         # Golden
    "table-galaxy-fixed_b6059c99_16b61124.webp",            # Night Galaxy
    "table_apocalypse-H8YjUxzbwgWkFc5HnxrkhG_4aaf4d7b.webp", # Apocalypse
    "neon_table-eY4ptBJDmBaDo69F5sQkTp_6c366e44.webp",     # Neon
    "table_sea_depths_8d949ab4_8a1cf275.png",               # Sea Depths
    "table_stargazer_95bf3fd6_9f2146f7.png",                # Stargazer
    "khan_black_velvet_table_v3-5FMgqXZn8wa4Eo6sPsUP8f_f83f2fbc.webp", # Black Velvet
]

OUTPUT_DIR = Path("dist/public/manus-storage")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def get_presigned_url(key: str) -> str:
    """Get a presigned GET URL for the given S3 key from Forge API."""
    url = f"{FORGE_API_URL}/v1/storage/presign/get?path={urllib.parse.quote(key)}"
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {FORGE_API_KEY}"},
    )
    # API base URL is restricted to HTTPS during startup.
    with urllib.request.urlopen(req, timeout=30) as resp:  # nosemgrep: python.lang.security.audit.dynamic-urllib-use-detected.dynamic-urllib-use-detected
        data = json.loads(resp.read())
        presigned_url = data["url"]
        parsed = urlsplit(presigned_url)
        if parsed.scheme != "https" or not parsed.netloc:
            raise ValueError("presigned asset URL must use HTTPS")
        return presigned_url


def download_file(url: str, dest: Path) -> None:
    """Download a file from url to dest."""
    req = urllib.request.Request(url)
    # Presigned URL is restricted to HTTPS before the request is opened.
    with urllib.request.urlopen(req, timeout=120) as resp:  # nosemgrep: python.lang.security.audit.dynamic-urllib-use-detected.dynamic-urllib-use-detected
        dest.write_bytes(resp.read())


def main():
    print(f"Downloading {len(ASSET_KEYS)} assets to {OUTPUT_DIR}/")
    success = 0
    failed = []

    for key in ASSET_KEYS:
        dest = OUTPUT_DIR / key
        if dest.exists() and dest.stat().st_size > 1000:
            print(f"  [SKIP] {key} (already exists, {dest.stat().st_size} bytes)")
            success += 1
            continue
        try:
            presigned = get_presigned_url(key)
            download_file(presigned, dest)
            size = dest.stat().st_size
            print(f"  [OK]   {key} ({size:,} bytes)")
            success += 1
        except Exception as e:
            print(f"  [FAIL] {key}: {e}")
            failed.append(key)

    print(f"\nDone: {success}/{len(ASSET_KEYS)} downloaded")
    if failed:
        print(f"Failed ({len(failed)}):")
        for f in failed:
            print(f"  - {f}")
        # Don't fail the build — app will fall back to CDN proxy for missing assets
        print("WARNING: Some assets failed to download. App will use server proxy as fallback.")


if __name__ == "__main__":
    main()
