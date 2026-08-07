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

# All emotion/sticker asset filenames (from dist/public/assets/emotions/ on production server)
EMOTION_FILES = [
    "emotion_devil_angry_e4ff36c8.png",
    "emotion_devil_cool_e5b18242.png",
    "emotion_devil_heart_4914bc75.png",
    "emotion_devil_hurry_97527c35.png",
    "emotion_devil_laugh_810771e3.png",
    "emotion_devil_sad_fc1ad763.png",
    "emotion_devil_sleep_5d68d751.png",
    "emotion_devil_think_a32cf7f5.png",
    "emotion_devil_win_d390dde4.png",
    "emotion_devil_wow_6f7fcd2b.png",
    "emotion_khan_angry_8618af32.png",
    "emotion_khan_cool_7a4a8a8d.png",
    "emotion_khan_heart_e35ddda3.png",
    "emotion_khan_hurry_618fde27.png",
    "emotion_khan_laugh_68ee4d40.png",
    "emotion_khan_sad_27908e27.png",
    "emotion_khan_sleep_be20119f.png",
    "emotion_khan_think_33befc92.png",
    "emotion_khan_win_e091d556.png",
    "emotion_khan_wow_a86a7e15.png",
    "emotion_monkey_angry_9fb48b22.png",
    "emotion_monkey_cool_4b56eac0.png",
    "emotion_monkey_heart_6fb9e4ca.png",
    "emotion_monkey_hurry_33227715.png",
    "emotion_monkey_laugh_9e3429b4.png",
    "emotion_monkey_sad_a1b76315.png",
    "emotion_monkey_sleep_0c454b9a.png",
    "emotion_monkey_think_979faf8d.png",
    "emotion_monkey_win_cbae3999.png",
    "emotion_monkey_wow_4a569438.png",
    "emotion_raccoon_angry-6uVHKrrqCwQBznY5aEh5nC.png",
    "emotion_raccoon_cool-6rKk5ui5mySEY6uXKComWK.png",
    "emotion_raccoon_heart_v2-TyneVuyMKoLBPNQZyanUc2.png",
    "emotion_raccoon_hurry_v2-agQoZychkNzdjxPYvtLDTE.png",
    "emotion_raccoon_ref_laugh_abe704af.png",
    "emotion_raccoon_sad-FbNZWtaWSm6Fb4ausscNNE.png",
    "emotion_raccoon_sleep-JPQYVFAzJtFXuS2m8Ko3Ax.png",
    "emotion_raccoon_think-mo3SbXpKKwTTsM6y8SaNUQ.png",
    "emotion_raccoon_win-PHHWAUiVmxmYgk2AimmfrD.png",
    "emotion_raccoon_wow-4QRjVrmn7WYaBBZsWLL8Ej.png",
]

# All static image assets (season avatars, premium avatars, bot avatars, icons)
# from dist/public/assets/static/ on production server. Audio (mp3/wav) is NOT
# bundled — music and sounds still stream from the server.
STATIC_FILES = [
    "amaterasu_ruby-Uxg7HYRBpY2EuX7FcdsGRE.webp",
    "amber_angels_demons_v2_b882b3bd.png",
    "amber_apocalypse_s8_96da3687.png",
    "amber_cyberpunk_v4-52jR9jKRMgjhsCZXjNstx8.webp",
    "amber_egyptian_gods_v2_43e04e99.png",
    "amber_hiphop_90s_v2_5310991c.png",
    "amber_japanese_s9_11a4e751.png",
    "amber_kazakh_s6_v2_675d657a.png",
    "amber_neon_era_s7_v2_434a2768.png",
    "amber_norse_gods_v2_f21b55c1.png",
    "amber_pirate_islands_v2_e0aa3599.png",
    "amber_space_odyssey_v2_adde7dfd.png",
    "amber_underwater_world_v2_0c6b5664.png",
    "avatar_vip-5gYQDzq92heL65Hxbz4iAY.webp",
    "avatar-bear-ggTgCeFCLsPRpzpWmUe6og.webp",
    "avatar-eagle-KxvbVg3oAviwrdXzEpvXdT.webp",
    "avatar-fox-A7ZAaomsUx9cfjYNNWxFw7.webp",
    "avatar-snow-leopard-UGXKzhokntwzXvBoUdi5Lq.webp",
    "avatar-wolf-fJ9SNhipdz6heHu7Au5XVp.webp",
    "bot_avatar-bkCC7RwD3DYoJiFYZiby6m.webp",
    "diving_eagle_avatar-mETA3RPC2znnKVf6a8Nzyx.webp",
    "dragon_ryu_sapphire_47630a0e.webp",
    "gasmask_avatar-nsq2WhNPXn8BwEayozZWdW.webp",
    "gasmask_avatar-QspMaqo2ZQTvwEek5U4B35.png",
    "golden_horde_warrior_avatar-oJWWxe5DCcpxB9nbWMET8o.webp",
    "goose_new_8597b7f9.png",
    "great_khan_avatar-N9ykdAF9YU7urTnqCdUiJa.webp",
    "khan_steppe_avatar-72rsBrDvaNJLS7y5xKmfwa.webp",
    "kitsune_emerald_4eb0f364.webp",
    "neon_cat_amber_v2-G4HW9sWsBNkEHaW35YPvxs.webp",
    "neon_crown_no_ring-k2gijZGF223aiMcs6ZohLm.webp",
    "neon_crown_obsidian-3s7gu4bnxW94srxC2sGYmd.webp",
    "neon_dino_ruby-e5c5vvCmCmU37AgnHKyEXM.webp",
    "neon_paw_v2-J7ntbHJYh3mwfqGttW7nfX.webp",
    "nexus_bunny_avatar-JL5A5iF6tsP42JWaLwG3Uf.webp",
    "nuclear_mushroom_avatar-XqWr3xsdoLrkX3ZZrjUQTm.webp",
    "obsidian_angels_demons-Jb4TqRyJ4bRGFfWdknwUSR.webp",
    "obsidian_apocalypse_v2_464c2e3e.png",
    "obsidian_cyberpunk-F42HmWbza98ZbqBggYVNNt.webp",
    "obsidian_egyptian_gods-HwZuAJipid5wMPLwE9jfDN.webp",
    "obsidian_hiphop_90s-Rx5QAgMC5akbKfSPh2UYkY.webp",
    "obsidian_japanese_v2_0098554b.png",
    "obsidian_kazakh_v2-CwSTTzwCooxU3Z7eSWybpy.webp",
    "obsidian_neon_era_v2-adGE4hKxxPSNzmcWxb3qZE.webp",
    "obsidian_norse_gods-cZ2YKE5bVYuvdXd4WuLkfw.webp",
    "obsidian_pirate_islands-m7mqMLNNUB3WiggJMsPgQ7.webp",
    "obsidian_space_odyssey-7gENsHLXLmZaeUU6EcPbyv.webp",
    "obsidian_underwater_world-CrTo39hHA3GNH6kCigzNr8.webp",
    "oni_mask_obsidian_v3-hJ3tDNhcH7vPq6s95Cuzo4.webp",
    "ruby_angels_demons_dc4a2a91.png",
    "ruby_apocalypse_final_791c8b8e.png",
    "ruby_cyberpunk_ee56c332.png",
    "ruby_egyptian_gods_52ceb9b8.png",
    "ruby_hiphop_90s_bde0fc3c.png",
    "ruby_japanese_v2_ed9fc656.png",
    "ruby_kazakh_v3_49409013.png",
    "ruby_neon_era_v3_42502a8f.png",
    "ruby_norse_gods_0fa3c331.png",
    "ruby_pirate_islands_acbbbc77.png",
    "ruby_space_odyssey_f080fce1.png",
    "ruby_underwater_world_83a8b445.png",
    "samurai_amber_v2-m4pBvqrF6e84KqmZx6QZvq.webp",
    "shanyrak_96e91a49.png",
    "tenge_9aefd1b7.png",
    "toxic_storm_avatar-cR6SmN4ZtMUEBVktcpwyo9.png",
    "zircon_angels_demons-awXaXT9p65ykxqqS4S3xJH.webp",
    "zircon_apocalypse_s8-mX7QoLXFqTx273Bn5WwJjA.webp",
    "zircon_cyberpunk-WoVy5sKCJ5JyjptcjACrCB.webp",
    "zircon_egyptian_gods-QgX6A97reWsR5kYtv89KEo.webp",
    "zircon_hiphop_90s-fpFrZPKBD9JDsSsTgumemU.webp",
    "zircon_japanese_s9-fETuS5Sokkh8MuW2cmwvAe.webp",
    "zircon_kazakh_s6-D6TwZfEa5H9yauccNCb6G8.webp",
    "zircon_neon_era_s7-JpdjrjrWH8jv3RJmLRUukG.webp",
    "zircon_norse_gods-7mstNcbdxCWQHP2qZEqVws.webp",
    "zircon_pirate_islands-MazjDWUxFEetXNUmozCPXp.webp",
    "zircon_space_odyssey-m9fwPZ82eoVAaZJjtkHisU.webp",
    "zircon_underwater_world-oCe3ChkQWpQrq9YoZjPDnd.webp",
]

CARDS_DIR = Path("dist/public/assets/cards")
AVATARS_DIR = Path("dist/public/assets/avatars")
EMOTIONS_DIR = Path("dist/public/assets/emotions")
STATIC_DIR = Path("dist/public/assets/static")

CARDS_DIR.mkdir(parents=True, exist_ok=True)
AVATARS_DIR.mkdir(parents=True, exist_ok=True)
EMOTIONS_DIR.mkdir(parents=True, exist_ok=True)
STATIC_DIR.mkdir(parents=True, exist_ok=True)


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
    total = len(CARD_FILES) + len(AVATAR_FILES) + len(EMOTION_FILES) + len(STATIC_FILES)
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

    print(f"\nDownloading {len(EMOTION_FILES)} emotion assets...")
    for filename in EMOTION_FILES:
        url = f"{BASE_URL}/assets/emotions/{filename}"
        dest = EMOTIONS_DIR / filename
        if download_file(url, dest):
            success += 1
        else:
            failed.append(f"emotions/{filename}")

    print(f"\nDownloading {len(STATIC_FILES)} static image assets...")
    for filename in STATIC_FILES:
        url = f"{BASE_URL}/assets/static/{filename}"
        dest = STATIC_DIR / filename
        if download_file(url, dest):
            success += 1
        else:
            failed.append(f"static/{filename}")

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
