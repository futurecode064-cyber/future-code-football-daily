import importlib.util
from pathlib import Path
import unittest

path = Path(__file__).with_name("send-fcm-after-publish.py")
spec = importlib.util.spec_from_file_location("push", path)
push = importlib.util.module_from_spec(spec)
spec.loader.exec_module(push)


class PublicationGateTests(unittest.TestCase):
    def setUp(self):
        self.date = "2026-10-30"
        self.report = {"reportDate": self.date, "published": True, "matches": [
            {"fixtureId": key, "dailyPreviewText": "analysis", "specialChoice": True,
             "specialAnalysisParagraphs": ["choice"]} for key in ("a", "b")]}
        self.odds = {"reportDate": self.date, "matches": [
            {"fixtureId": key, "bodyOdds": "-70", "goalTotalOdds": "2-30"} for key in ("a", "b")]}
        self.previous = {"reportDate": "2026-10-29", "published": True, "matches": [
            {"status": "finished", "finalScore": "2-1", "resultSourceUrl": "https://example.org",
             "resultVerifiedDate": self.date}]}
        self.evening = {"reportDate": self.date, "matches": [
            {"eveningBodyOdds": "-60", "eveningGoalTotalOdds": "2-20"}]}

    def ready(self, slot="morning"):
        return push.readiness(self.date, slot, self.report, self.odds, self.previous, self.evening)

    def test_two_slots_only_when_complete(self):
        self.assertTrue(self.ready())
        self.assertTrue(self.ready("evening"))
        self.previous["matches"][0]["status"] = "scheduled"
        self.assertFalse(self.ready())

    def test_missing_preview_and_current_odds_block(self):
        self.report["matches"][0]["dailyPreviewText"] = ""
        self.assertFalse(self.ready())
        self.report["matches"][0]["dailyPreviewText"] = "analysis"
        self.evening["matches"][0]["eveningBodyOdds"] = ""
        self.assertTrue(self.ready())
        self.assertFalse(self.ready("evening"))


if __name__ == "__main__":
    unittest.main()
