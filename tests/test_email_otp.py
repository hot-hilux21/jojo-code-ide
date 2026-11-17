"""Email-code signup, login and reset, all with SMTP stubbed out."""
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

CODE = '123455'


class EmailOtpTests(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory()
        self._saved = (routes.CONFIG_DIR, routes.CONFIG_FILE, routes.ACCESS_CODE)
        routes.CONFIG_DIR = pathlib.Path(self._tmp.name)
        routes.CONFIG_FILE = routes.CONFIG_DIR / 'config.json'
        routes.ACCESS_CODE = ''
        self.addCleanup(self._restore)
        app = create_app()
        app.config['TESTING'] = True
        self.client = app.test_client()
        self.patches = (
            mock.patch.object(users.secrets, 'randbelow', return_value=int(CODE)),
            mock.patch.object(users, 'send_code', return_value=True),
        )
        self.randbelow, self.mail = [p.start() for p in self.patches]
        for patch in self.patches:
            self.addCleanup(patch.stop)

    def _restore(self):
        routes.CONFIG_DIR, routes.CONFIG_FILE, routes.ACCESS_CODE = self._saved
        self._tmp.cleanup()

    def _register(self):
        response = self.client.post('/api/auth/register', json={
            'email': 'Ada@Example.com', 'password': 'a long passphrase',
        })
        self.assertEqual(response.status_code, 200, response.get_data(as_text=True))
        self.assertEqual(self.mail.call_count, 1)
        self.assertEqual(self.mail.call_args[0][0], 'ada@example.com')
        confirm = self.client.post('/api/auth/register/confirm', json={
            'email': 'ada@example.com', 'code': CODE,
        })
        self.assertEqual(confirm.status_code, 200, confirm.get_data(as_text=True))
        return confirm.get_json()['username']

    def test_signup_assigns_a_username_and_verifies_the_email(self):
        username = self._register()
        self.assertTrue(username.startswith('reader_'))
        record = users.load_users()[username]
        self.assertEqual(record['email'], 'ada@example.com')
        self.assertTrue(record['email_verified'])
        self.assertTrue(users.verify('ada@example.com', 'a long passphrase'))

    def test_login_accepts_both_the_username_and_the_email(self):
        username = self._register()
        for identifier in (username, 'ada@example.com'):
            response = self.client.post('/api/auth/login', json={
                'username': identifier, 'password': 'a long passphrase',
            })
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.get_json()['username'], username)

    def test_reader_can_rename_themselves_and_keep_the_email_login(self):
        username = self._register()
        response = self.client.post('/api/auth/username', json={'username': 'new_name'})
        self.assertEqual(response.status_code, 200, response.get_data(as_text=True))
        self.assertNotIn(username, users.load_users())
        self.assertIn('new_name', users.load_users())
        self.assertTrue(users.verify('ada@example.com', 'a long passphrase'))

    def test_otp_reset_replaces_the_password(self):
        username = self._register()
        self.mail.reset_mock()
        request = self.client.post('/api/auth/reset/request',
                                   json={'username': 'ada@example.com'})
        self.assertEqual(request.status_code, 200)
        confirm = self.client.post('/api/auth/reset/confirm', json={
            'username': 'ada@example.com', 'code': CODE,
            'new_password': 'a newer passphrase',
        })
        self.assertEqual(confirm.status_code, 200)
        self.assertTrue(users.verify(username, 'a newer passphrase'))
        self.assertFalse(users.verify(username, 'a long passphrase'))

    def test_an_old_account_can_add_and_verify_an_email(self):
        # Older accounts predate email and hold only a password hash.
        saved = users.load_users()
        saved['old_reader'] = {'created': 1}
        users.save_users(saved)
        with self.client.session_transaction() as session:
            session['user_username'] = 'old_reader'
        request = self.client.post('/api/auth/email/request',
                                   json={'email': 'old@example.com'})
        self.assertEqual(request.status_code, 200, request.get_data(as_text=True))
        confirm = self.client.post('/api/auth/email/confirm', json={
            'email': 'old@example.com', 'code': CODE,
        })
        self.assertEqual(confirm.status_code, 200, confirm.get_data(as_text=True))
        record = users.load_users()['old_reader']
        self.assertEqual(record['email'], 'old@example.com')
        self.assertTrue(record['email_verified'])
        self.assertEqual(users.resolve_username('old@example.com'), 'old_reader')

    def test_a_wrong_code_never_creates_the_account(self):
        self.client.post('/api/auth/register', json={
            'email': 'ada@example.com', 'password': 'a long passphrase',
        })
        response = self.client.post('/api/auth/register/confirm', json={
            'email': 'ada@example.com', 'code': '000000',
        })
        self.assertEqual(response.status_code, 400)
        self.assertEqual(users.load_users(), {})


if __name__ == '__main__':
    unittest.main()
