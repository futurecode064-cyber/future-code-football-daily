"""No-send manual notification input safety tests."""
import importlib.util
import os
from pathlib import Path
from unittest import TestCase, main
from unittest.mock import patch

source = Path(__file__).resolve().with_name("send-fcm-manual.py")
spec = importlib.util.spec_from_file_location("fc_manual_sender", source)
fc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(fc)
ID = "d154f3a3-217e-4f6e-a329-cf4f239179ee"
DEFAULT = {
    "FC_MANUAL_TARGETS": "goal,ykz,bw,kothet,kmm",
    "FC_MANUAL_TITLE": "New football journal",
    "FC_MANUAL_BODY": "Fresh football stories and odds today",
    "FC_MANUAL_LINK": "",
    "FC_MANUAL_REQUEST_ID": ID,
}


class ManualSendTest(TestCase):
    def check(self, **extra):
        with patch.dict(os.environ, {**DEFAULT, **extra}):
            return fc.clean_input()

    def test_all_five_brands(self):
        self.assertEqual(self.check()[0], list(fc.ROUTES))

    def test_duplicate_brand_rejected(self):
        with self.assertRaises(ValueError):
            self.check(FC_MANUAL_TARGETS="goal,goal")

    def test_unknown_brand_rejected(self):
        with self.assertRaises(ValueError):
            self.check(FC_MANUAL_TARGETS="betcity")

    def test_custom_same_brand_link_allowed(self):
        result = self.check(
            FC_MANUAL_TARGETS="goal",
            FC_MANUAL_LINK="https://future-code-football-daily.pages.dev/future-code-journal/?section=odds")
        self.assertEqual(result[4], ID)

    def test_custom_link_requires_single_brand(self):
        with self.assertRaises(ValueError):
            self.check(FC_MANUAL_LINK="https://future-code-football-daily.pages.dev/future-code-journal/")

    def test_external_link_rejected(self):
        with self.assertRaises(ValueError):
            self.check(FC_MANUAL_TARGETS="goal",
                       FC_MANUAL_LINK="https://example.com/future-code-journal/")

    def test_wrong_brand_link_rejected(self):
        with self.assertRaises(ValueError):
            self.check(FC_MANUAL_TARGETS="bw",
                       FC_MANUAL_LINK="https://future-code-football-daily.pages.dev/ykz-family/")

    def test_invalid_request_id(self):
        with self.assertRaises(ValueError):
            self.check(FC_MANUAL_REQUEST_ID="not-a-uuid")

    def test_empty_text_rejected(self):
        with self.assertRaises(ValueError):
            self.check(FC_MANUAL_BODY=" ")

    def test_five_topics_only(self):
        self.assertEqual({r[0] for r in fc.ROUTES.values()},
                         {"fc_goal", "fc_ykz", "fc_bw", "fc_kothet", "fc_kmm"})


if __name__ == "__main__":
    main()
