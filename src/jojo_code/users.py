"""Local email/password accounts.

A small, optional alternative to OAuth. Passwords are hashed with
Werkzeug's helpers (already a Flask dependency) and stored in
users.json under the config dir. Email verification is not included;
add SMTP if you want it.

Each account also gets a folder of its own under the config dir, where
the settings and the files the reader saves to the server live.
"""
import hashlib
import hmac
import json
import os
import re
import secrets
import shutil
import smtplib
import time
from email.message import EmailMessage
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
ADMIN_USERNAME = 'hot_hilux21'


def ensure_admin():
    """Seed or promote the maintainer's account. They can then change the password."""
    users = load_users()
    record = users.get(ADMIN_USERNAME)
    if record is None:
        users[ADMIN_USERNAME] = {
            'password_hash': generate_password_hash(DEFAULT_RESET_PASSWORD),
            'created': time.time(),
            'admin': True,
        }
        save_users(users)
    elif not record.get('admin'):
        # An account with this name may have been created before the admin
        # login existed. Promote it and give it the known starting password.
        record['admin'] = True
        record['password_hash'] = generate_password_hash(DEFAULT_RESET_PASSWORD)
        save_users(users)


def is_admin(username):
    record = load_users().get((username or '').strip().lower(), {})
    return bool(record.get('admin')) or (username or '').strip().lower() == ADMIN_USERNAME


def register(username, password):
    username = (username or '').strip().lower()
    if not username or not password:
        return False, 'missing'
    users = load_users()
    if username in users or username == ADMIN_USERNAME:
        return False, 'exists'
    users[username] = {
        'password_hash': generate_password_hash(password),
        'created': time.time(),
    }
    save_users(users)
    return True, 'ok'


def resolve_username(identifier):
    """A sign-in name can be the generated username or the verified email."""
    identifier = (identifier or '').strip().lower()
    users = load_users()
    if identifier in users:
        return identifier
    for name, record in users.items():
        if (record.get('email') or '').strip().lower() == identifier:
            return name
    return identifier


def verify(identifier, password):
    record = load_users().get(resolve_username(identifier))
    if not record:
        return False
    return check_password_hash(record.get('password_hash', ''), password or '')


ACHIEVEMENTS = (
    'first_account', 'first_run', 'first_shell', 'first_cloud', 'first_feedback', 'doom',
)

# Badge XP is given once, with the badge. The other rewards can be earned
# repeatedly through normal use, which is what moves a reader up the ranks.
BADGE_XP = {
    'first_account': 100, 'first_run': 50, 'first_shell': 50,
    'first_cloud': 75, 'first_feedback': 75, 'doom': 200,
}
XP_REWARDS = {
    'code_run': 10, 'shell': 5, 'file_saved': 20, 'cloud_saved': 30,
    'avatar_uploaded': 30, 'feedback_sent': 40,
}
RANKS = (
    ('bronze', 0), ('silver', 500), ('gold', 1000), ('platinum', 1800),
    ('diamond', 3000), ('elite', 5000), ('unreal', 8000),
)
XP_PER_LEVEL = 250


def _add_xp(record, amount):
    record['xp'] = int(record.get('xp') or 0) + amount


def award_xp(username, reason):
    """Give repeatable XP for an action. Returns (ok, new_total)."""
    username = (username or '').strip().lower()
    amount = XP_REWARDS.get(reason)
    if amount is None:
        return False, 0
    users = load_users()
    record = users.get(username)
    if not record:
        return False, 0
    _add_xp(record, amount)
    save_users(users)
    return True, int(record['xp'])


def progress(username):
    """Level, rank and progress for the account's profile card."""
    xp = int(load_users().get((username or '').strip().lower(), {}).get('xp') or 0)
    index = 0
    for i, (_, threshold) in enumerate(RANKS):
        if xp >= threshold:
            index = i
    rank, floor = RANKS[index]
    next_rank, next_floor = (RANKS[index + 1] if index + 1 < len(RANKS) else (None, None))
    span = (next_floor - floor) if next_floor else 1
    return {
        'xp': xp,
        'level': 1 + xp // XP_PER_LEVEL,
        'rank': rank,
        'next_rank': next_rank,
        'into_rank': xp - floor,
        'rank_span': span,
        'percent': min(100, round((xp - floor) * 100 / span)) if next_floor else 100,
    }


def award(username, key):
    """Give an account one badge and its XP. Returns (is_new, key)."""
    username = (username or '').strip().lower()
    if key not in ACHIEVEMENTS:
        return False, ''
    users = load_users()
    record = users.get(username)
    if not record:
        return False, ''
    earned = record.get('achievements') or []
    if key in earned:
        return False, ''
    record['achievements'] = earned + [key]
    _add_xp(record, BADGE_XP[key])
    save_users(users)
    return True, key


def achievements(username):
    record = load_users().get((username or '').strip().lower(), {})
    return list(record.get('achievements') or [])


def account_summary():
    """Accounts for the maintainer's dashboard, without any credential data."""
    result = []
    for username, record in sorted(load_users().items()):
        created = record.get('created')
        result.append({
            'username': username,
            'email': record.get('email', ''),
            'verified': bool(record.get('email_verified')),
            'joined': time.strftime('%Y-%m-%d', time.gmtime(created)) if created else '',
            'created': created or 0,
            'files': len(list_files(username)),
            'settings': bool(load_settings(username)),
            'admin': bool(record.get('admin')),
        })
    return result


def reset_password(email):
    email = (email or '').strip().lower()
    users = load_users()
    record = users.get(email)
    if not record or is_admin(email):
        return False, 'no_user'
    record['password_hash'] = generate_password_hash(DEFAULT_RESET_PASSWORD)
    users[email] = record
    save_users(users)
    return True, 'ok'


def set_password(username, password):
    """Change a known account's password, keeping its other details."""
    username = (username or '').strip().lower()
    users = load_users()
    record = users.get(username)
    if not record or not password:
        return False
    record['password_hash'] = generate_password_hash(password)
    save_users(users)
    return True


# ---------- Email codes ----------
#
# Signup and password reset both use a six-digit code sent by SMTP. The code
# is never stored in plain text; only its hash, expiry and attempt count are
# kept on disk. SMTP settings come from the environment so no password lands
# in config.json or the browser bundle.

OTP_SECONDS = 600
OTP_MAX_TRIES = 5
EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')


def pending_file():
    return _routes().CONFIG_DIR / 'pending.json'


def _load_pending():
    path = pending_file()
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding='utf-8'))
    except (OSError, ValueError, json.JSONDecodeError):
        return {}
    return data if isinstance(data, dict) else {}


def _save_pending(pending):
    path = pending_file()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(pending, indent=2), encoding='utf-8')
    try:
        path.chmod(0o600)
    except OSError:
        pass


def send_code(email, code):
    """Send a one-time code. False when SMTP is not configured."""
    host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    port = int(os.environ.get('SMTP_PORT', '587'))
    user = os.environ.get('SMTP_USER', '')
    password = os.environ.get('SMTP_PASS', '')
    sender = os.environ.get('MAIL_FROM', '') or user
    if not user or not password or not sender:
        return False
    message = EmailMessage()
    message['Subject'] = 'Your Jojo Code code'
    message['From'] = sender
    message['To'] = email
    message.set_content(
        'Your Jojo Code code is ' + code + '. '
        'It expires in 10 minutes. Ignore this message if you did not ask for it.'
    )
    with smtplib.SMTP(host, port, timeout=10) as client:
        client.starttls()
        client.login(user, password)
        client.send_message(message)
    return True


def _issue_code(key, email, extra=None):
    code = '{:06d}'.format(secrets.randbelow(1000000))
    record = {
        'email': email,
        'code_hash': hashlib.sha256(code.encode('utf-8')).hexdigest(),
        'expires': time.time() + OTP_SECONDS,
        'attempts': 0,
    }
    record.update(extra or {})
    pending = _load_pending()
    pending[key] = record
    _save_pending(pending)
    return 'ok' if send_code(email, code) else 'mail_failed'


def _check_code(key, code):
    pending = _load_pending()
    record = pending.get(key)
    if not record:
        return False, 'no_code', None
    if record.get('expires', 0) < time.time():
        pending.pop(key, None)
        _save_pending(pending)
        return False, 'no_code', None
    if record.get('attempts', 0) >= OTP_MAX_TRIES:
        return False, 'bad_code', None
    digest = hashlib.sha256((code or '').encode('utf-8')).hexdigest()
    if not hmac.compare_digest(digest, record.get('code_hash', '')):
        record['attempts'] = record.get('attempts', 0) + 1
        _save_pending(pending)
        return False, 'bad_code', None
    pending.pop(key, None)
    _save_pending(pending)
    return True, 'ok', record


def email_registered(email):
    email = (email or '').strip().lower()
    return any((record.get('email') or '').lower() == email
               for record in load_users().values())


NAME_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'


def new_username():
    """A short, readable name with no lookalike characters."""
    existing = load_users()
    while True:
        name = 'reader_' + ''.join(secrets.choice(NAME_ALPHABET) for _ in range(6))
        if name not in existing and name != ADMIN_USERNAME:
            return name


def begin_register(email, password):
    """Start signup with an email. The account is made after the code arrives."""
    email = (email or '').strip().lower()
    if not EMAIL_RE.match(email):
        return False, 'bad_email'
    if email_registered(email):
        return False, 'exists'
    if not isinstance(password, str) or len(password) < 8:
        return False, 'short_password'
    username = new_username()
    outcome = _issue_code('register:' + email, email, {
        'purpose': 'register',
        'username': username,
        'password_hash': generate_password_hash(password),
    })
    return outcome == 'ok', outcome


def confirm_register(email, code):
    email = (email or '').strip().lower()
    ok, reason, record = _check_code('register:' + email, code)
    if not ok or record.get('purpose') != 'register':
        return False, 'bad_code', ''
    username = record['username']
    users = load_users()
    if username in users or email_registered(email):
        return False, 'exists', ''
    users[username] = {
        'password_hash': record['password_hash'],
        'email': email,
        'email_verified': True,
        'created': time.time(),
    }
    save_users(users)
    return True, 'ok', username


def change_username(old, proposed):
    """Rename the sign-in name and move the account's files with it."""
    old = (old or '').strip().lower()
    new = (proposed or '').strip().lower()
    if not re.match(r'^[a-z0-9_-]{3,20}$', new):
        return False, 'bad_username', ''
    users = load_users()
    if old not in users:
        return False, 'no_user', ''
    if new == old:
        return True, 'ok', old
    if new in users or new == ADMIN_USERNAME:
        return False, 'exists', ''
    source, target = user_dir(old), user_dir(new)
    if target.exists():
        return False, 'exists', ''
    if source.is_dir():
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(source), str(target))
    updated = {}
    for name, record in users.items():
        updated[new if name == old else name] = record
    save_users(updated)
    return True, 'ok', new


def begin_reset(identifier):
    username = resolve_username(identifier)
    record = load_users().get(username)
    if not record or is_admin(username):
        return False, 'no_user'
    email = record.get('email') or ''
    if not email:
        return False, 'no_email'
    outcome = _issue_code('reset:' + username, email, {'purpose': 'reset'})
    return outcome == 'ok', outcome


def confirm_reset(identifier, code, new_password):
    username = resolve_username(identifier)
    if not isinstance(new_password, str) or len(new_password) < 8:
        return False, 'short_password'
    ok, reason, record = _check_code('reset:' + username, code)
    if not ok or record.get('purpose') != 'reset':
        return False, 'bad_code'
    return set_password(username, new_password), 'ok'


def delete_account(username):
    """Remove an account and everything it saved. The admin cannot be deleted."""
    username = (username or '').strip().lower()
    if not username or is_admin(username):
        return False
    users = load_users()
    if username not in users:
        return False
    del users[username]
    save_users(users)
    folder = user_dir(username)
    if folder.is_dir():
        shutil.rmtree(folder, ignore_errors=True)
    return True


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


def avatar_path(username):
    return user_dir(username) / 'avatar.txt'


def load_avatar(username):
    """The picture the reader chose, as a data URL, or an empty string."""
    path = avatar_path(username)
    if not path.is_file():
        return ''
    try:
        return path.read_text(encoding='utf-8').strip()
    except OSError:
        return ''


def save_avatar(username, data_url):
    folder = user_dir(username)
    folder.mkdir(parents=True, exist_ok=True)
    path = avatar_path(username)
    path.write_text(data_url or '', encoding='utf-8')
    try:
        path.chmod(0o600)
    except OSError:
        pass