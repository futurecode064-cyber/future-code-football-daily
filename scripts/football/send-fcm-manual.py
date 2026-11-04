#!/usr/bin/env python3
"""Owner-only FCM campaign through GitHub Actions; validates all inputs.
Existing 4-Nov Android apps: background notifications can display through
Firebase's notification payload. Foreground/manual deep links need an APK upgrade.
No private keys in this file; GitHub secret only.
"""
import json
import os
import re
import uuid
from urllib.parse import urlsplit
from datetime import datetime
from zoneinfo import ZoneInfo

from google.auth.transport.requests import AuthorizedSession
from google.oauth2 import service_account

BASE = "https://future-code-football-daily.pages.dev"
PROJECT = "future-code-football"
ROUTES = {
    "goal": ("fc_goal", "future-code-journal"),
    "ykz": ("fc_ykz", "ykz-family"),
    "bw": ("fc_bw", "bw-sport"),
    "kothet": ("fc_kothet", "ko-thet-family"),
    "kmm": ("fc_kmm", "kmm-sport-hub"),
}


def clean_input():
    raw = os.environ.get("FC_MANUAL_TARGETS", "")
    targets = raw.split(",")
    if not (1 <= len(targets) <= 5) or len(set(targets)) != len(targets):
        raise ValueError("Select one to five unique APK targets")
    if any(t not in ROUTES for t in targets):
        raise ValueError("Unknown APK target")
    title = os.environ.get("FC_MANUAL_TITLE", "").strip()
    body = os.environ.get("FC_MANUAL_BODY", "").strip()
    link = os.environ.get("FC_MANUAL_LINK", "").strip()
    if not (2 <= len(title) <= 100 and 2 <= len(body) <= 350):
        raise ValueError("Invalid title or body length")
    if len(link) > 350 or any(c in link for c in ("\n", "\r", "\\")):
        raise ValueError("Invalid link")
    try:
        request_id = str(uuid.UUID(os.environ.get("FC_MANUAL_REQUEST_ID", "")))
    except ValueError as ex:
        raise ValueError("Invalid request ID") from ex
    if not re.fullmatch(r"[a-z0-9-]{36}", request_id):
        raise ValueError("Request ID format error")
    if link:
        if len(targets) != 1:
            raise ValueError("Custom link needs one brand target")
        page = urlsplit(link)
        expected = "/" + ROUTES[targets[0]][1] + "/"
        if (page.scheme != "https" or page.netloc != "future-code-football-daily.pages.dev"
            or not page.path.startswith(expected) or page.fragment or page.username or page.password):
            raise ValueError("Link must belong to the selected Future Code website")
    return targets, title, body, link, request_id


def main():
    targets, title, body, link, request_id = clean_input()
    secret = os.environ.get("FCM_SERVICE_ACCOUNT_JSON")
    if not secret:
        raise RuntimeError("Firebase service account secret is not configured")
    info = json.loads(secret)
    if info.get("project_id") != PROJECT:
        raise RuntimeError("Firebase service account project mismatch")
    credential = service_account.Credentials.from_service_account_info(
        info, scopes=["https://www.googleapis.com/auth/firebase.messaging"])
    session = AuthorizedSession(credential)
    dry_run = os.environ.get("FC_MANUAL_DRY_RUN", "false").lower() == "true"
    day = datetime.now(ZoneInfo("Asia/Yangon")).date().isoformat()
    for target in targets:
        topic, route = ROUTES[target]
        url = link or f"{BASE}/{route}/"
        message = {
            "topic": topic,
            "notification": {"title": title, "body": body},
            "data": {
                "slot": "manual", "date": day, "id": request_id,
                "title": title, "body": body, "route": url
            },
            "android": {"priority": "high"}
        }
        result = session.post(
            f"https://fcm.googleapis.com/v1/projects/{PROJECT}/messages:send",
            json={"validate_only": dry_run, "message": message},
            timeout=25
        )
        result.raise_for_status()
        if not result.json().get("name"):
            raise RuntimeError("Firebase did not acknowledge topic " + topic)
        print(f"FCM {'VALIDATION' if dry_run else 'ACK'}: {target} ({topic})")
    print(f"Finished {len(targets)} topic(s); Firebase acknowledgment is not proof of handset delivery.")


if __name__ == "__main__":
    main()
