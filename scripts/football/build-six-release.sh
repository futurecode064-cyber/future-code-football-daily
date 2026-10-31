#!/usr/bin/env bash
set -euo pipefail
set +x
: "${FC_GOOGLE_SERVICES_JSON:?Protected Firebase six-app Android JSON required}"
: "${FC_APK_RELEASE_KEYSTORE_B64:?Persistent signing keystore missing}"
: "${FC_APK_RELEASE_STOREPASS:?Signing passphrase missing}"
: "${FC_APK_RELEASE_ALIAS:?Signing alias missing}"
: "${FC_APK_RELEASE_KEYPASS:?Signing keypass missing}"
export FC_REQUIRE_FCM=true
mkdir -p dist
FC_APK_KEYSTORE_PATH="$RUNNER_TEMP/fc-football-release-signing.p12"
export FC_APK_KEYSTORE_PATH
printf '%s' "$FC_APK_RELEASE_KEYSTORE_B64" | base64 --decode > "$FC_APK_KEYSTORE_PATH"
chmod 600 "$FC_APK_KEYSTORE_PATH"
trap 'rm -f "$FC_APK_KEYSTORE_PATH"' EXIT
GDIR="$(pwd)"
AAPT="$ANDROID_HOME/build-tools/35.0.0/aapt"
SIGN="$ANDROID_HOME/build-tools/35.0.0/apksigner"

# Reuse all ORIGINAL brand Java/WebView/download logic. The source is pinned at build time.
brands=(ykz bw ko_thet kmm)
for brand in "${brands[@]}"; do
  cd "$GDIR/upstream"
  python3 scripts/football-apk-vnext-build.py "$brand"
  # Retry transient Maven/Google repository outages without rebuilding under a different signer.
  python3 - "/tmp/football_vnext_${brand}.sh" <<'PY'
import sys
from pathlib import Path
p=Path(sys.argv[1]);s=p.read_text()
needle="gradle --no-daemon :app:assembleRelease"
if s.count(needle)!=1:raise SystemExit("Unexpected signed release build command")
s=s.replace(needle,needle+" || { sleep 12; "+needle+"; }")
p.write_text(s)
PY
  bash "/tmp/football_vnext_${brand}.sh"
  case "$brand" in
    ykz) sourceAPK=$GDIR/ykz-apk-output/YKZ-Soccer-Tips.apk; name=FC-YKZ-v1.2.1-FreshInstall.apk; pkg=com.futurecode.ykzsoccertips; code=4 ;;
    bw) sourceAPK=$GDIR/bw-apk-output/BW-Sport-Journal.apk; name=FC-BW-v1.0.2-FreshInstall.apk; pkg=com.futurecode.bwsportjournal; code=3 ;;
    ko_thet) sourceAPK=$GDIR/ko-thet-apk-output/Ko-Thet-Family-Journal.apk; name=FC-Ko-Thet-v1.0.3-FreshInstall.apk; pkg=com.futurecode.kothetfamilyjournal; code=4 ;;
    kmm) sourceAPK=$GDIR/kmm-apk-output/KMM-Sport-Hub.apk; name=FC-KMM-v1.0.2-FreshInstall.apk; pkg=com.futurecode.kmmsporthub; code=3 ;;
  esac
  echo "QA_START $brand (signed non-debug Android Release)"
  test -s "$sourceAPK" || { echo "QA_FAIL $brand output missing"; exit 1; }
  cp "$sourceAPK" "$GDIR/dist/$name"
  "$SIGN" verify --verbose "$GDIR/dist/$name" >/dev/null || { echo "QA_FAIL $brand APK signature"; exit 1; }
  echo "QA_OK $brand signature"
  "$AAPT" dump badging "$GDIR/dist/$name" | grep -F "name='$pkg'" >/dev/null || { echo "QA_FAIL $brand package"; exit 1; }
  echo "QA_OK $brand package"
  "$AAPT" dump badging "$GDIR/dist/$name" | grep -F "versionCode='$code'" >/dev/null || { echo "QA_FAIL $brand versionCode"; exit 1; }
  echo "QA_OK $brand version"
  if "$AAPT" dump badging "$GDIR/dist/$name" | grep -F 'application-debuggable' >/dev/null; then echo "QA_FAIL $brand debuggable"; exit 1; fi
  echo "QA_OK $brand not debuggable"
  "$AAPT" dump xmltree "$GDIR/dist/$name" AndroidManifest.xml | grep -F PushMessageService >/dev/null || { echo "QA_FAIL $brand FCM service manifest"; exit 1; }
  echo "QA_OK $brand Firebase service"
  "$AAPT" dump resources "$GDIR/dist/$name" | grep -F 'google_app_id' >/dev/null || { echo "QA_FAIL $brand Firebase app resource"; exit 1; }
  "$AAPT" dump resources "$GDIR/dist/$name" | grep -F 'gcm_defaultSenderId' >/dev/null || { echo "QA_FAIL $brand Firebase sender resource"; exit 1; }
  echo "QA_OK $brand Firebase resources"
  sha256sum "$GDIR/dist/$name" > "$GDIR/dist/$name.sha256"
  echo "SIGNED_RELEASE_BUILT $brand $pkg versionCode=$code"
done

# Exact original Goal Zone Java and its BCF-derived variant, not a generic wrapper.
for brand in goal_zone bcf; do
  cd "$GDIR"
  if [[ "$brand" == "bcf" ]]; then
    python3 - <<'PY'
from pathlib import Path
import shutil
src=Path("android-journal")
dest=Path("/tmp/fc-bcf-native-release")
if dest.exists():shutil.rmtree(dest)
shutil.copytree(src,dest,ignore=shutil.ignore_patterns("build",".gradle"))
changes=[
 ("mm.futurecode.sportsjournal","mm.futurecode.betcityfamily"),
 ("future-code-journal","bet-city-family"),
 ("ဂိုးဇုံ အားကစား ဂျာနယ်","BCF ဘောလုံးဂျာနယ်"),
 ("Goal Zone Sports Journal","BCF Journal"),
 ('Policy.HOME+"odds"','Policy.HOME+"odds.html"')]
for p in [*dest.rglob("*.java"),*dest.rglob("*.xml"),*dest.rglob("*.gradle"),dest/"README.md"]:
 if not p.exists():continue
 s=p.read_text(encoding="utf-8")
 for a,b in changes:s=s.replace(a,b)
 p.write_text(s,encoding="utf-8")
assert (dest/"fcm/src/main/java/mm/futurecode/sportsjournal/FcmStarter.java").exists()
PY
    sourceDir="/tmp/fc-bcf-native-release/fcm"
    pkg="mm.futurecode.betcityfamily"
    code=4
    version=1.0.3
    name=FC-BCF-v1.0.3-FreshInstall.apk
    topic=fc_football_bcf
  else
    sourceDir="$GDIR/android-journal/fcm"
    pkg="mm.futurecode.sportsjournal"
    code=5
    version=1.0.4
    name=FC-Goal-Zone-v1.0.4-FreshInstall.apk
    topic=fc_football_goal_zone
  fi
  # Select exact Android client from protected Firebase JSON; do not print API key.
  export FC_TARGET_PACKAGE="$pkg"
  source <(python3 - <<'PY'
import os,json,shlex
d=json.loads(os.environ["FC_GOOGLE_SERVICES_JSON"])
p=os.environ["FC_TARGET_PACKAGE"]
c=[v for v in d["client"] if v["client_info"]["android_client_info"]["package_name"]==p]
if len(c)!=1:raise SystemExit("BLOCKED: Firebase package mapping")
v=c[0]
values={"FC_FIREBASE_APP_ID":v["client_info"]["mobilesdk_app_id"],
"FC_FIREBASE_API_KEY":v["api_key"][0]["current_key"],
"FC_FIREBASE_PROJECT_ID":d["project_info"]["project_id"],
"FC_FIREBASE_SENDER_ID":str(d["project_info"]["project_number"])}
for k,val in values.items():print("export "+k+"="+shlex.quote(val))
PY
  )
  cd "$sourceDir"
  cat >> build.gradle <<'FCSIGNING'
android {
 signingConfigs {
  fcOwner {
   storeFile file(System.getenv("FC_APK_KEYSTORE_PATH"))
   storePassword System.getenv("FC_APK_RELEASE_STOREPASS")
   keyAlias System.getenv("FC_APK_RELEASE_ALIAS")
   keyPassword System.getenv("FC_APK_RELEASE_KEYPASS")
  }
 }
 buildTypes { release { signingConfig signingConfigs.fcOwner; minifyEnabled false } }
}
FCSIGNING
  gradle --no-daemon :assembleRelease -PFC_PACKAGE="$pkg" -PFC_VERSION_CODE="$code" -PFC_VERSION_NAME="$version" -PFC_TOPIC="$topic" || { sleep 12; gradle --no-daemon :assembleRelease -PFC_PACKAGE="$pkg" -PFC_VERSION_CODE="$code" -PFC_VERSION_NAME="$version" -PFC_TOPIC="$topic"; }
  APK="$(find build/outputs/apk/release -name '*.apk' -type f | head -n1)"
  test -s "$APK"
  cp "$APK" "$GDIR/dist/$name"
  "$SIGN" verify --verbose "$GDIR/dist/$name" >/dev/null
  "$AAPT" dump badging "$GDIR/dist/$name" | grep -F "name='$pkg'" >/dev/null
  "$AAPT" dump badging "$GDIR/dist/$name" | grep -F "versionCode='$code'" >/dev/null
  "$AAPT" dump badging "$GDIR/dist/$name" | grep -F 'application-debuggable' && { echo "BLOCKED: debuggable $brand"; exit 1; } || true
  "$AAPT" dump xmltree "$GDIR/dist/$name" AndroidManifest.xml | grep -F PushMessageService >/dev/null
  "$AAPT" dump resources "$GDIR/dist/$name" | grep -F 'google_app_id' >/dev/null
  "$AAPT" dump resources "$GDIR/dist/$name" | grep -F 'gcm_defaultSenderId' >/dev/null
  sha256sum "$GDIR/dist/$name" > "$GDIR/dist/$name.sha256"
  echo "SIGNED_RELEASE_BUILT $brand $pkg versionCode=$code"
done

# Verify stable signer across all six *new* releases (not equal to old signers).
expected=""
for apk in "$GDIR"/dist/*.apk; do
  signer="$("$SIGN" verify --print-certs "$apk" | sed -n 's/^Signer #1 certificate SHA-256 digest: //p' | head -1)"
  test -n "$signer"
  if [[ -n "$expected" && "$signer" != "$expected" ]]; then echo "BLOCKED: inconsistent new owner release signing certificate"; exit 1; fi
  expected="$signer"
done
test "$(find "$GDIR/dist" -name '*.apk' | wc -l)" -eq 6
echo "RELEASE_QA_PASS six distinct Android package IDs, version codes, packaged FCM services, Android resources and one durable signing identity."
