"""Local email/password accounts.

A small, optional alternative to OAuth. Passwords are hashed with
Werkzeug's helpers (already a Flask dependency) and stored in
users.json under the config dir. Email verification is not included;
add SMTP if you want it.
"""
import json
from pathlib import Path

from werkzeug.security import generate_password_hash, check_password_hash


def _routes():
    from . import routes
    return routes


def users_file():
    return _routes().CONFIG_DIR / 'users.json'


def load_users():
    path = users_file()
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding='utf-8'))
    except (OSError, ValueError, json.JSONDecodeError):
        return {}
    return data if isinstance(data, dict) else {}


def save_users(users):
    path = users_file()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(users, indent=2), encoding='utf-8')
    try:
        path.chmod(0o600)
    except OSError:
        pass


DEFAULT_RESET_PASSWORD = 'jojocode27'


def register(username, password):
    username = (username or '').strip().lower()
    if not username or not password:
        return False, 'missing'
    users = load_users()
    if username in users:
        return False, 'exists'
    users[username] = {'password_hash': generate_password_hash(password)}
    save_users(users)
    return True, 'ok'


def verify(username, password):
    username = (username or '').strip().lower()
    users = load_users()
    record = users.get(username)
    if not record:
        return False
    return check_password_hash(record.get('password_hash', ''), password or '')


def reset_password(email):
    email = (email or '').strip().lower()
    users = load_users()
    record = users.get(email)
    if not record:
        return False, 'no_user'
    record['password_hash'] = generate_password_hash(DEFAULT_RESET_PASSWORD)
    users[email] = record
    save_users(users)
    return True, 'ok'


def save_code(username, code):
    username = (username or '').strip().lower()
    users = load_users()
    record = users.get(username, {})
    record['code'] = code or ''
    users[username] = record
    save_users(users)


def load_code(username):
    username = (username or '').strip().lower()
    users = load_users()
    record = users.get(username, {})
    return record.get('code', '')


def is_admin_email(email):
    import os
    allowed = os.environ.get('ADMIN_EMAIL', '').strip().lower()
    return bool(allowed) and (email or '').strip().lower() == allowed