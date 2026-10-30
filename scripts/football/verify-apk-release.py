#!/usr/bin/env python3
"""Fail a football APK release before publishing a broken FCM/update build.

Usage: verify-apk-release.py APK PACKAGE VERSION_CODE [PREVIOUS_APK]
Requires androguard (`pip install androguard`). Never prints signing keys.
"""
import hashlib
import sys
from pathlib import Path

from loguru import logger

logger.remove()
from androguard.core.apk import APK


def inspect(path):
    apk = APK(str(path))
    certs = apk.get_certificates_der_v2() or apk.get_certificates_der_v1()
    resources = apk.get_android_resources()
    package = apk.get_package()
    return {
        "package": package,
        "code": int(apk.get_androidversion_code()),
        "version": apk.get_androidversion_name(),
        "certificate": hashlib.sha256(certs[0]).hexdigest() if certs else None,
        "firebase_app": resources.get_string(package, "google_app_id"),
        "firebase_sender": resources.get_string(package, "gcm_defaultSenderId"),
        "notifications": "android.permission.POST_NOTIFICATIONS" in apk.get_permissions(),
    }


def main():
    if len(sys.argv) not in (4, 5):
        raise SystemExit(__doc__)
    path, package, code = Path(sys.argv[1]), sys.argv[2], int(sys.argv[3])
    current = inspect(path)
    errors = []
    if current["package"] != package:
        errors.append("wrong Android application ID")
    if current["code"] != code:
        errors.append("wrong versionCode")
    if not current["certificate"]:
        errors.append("APK has no signing certificate")
    if not current["firebase_app"] or not current["firebase_sender"]:
        errors.append("Firebase app ID or sender ID missing from APK resources")
    if not current["notifications"]:
        errors.append("POST_NOTIFICATIONS permission missing")
    if len(sys.argv) == 5:
        previous = inspect(Path(sys.argv[4]))
        if previous["package"] != current["package"]:
            errors.append("previous application ID differs")
        if previous["certificate"] != current["certificate"]:
            errors.append("signing certificate differs; in-place update impossible")
        if previous["code"] >= current["code"]:
            errors.append("versionCode must increase")
    print(f'{path.name}: {current["package"]} v{current["version"]} code={current["code"]}')
    if errors:
        for error in errors:
            print("FAIL:", error, file=sys.stderr)
        return 1
    print("PASS: package, version, signing and FCM configuration")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
