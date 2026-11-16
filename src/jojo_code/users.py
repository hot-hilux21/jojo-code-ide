"""Local email/password accounts.

A small, optional alternative to OAuth. Passwords are hashed with
Werkzeug's helpers (already a Flask dependency) and stored in
users.json under the config dir. Email verification is not included;
add SMTP if you want it.

Each account also gets a folder of its own under the config dir, where
the settings and the files the reader saves to the server live.
"""
import json
import re
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


# ---------- What an account keeps on the server ----------
#
# Two things: the settings the reader chose, and the files they saved.
# Both live in a folder per account under the config dir, so one reader
# never sees another's.

def user_dir(username):
    """The folder one account's saved things live in.

    The name is sanitised because it becomes a path: an account called
    "../../etc" must not be able to write outside the config dir.
    """
    safe = re.sub(r'[^a-z0-9_-]', '', (username or '').strip().lower())[:64]
    return _routes().CONFIG_DIR / 'accounts' / (safe or 'anonymous')


def safe_file_name(name):
    """A file name that cannot escape the account's own folder."""
    name = (name or '').strip().replace('\\', '/')
    name = name.split('/')[-1]
    name = re.sub(r'[^A-Za-z0-9._ -]', '_', name).strip('. ')
    if not name:
        return ''
    if not name.lower().endswith('.py'):
        name += '.py'
    return name[:120]


def settings_path(username):
    return user_dir(username) / 'settings.json'


def load_settings(username):
    path = settings_path(username)
    if not path.is_file():
        return {}
    try:
        data = json.loads(path.read_text(encoding='utf-8'))
    except (OSError, ValueError, json.JSONDecodeError):
        return {}
    return data if isinstance(data, dict) else {}


def save_settings(username, config):
    folder = user_dir(username)
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / 'settings.json'
    path.write_text(json.dumps(config or {}, indent=2), encoding='utf-8')
    try:
        path.chmod(0o600)
    except OSError:
        pass


def files_dir(username):
    return user_dir(username) / 'files'


def list_files(username):
    """Every file this account has saved, newest first."""
    folder = files_dir(username)
    if not folder.is_dir():
        return []
    items = []
    for path in sorted(folder.iterdir()):
        if not path.is_file() or path.suffix.lower() != '.py':
            continue
        try:
            stat = path.stat()
        except OSError:
            continue
        items.append({
            'name': path.name,
            'size': stat.st_size,
            'modified': stat.st_mtime,
        })
    items.sort(key=lambda item: item['modified'], reverse=True)
    return items


def save_file(username, name, code):
    """Save a file for an account and return the name it was stored under."""
    stored = safe_file_name(name)
    if not stored:
        return ''
    folder = files_dir(username)
    folder.mkdir(parents=True, exist_ok=True)
    (folder / stored).write_text(code or '', encoding='utf-8')
    return stored


def read_file(username, name):
    stored = safe_file_name(name)
    if not stored:
        return None
    path = files_dir(username) / stored
    if not path.is_file():
        return None
    try:
        return path.read_text(encoding='utf-8')
    except OSError:
        return None


def delete_file(username, name):
    stored = safe_file_name(name)
    if not stored:
        return False
    path = files_dir(username) / stored
    if not path.is_file():
        return False
    try:
        path.unlink()
    except OSError:
        return False
    return True