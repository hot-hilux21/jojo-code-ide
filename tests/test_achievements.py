"""Badges are earned once and only for known actions."""
import pathlib
import sys
import tempfile
import unittest
from unittest import mock

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

    def test_no_client_callable_xp_endpoint(self):
        users.register("ada", "a long passphrase")
        with self.client.session_transaction() as session:
            session['user_username'] = 'ada'
        self.assertEqual(self.client.post('/api/xp/award', json={'reason': 'shell'}).status_code, 404)

    def test_saving_a_file_awards_xp_server_side(self):
        users.register("ada", "a long passphrase")
        with self.client.session_transaction() as session:
            session['user_username'] = 'ada'
        self.assertEqual(self.client.post('/api/user/files', json={
            'name': 'work.py', 'code': 'print(1)',
        }).status_code, 200)
        self.assertGreaterEqual(users.progress('ada')['xp'], 20)

    def test_divisions_rise_with_xp_inside_a_rank(self):
        users.register("ada", "a long passphrase")
        for xp, division in ((0, 'I'), (700, 'II'), (900, 'III'), (3000, 'I')):
            record = users.load_users()
            record['ada']['xp'] = xp
            users.save_users(record)
            state = users.progress('ada')
            self.assertEqual(state['division'], division)
            self.assertEqual(state['label'], state['rank'].capitalize() + ' ' + division)

    def test_streak_advances_once_per_day(self):
        users.register("ada", "a long passphrase")
        with mock.patch.object(users, '_today', return_value='2026-11-17'):
            users.award_xp('ada', 'code_run')
            self.assertEqual(users.streak('ada')['current'], 1)
            users.award_xp('ada', 'code_run')
            self.assertEqual(users.streak('ada')['current'], 1)
        with mock.patch.object(users, '_today', return_value='2026-11-18'):
            users.award_xp('ada', 'code_run')
            self.assertEqual(users.streak('ada')['current'], 2)
            self.assertEqual(users.streak('ada')['best'], 2)
        with mock.patch.object(users, '_today', return_value='2026-11-20'):
            self.assertEqual(users.streak('ada')['current'], 0)
            users.award_xp('ada', 'code_run')
            self.assertEqual(users.streak('ada')['current'], 1)

    def test_leaderboard_only_shows_opted_in_readers(self):
        users.register("ada", "a long passphrase")
        users.register("ben", "a long passphrase")
        record = users.load_users()
        record['ada']['xp'] = 500
        record['ada']['leaderboard_optin'] = True
        record['ben']['xp'] = 900
        users.save_users(record)
        rows = users.leaderboard()
        self.assertEqual([r['username'] for r in rows], ['ada'])
        self.assertEqual(rows[0]['label'], 'Silver I')

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
