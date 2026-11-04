#!/usr/bin/env python3
"""Send at most one morning and one evening data-only FCM push per brand/day.

Run only after the live Cloudflare publication is readable. The caller persists
the state file on a separate Git branch after every successful invocation.
"""
import argparse
import datetime as dt
import json
import os
import pathlib
import urllib.request
from zoneinfo import ZoneInfo

BASE = "https://future-code-football-daily.pages.dev"
TOPICS = ("fc_goal", "fc_ykz", "fc_bw", "fc_kothet", "fc_kmm")


def live(path):
    req = urllib.request.Request(BASE + path, headers={"Cache-Control": "no-cache", "User-Agent": "FutureCodePublicationGate/1"})
    with urllib.request.urlopen(req, timeout=15) as response:
        if response.status != 200:
            raise ValueError("Live publication unavailable: " + path)
        return json.load(response)


def readiness(date, slot, report, odds, previous, evening=None):
    if report.get("reportDate") != date or report.get("published") is not True or not report.get("matches"):
        return False
    if odds.get("reportDate") != date or not odds.get("matches"):
        return False
    matches = {m.get("fixtureId"): m for m in report["matches"]}
    eligible = [m for m in odds["matches"] if m.get("eligibleForPreview") is not False]
    if not eligible or any(not m.get("fixtureId") or not m.get("bodyOdds", "").strip() or
                           not m.get("goalTotalOdds", "").strip() or
                           not matches.get(m["fixtureId"], {}).get("dailyPreviewText", "").strip() for m in eligible):
        return False
    if sum(bool(m.get("specialChoice") and m.get("specialAnalysisParagraphs")) for m in report["matches"]) < 2:
        return False
    yesterday = (dt.date.fromisoformat(date) - dt.timedelta(days=1)).isoformat()
    if previous.get("reportDate") != yesterday or previous.get("published") is not True or not isinstance(previous.get("matches"), list):
        return False
    if any(m.get("status") != "finished" or not m.get("finalScore") or not m.get("resultSourceUrl") or
           not m.get("resultVerifiedDate") for m in previous["matches"]):
        return False
    if slot == "evening":
        if not evening or evening.get("reportDate") != date or not evening.get("matches"):
            return False
        if any(not m.get("eveningBodyOdds", "").strip() or not m.get("eveningGoalTotalOdds", "").strip()
               for m in evening["matches"]):
            return False
    return True


def send(topic, date, slot, credentials):
    from google.auth.transport.requests import AuthorizedSession
    title = "ယနေ့ ဘောလုံးပွဲစဉ်များ" if slot == "morning" else "ယခု ပေါက်ကြေးများ"
    body = ("ယနေ့ပွဲစဉ်များနှင့် မနက်ပိုင်းပေါက်ကြေးများကို ကြည့်ရှုနိုင်ပါပြီ။ ပွဲကြိုသုံးသပ်ချက်များ၊ Special Choice နှင့် မနေ့ကရလဒ်များကိုလည်း ဖတ်ရှုနိုင်ပါပြီ။"
            if slot == "morning" else "ယခု ပေါက်ကြေးများကို ကြည့်ရှုနိုင်ပါပြီ။")
    payload = {"message": {"topic": topic, "data": {"slot": slot, "date": date, "title": title,
                "body": body, "route": BASE + "/" + {
                    "fc_goal": "future-code-journal", "fc_ykz": "ykz-family", "fc_bw": "bw-sport",
                    "fc_kothet": "ko-thet-family", "fc_kmm": "kmm-sport-hub", "fc_bcf": "bet-city-family"}[topic] + "/"},
                "android": {"priority": "high"}}}
    response = AuthorizedSession(credentials).post(
        "https://fcm.googleapis.com/v1/projects/future-code-football/messages:send", json=payload, timeout=20)
    response.raise_for_status()
    if not response.json().get("name"):
        raise ValueError("FCM did not acknowledge the message")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("slot", choices=("morning", "evening"))
    p.add_argument("--date", default=dt.datetime.now(ZoneInfo("Asia/Yangon")).date().isoformat())
    p.add_argument("--state", type=pathlib.Path, required=True)
    p.add_argument("--dry-run", action="store_true")
    a = p.parse_args()
    date = dt.date.fromisoformat(a.date)
    if date != dt.datetime.now(ZoneInfo("Asia/Yangon")).date():
        raise SystemExit("Only today's Yangon publication may notify")
    try:
        report = live("/data/today.json")
        odds = live(f"/data/odds/{date}.json")
        previous = live(f"/data/archive/{date - dt.timedelta(days=1)}.json")
        evening = live(f"/data/odds/evening/{date}.json") if a.slot == "evening" else None
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print("Live publication not ready; no FCM message sent:", type(error).__name__)
        return
    if not readiness(str(date), a.slot, report, odds, previous, evening):
        print("Publication incomplete; no FCM message sent")
        return
    state = json.loads(a.state.read_text() if a.state.exists() else "{}")
    done = state.setdefault(str(date), {}).setdefault(a.slot, [])
    if a.dry_run:
        print(json.dumps({"ready": True, "slot": a.slot, "pending_topics": [t for t in TOPICS if t not in done]}))
        return
    from google.oauth2 import service_account
    key = os.environ.get("FCM_SERVICE_ACCOUNT_JSON")
    if not key:
        raise SystemExit("FCM_SERVICE_ACCOUNT_JSON secret is required; no push sent")
    info = json.loads(key)
    if info.get("project_id") != "future-code-football":
        raise SystemExit("Service account project mismatch")
    credentials = service_account.Credentials.from_service_account_info(
        info, scopes=["https://www.googleapis.com/auth/firebase.messaging"])
    for topic in TOPICS:
        if topic in done:
            continue
        send(topic, str(date), a.slot, credentials)
        done.append(topic)
        temp = a.state.with_suffix(".tmp")
        temp.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n")
        temp.replace(a.state)
        print("FCM acknowledged", topic, a.slot)


if __name__ == "__main__":
    main()
