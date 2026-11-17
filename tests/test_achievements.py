"""Badges are earned once and only for known actions."""
import pathlib
import sys
import tempfile
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = str(REPO_ROOT / "src")
if SRC not in sys.path:
    sys.path.append(SRC)

from jojo_code import create_app, routes, users  # noqa: E402


class AchievementTests(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self._saved = (routes.CONFIG_DIR, routes.CONFIG_FILE, routes.ACCESS_CODE)
        routes.CONFIG_DIR = pathlib.Path(self._tmp.name)
        routes.CONFIG_FILE = routes.CONFIG_DIR / "config.json"
        routes.ACCESS_CODE = ""
        self.addCleanup(self._restore)
        app = create_app()
        app.config["TESTING"] = True
        self.client = app.test_client()

    def _restore(self):
        routes.CONFIG_DIR, routes.CONFIG_FILE, routes.ACCESS_CODE = self._saved
        self._tmp.cleanup()

    def test_awards_once_and_refuses_unknown_keys(self):
        users.register("ada", "a long passphrase")
        self.assertEqual(users.award("ada", "first_run"), (True, "first_run"))
        self.assertEqual(users.award("ada", "first_run"), (False, ""))
        self.assertEqual(users.award("ada", "nonsense"), (False, ""))
        self.assertEqual(users.achievements("ada"), ["first_run"])

    def test_api_needs_a_signed_in_reader(self):
        response = self.client.post('/api/achievements/award', json={'key': 'doom'})
        self.assertEqual(response.status_code, 403)

    def test_badges_give_xp_once(self):
        users.register("ada", "a long passphrase")
        users.award("ada", "doom")
        self.assertEqual(users.progress("ada")["xp"], 200)
        users.award("ada", "doom")
        self.assertEqual(users.progress("ada")["xp"], 200)

    def test_repeatable_xp_moves_the_rank(self):
        users.register("ada", "a long passphrase")
        self.assertTrue(users.award_xp("ada", "code_run")[0])
        self.assertFalse(users.award_xp("ada", "unknown")[0])
        record = users.load_users()["ada"]
        record["xp"] = 1200
        users.save_users({"ada": record})
        state = users.progress("ada")
        self.assertEqual(state["rank"], "gold")
        self.assertEqual(state["level"], 5)
        self.assertEqual(state["next_rank"], "platinum")

    def test_api_awards_xp_and_reports_progress(self):
        users.register("ada", "a long passphrase")
        with self.client.session_transaction() as session:
            session['user_username'] = 'ada'
        self.assertEqual(self.client.post('/api/xp/award', json={'reason': 'shell'}).status_code, 200)
        state = self.client.get('/api/progress').get_json()
        self.assertEqual(state['xp'], 5)
        self.assertEqual(state['rank'], 'bronze')

    def test_api_returns_the_full_list_with_earned_flags(self):
        users.register("ada", "a long passphrase")
        users.award("ada", "doom")
        with self.client.session_transaction() as session:
            session['user_username'] = 'ada'
        data = self.client.get('/api/achievements').get_json()
        self.assertEqual(data['earned'], ['doom'])
        self.assertIn('first_run', data['all'])
        self.assertEqual(len(data['all']), 6)


if __name__ == "__main__":
    unittest.main()
