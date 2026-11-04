#!/usr/bin/env python3
"""Materialize one fresh branded Android project from the shared native journal."""
import argparse
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
BRANDS = {
    "goal": ("mm.futurecode.sportsjournal", "future-code-journal", "ဂိုးဇုံ အားကစားဂျာနယ်", "fc_goal", 5, "1.0.4"),
    "ykz": ("com.futurecode.ykzsoccertips", "ykz-family", "YKZ Soccer Tips", "fc_ykz", 5, "1.2.2"),
    "bw": ("com.futurecode.bwsportjournal", "bw-sport", "BW Sport Journal", "fc_bw", 4, "1.0.3"),
    "kothet": ("com.futurecode.kothetfamilyjournal", "ko-thet-family", "Ko Thet Family Journal", "fc_kothet", 5, "1.0.4"),
    "kmm": ("com.futurecode.kmmsporthub", "kmm-sport-hub", "KMM Sport Hub", "fc_kmm", 4, "1.0.3"),
    "bcf": ("mm.futurecode.betcityfamily", "bet-city-family", "BCF Bet City Family", "fc_bcf", 4, "1.0.3"),
}


def prepare(brand, config):
    package, route, label, topic, code, version = BRANDS[brand]
    data = json.loads(config.read_text(encoding="utf-8"))
    clients = {x["client_info"]["android_client_info"]["package_name"] for x in data["client"]}
    if data["project_info"]["project_id"] != "future-code-football" or package not in clients:
        raise ValueError("Firebase project/package mismatch")
    main = ROOT / "app/src/main"
    shutil.rmtree(main, ignore_errors=True)
    java = main / "java/mm/futurecode/sportsjournal"
    java.mkdir(parents=True)
    for source in (REPO / "android-journal/src/mm/futurecode/sportsjournal").glob("*.java"):
        value = source.read_text(encoding="utf-8")
        value = value.replace("/future-code-journal/", f"/{route}/")
        value = value.replace("ဂိုးဇုံ အားကစား ဂျာနယ်", label)
        value = value.replace("Goal Zone Sports Journal", label)
        if source.name == "Policy.java":
            # The WebView and notification deep link remain restricted to this brand.
            value = re.sub(r"public static boolean trustedApk\(String value\)\{.*?\}\s*$", "public static boolean trustedApk(String value){try{java.net.URI u=new java.net.URI(value);return \"https\".equals(u.getScheme())&&\"github.com\".equals(u.getHost())&&u.getPath().startsWith(\"/futurecode064-cyber/future-code-football-daily/releases/download/\")&&u.getPath().endsWith(\".apk\");}catch(Exception e){return false;}}\n}", value, flags=re.S)
        if source.name == "MainActivity.java":
            value = value.replace("super.onCreate(saved);", "super.onCreate(saved);PushService.subscribe(this);")
            value = value.replace("JournalJob.schedule(this);", "")
            # Old periodic checks sent extra local notices. FCM owns the two slots.
            value = value.replace("new Thread(()->{try{ContentNotifier.check(this);}catch(Exception ignored){}}).start();", "")

        if source.name == "ContentNotifier.java":
            value = "package mm.futurecode.sportsjournal; import android.content.Context; public final class ContentNotifier { public static void check(Context c){} public static void channels(Context c){} }\n"
        (java / source.name).write_text(value, encoding="utf-8")
    shutil.copyfile(ROOT / "PushService.java", java / "PushService.java")
    shutil.copytree(REPO / "android-journal/res", main / "res")
    shutil.copytree(REPO / "android-journal/assets", main / "assets")
    icon = ROOT / "bcf-logo.png" if brand == "bcf" else REPO / "football-daily" / route / "assets/logo.webp"
    if icon.suffix == ".webp":
        from PIL import Image
        Image.open(icon).convert("RGBA").save(main / "res/drawable-nodpi/logo.png")
    else:
        shutil.copyfile(icon, main / "res/drawable-nodpi/logo.png")
    manifest = (REPO / "android-journal/AndroidManifest.xml").read_text(encoding="utf-8")
    manifest = manifest.replace('package="mm.futurecode.sportsjournal"', '')
    manifest = manifest.replace('android:versionCode="2" android:versionName="1.0.1"', '')
    manifest = manifest.replace("ဂိုးဇုံ အားကစား ဂျာနယ်", label)
    manifest = manifest.replace('android:authorities="mm.futurecode.sportsjournal.updates"', 'android:authorities="${applicationId}.updates"')
    manifest = manifest.replace(" </application>", '  <service android:name=".PushService" android:exported="false"><intent-filter><action android:name="com.google.firebase.MESSAGING_EVENT"/></intent-filter></service>\n </application>')
    (main / "AndroidManifest.xml").write_text(manifest, encoding="utf-8")
    (main / "res/values/brand.xml").write_text(f'<resources><string name="push_topic">{topic}</string></resources>\n', encoding="utf-8")
    shutil.copyfile(config, ROOT / "app/google-services.json")
    return {"package": package, "topic": topic, "versionCode": code, "versionName": version}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("brand", choices=BRANDS)
    parser.add_argument("--config", type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(prepare(args.brand, args.config)))
