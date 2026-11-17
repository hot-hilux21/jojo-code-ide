"""The maintainer's dashboard lists accounts without leaking credentials."""
import pathlib
import sys
import tempfile
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = str(REPO_ROOT / "src")
if SRC not in sys.path:
    sys.path.append(SRC)

from werkzeug.security import generate_password_hash  # noqa: E402

from jojo_code import create_app, routes, users  # noqa: E402


class AdminDashboardTests(unittest.TestCase):
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

    def test_accounts_show_with_dates_but_no_password_hashes(self):
        users.register("ada@example.com", "a long passphrase")
        self._login_as_admin()
        html = self.client.get("/admin").get_data(as_text=True)
        self.assertIn("ada@example.com", html)
        self.assertIn("Registered accounts", html)
        self.assertIn("registered readers", html)
        self.assertNotIn("password_hash", html)
        self.assertNotIn("scrypt:", html)
        self.assertNotIn("pbkdf2:", html)

    def _login_as_admin(self):
        users.ensure_admin()
        return self.client.post('/admin', data={
            'username': 'hot_hilux21', 'password': 'jojocode27',
        })

    def test_only_admin_credentials_open_the_dashboard(self):
        self.assertEqual(self._login_as_admin().status_code, 302)
        self.assertIn("Admin dashboard", self.client.get('/admin').get_data(as_text=True))
        other = create_app().test_client()
        response = other.post('/admin', data={
            'username': 'ada@example.com', 'password': 'pw',
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn("Wrong username or password", response.get_data(as_text=True))

    def test_existing_admin_named_account_is_promoted_once(self):
        saved = users.load_users()
        saved['hot_hilux21'] = {
            'password_hash': generate_password_hash('an older password'),
        }
        users.save_users(saved)
        users.ensure_admin()
        self.assertTrue(users.verify('hot_hilux21', 'jojocode27'))
        users.set_password('hot_hilux21', 'a new passphrase')
        users.ensure_admin()
        self.assertTrue(users.verify('hot_hilux21', 'a new passphrase'))

    def test_public_reset_cannot_take_over_the_admin_account(self):
        users.ensure_admin()
        ok, reason = users.reset_password('hot_hilux21')
        self.assertFalse(ok)
        self.assertTrue(users.verify('hot_hilux21', 'jojocode27'))

    def test_admin_can_reset_a_readers_password(self):
        users.register('ada@example.com', 'old-password')
        self._login_as_admin()
        self.client.post('/admin/accounts/reset-password',
                         data={'username': 'ada@example.com'})
        self.assertTrue(users.verify('ada@example.com', 'jojocode27'))
        self.assertFalse(users.verify('ada@example.com', 'old-password'))

    def test_admin_can_delete_an_account_but_not_itself(self):
        users.register('ada@example.com', 'old-password')
        self._login_as_admin()
        self.client.post('/admin/accounts/delete',
                         data={'username': 'ada@example.com'})
        self.assertNotIn('ada@example.com', users.load_users())
        self.client.post('/admin/accounts/delete',
                         data={'username': 'hot_hilux21'})
        self.assertIn('hot_hilux21', users.load_users())

    def test_admin_can_change_their_own_password(self):
        self._login_as_admin()
        response = self.client.post('/admin/password', data={
            'current': 'jojocode27', 'new': 'a longer passphrase',
        })
        self.assertEqual(response.status_code, 302)
        self.assertTrue(users.verify('hot_hilux21', 'a longer passphrase'))
        self.assertFalse(users.verify('hot_hilux21', 'jojocode27'))

    def test_reader_can_replace_a_reset_password(self):
        users.register('ada@example.com', 'old-password')
        with self.client.session_transaction() as session:
            session['user_username'] = 'ada@example.com'
        response = self.client.post('/api/auth/change-password', json={
            'current': 'old-password', 'new': 'a longer passphrase',
        })
        self.assertEqual(response.status_code, 200)
        self.assertTrue(users.verify('ada@example.com', 'a longer passphrase'))

    def test_counts_include_new_signups_and_feedback(self):
        users.register("ada@example.com", "a long passphrase")
        self.client.post("/api/feedback", json={
            "positive": "Easy to read", "rating": 5,
        })
        self._login_as_admin()
        html = self.client.get("/admin").get_data(as_text=True)
        self.assertIn("<strong>1</strong> registered readers", html)
        self.assertIn("<strong>1</strong> signed up in the last 7 days", html)
        self.assertIn("<strong>1</strong> feedback messages", html)


if __name__ == "__main__":
    unittest.main()
