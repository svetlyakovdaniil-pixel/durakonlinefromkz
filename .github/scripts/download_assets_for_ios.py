#!/usr/bin/env python3
"""
Download card and avatar assets from the production server into dist/public/assets/
so they are bundled inside the iOS .ipa (no network needed at runtime).

Assets are served from https://durakonlinefromkz.online/assets/{cards,avatars}/
and are placed into dist/public/assets/{cards,avatars}/ which is the webDir
for Capacitor (cap sync copies them into ios/App/App/public/).
"""

import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

BASE_URL = "https://durakonlinefromkz.online"

# All card asset filenames (from dist/public/assets/cards/ on production server)
CARD_FILES = [
    "10_clubs_543e49e3_6d100286.webp",
    "10_diamonds_f2b92276_6dc7ae95.webp",
    "10_hearts_4788eaaa_46a0d538.webp",
    "10_spades_fd8cb013_cb7c0c0a.webp",
    "6_clubs_0ddfbd72_913618d9.webp",
    "6_diamonds_ad2767e9_b94edf04.webp",
    "6_hearts_c788e629_f15d9128.webp",
    "6_spades_a5e66aa5_4ea5221b.webp",
    "777_66c2a698_5c911fbe.webp",
    "7_clubs_35ebf9d6_6711405c.webp",
    "7_diamonds_bd386fe2_3e94167e.webp",
    "7_hearts_6eca967e_9b509372.webp",
    "7_spades_8726d725_5630cb15.webp",
    "8_clubs_697e7dd4_3228b8f6.webp",
    "8_diamonds_06844441_b0dc3f1b.webp",
    "8_hearts_eca9d1b3_3f81c16c.webp",
    "8_spades_369be7af_313bd7f1.webp",
    "9_clubs_b6e7c97b_9ae26de1.webp",
    "9_diamonds_4e6a4a6f_dcd35f4b.webp",
    "9_hearts_76fc201c_f201b8a4.webp",
    "9_spades_79ac5272_f0e579c9.webp",
    "ace_clubs_3a4828b5_bd4a80b6.webp",
    "ace_clubs_batyr_11b7c939_b43b3ca1.webp",
    "ace_diamonds_a0ebe640_99417ad5.webp",
    "ace_diamonds_batyr_v2_8a564d82_f04aaf84.webp",
    "ace_hearts_batyr_v2_32b73b45_64a53aa4.webp",
    "ace_hearts_dffa2bc3_5d609c81.webp",
    "ace_spades_batyr_v2_79316376_fe1e9d17.webp",
    "ace_spades_c747bd96_0d796a7e.webp",
    "card_back_classic_8ad2e43d.webp",
    "card_back_custom_987db1bc.webp",
    "eight_clubs_batyr_d5cb78a9_0b42d929.webp",
    "eight_diamonds_batyr_12f2b438_5935b71f.webp",
    "eight_hearts_batyr_dda206ca_197761d6.webp",
    "eight_spades_batyr_ca32183c_c04d8b02.webp",
    "game_table-9KeBRLr2mzuAL8uVYsQsVq_609274c2.webp",
    "jack_clubs_a53d6bec_76d69c9c.webp",
    "jack_clubs_batyr_v2_bab9b3cf_e2813334.webp",
    "jack_diamonds_batyr_v2_14f1a706_c2e61fb1.webp",
    "jack_diamonds_e3ef742d_46a3b61d.webp",
    "jack_hearts_b0836a37_e319a885.webp",
    "jack_hearts_batyr_v2_baf92fb7_41d21725.webp",
    "jack_spades_batyr_v2_87356e9c_1ee16b9d.webp",
    "jack_spades_d06bd63c_5653fa50.webp",
    "joker_777_batyr_v2_2c59f1ad_a196b309.webp",
    "khan_black_velvet_table_v3-5FMgqXZn8wa4Eo6sPsUP8f_be451c88.webp",
    "khansky_oktogon_table_523470d5_4ddcf50d.webp",
    "king_clubs_0b5476f9_237e0086.webp",
    "king_clubs_batyr_v2_42b6c3f2_5f91c718.webp",
    "king_diamonds_a70fa103_98e7075f.webp",
    "king_diamonds_batyr_v2_58b932e2_570cad37.webp",
    "king_hearts_batyr_v2_c3155002_42eedeb4.webp",
    "king_hearts_ed4da7ef_a7c91b8f.webp",
    "king_spades_5f451693_c44e8430.webp",
    "king_spades_batyr_78c9c564_1b2370cd.webp",
    "neon_table-eY4ptBJDmBaDo69F5sQkTp_8807fcae.webp",
    "nine_clubs_batyr_aac27927_5bacbfd0.webp",
    "nine_diamonds_batyr_2e9f5185_4f548b4e.webp",
    "nine_hearts_batyr_9497c114_f2d9e5bc.webp",
    "nine_spades_batyr_d9836dea_32caf552.webp",
    "queen_clubs_batyr_v2_b3ca7ee9_7163be10.webp",
    "queen_clubs_cd155fb8_d51ea089.webp",
    "queen_diamonds_batyr_v2_96b1337e_97ac9747.webp",
    "queen_diamonds_fd98a66d_c7f405b9.webp",
    "queen_hearts_077a6864_f0f4c9e3.webp",
    "queen_hearts_batyr_v2_76f970ba_03c17fe4.webp",
    "queen_spades_batyr_v2_96732a86_a97adfb4.webp",
    "queen_spades_db668c78_54a6b89f.webp",
    "seven_clubs_batyr_c02d8c46_add478b2.webp",
    "seven_diamonds_batyr_6e56edaa_a6977904.webp",
    "seven_hearts_batyr_abecf834_8a292a8b.webp",
    "seven_spades_batyr_6482695f_35b5225d.webp",
    "six_clubs_batyr_8b569939_bbefb79b.webp",
    "six_diamonds_batyr_8a5da4e6_32cfebcf.webp",
    "six_hearts_batyr_46cec60c_135623af.webp",
    "six_spades_batyr_71aa2b41_99c45dd8.webp",
    "table_apocalypse-H8YjUxzbwgWkFc5HnxrkhG_3d34531b.webp",
    "table-galaxy-fixed_b6059c99_010d3863.webp",
    "table_sea_depths_8d949ab4_41a8569c.webp",
    "table_stargazer_95bf3fd6_794bfd11.webp",
    "ten_clubs_batyr_v5_8d520041_06f4a256.webp",
    "ten_diamonds_batyr_v6_8c90ef70_55b854ef.webp",
    "ten_hearts_batyr_v6_e35bafe3_6580e7e0.webp",
    "ten_spades_batyr_v4_056053c0_1ea65c1c.webp",
]

# All avatar asset filenames (from dist/public/assets/avatars/ on production server)
AVATAR_FILES = [
    "avatar_bear_angry-BgGpArBiGaongtJtNqPrPP.webp",
    "avatar_cat_lazy-4fa5o8JrJbsoGukvmiRYck.webp",
    "avatar_eagle_determined-gks9AN9EiDq2fM34wDAitN.webp",
    "avatar_fox_smug-fJkNAyA3ddNsq2NQbDnhxF.webp",
    "avatar_owl_wise-YmXBTYp2RGoRCkSjUGkKLs.webp",
    "avatar_panda_happy-kPPArBc2zvKGbib5i2GzFS.webp",
    "avatar_raccoon_mischievous-aAdKvfGW7K3WLV8SdDhLPL.webp",
    "avatar_snow_leopard_calm-jfAGUjmLVzuYTVxYKyPMAd.webp",
    "avatar_tiger_proud-33ax6W3gWEbAUXyPmFNsEK.webp",
    "avatar_wolf_fierce-jxRuqcVyJiD2VL2nhXrK9b.webp",
]

CARDS_DIR = Path("dist/public/assets/cards")
AVATARS_DIR = Path("dist/public/assets/avatars")

CARDS_DIR.mkdir(parents=True, exist_ok=True)
AVATARS_DIR.mkdir(parents=True, exist_ok=True)


def download_file(url: str, dest: Path) -> bool:
    """Download a file from url to dest. Returns True on success."""
    if dest.exists() and dest.stat().st_size > 1000:
        print(f"  [SKIP] {dest.name} (already exists)")
        return True
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "iOS-Build-Script/1.0"})
        with urllib.request.urlopen(req, timeout=60) as resp:
            dest.write_bytes(resp.read())
        print(f"  [OK]   {dest.name} ({dest.stat().st_size:,} bytes)")
        return True
    except Exception as e:
        print(f"  [FAIL] {dest.name}: {e}")
        return False


def main():
    total = len(CARD_FILES) + len(AVATAR_FILES)
    success = 0
    failed = []

    print(f"Downloading {len(CARD_FILES)} card assets...")
    for filename in CARD_FILES:
        url = f"{BASE_URL}/assets/cards/{filename}"
        dest = CARDS_DIR / filename
        if download_file(url, dest):
            success += 1
        else:
            failed.append(f"cards/{filename}")

    print(f"\nDownloading {len(AVATAR_FILES)} avatar assets...")
    for filename in AVATAR_FILES:
        url = f"{BASE_URL}/assets/avatars/{filename}"
        dest = AVATARS_DIR / filename
        if download_file(url, dest):
            success += 1
        else:
            failed.append(f"avatars/{filename}")

    print(f"\nDone: {success}/{total} assets downloaded")
    if failed:
        print(f"Failed ({len(failed)}):")
        for f in failed:
            print(f"  - {f}")
        # Don't fail the build — app will fall back to server for missing assets
        print("WARNING: Some assets failed. App will load them from server at runtime.")
    else:
        print("All assets successfully bundled into iOS app!")


if __name__ == "__main__":
    main()
