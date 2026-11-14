"""Experimental cloud sync for settings.

Only Google Drive appDataFolder is supported for now. This is opt-in and
keeps the offline file as the source of truth: push uploads it, pull
overwrites local settings with the cloud copy.
"""
import json
import time
import urllib.error
import urllib.request

FILE_NAME = 'jojo-code-settings.json'


def _account():
    from . import oauth
    return oauth.load_account()


def _token():
    from . import oauth
    account = oauth.load_account()
    if not account or account.get('provider') != 'google':
        return None
    # Refresh if needed
    if account.get('expires_at', 0) > time.time() + 60:
        return account.get('access_token')
    refresh = account.get('refresh_token')
    if not refresh:
        return account.get('access_token')
    client_id, client_secret = oauth.client_credentials('google')
    data, err = oauth._post_form(
        'https://oauth2.googleapis.com/token',
        {
            'client_id': client_id,
            'client_secret': client_secret,
            'refresh_token': refresh,
            'grant_type': 'refresh_token',
        },
    )
    if err or not data or 'access_token' not in data:
        return account.get('access_token')
    account['access_token'] = data['access_token']
    account['expires_at'] = time.time() + int(data.get('expires_in', 3600))
    oauth.save_account(account)
    return account['access_token']


def _find_file(token):
    url = ('https://www.googleapis.com/drive/v3/files'
           '?spaces=appDataFolder&fields=files(id,name)')
    req = urllib.request.Request(url)
    req.add_header('Authorization', 'Bearer ' + token)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode('utf-8'))
    except Exception:
        return None
    for f in data.get('files', []):
        if f.get('name') == FILE_NAME:
            return f.get('id')
    return None


def status():
    account = _account()
    if not account or account.get('provider') != 'google':
        return {'available': False, 'connected': False, 'file': False}
    token = _token()
    if not token:
        return {'available': True, 'connected': False, 'file': False}
    return {'available': True, 'connected': True, 'file': bool(_find_file(token))}


def push(config):
    token = _token()
    if not token:
        return False, 'not_connected'
    file_id = _find_file(token)
    payload = json.dumps(config).encode('utf-8')
    if file_id:
        url = ('https://www.googleapis.com/upload/drive/v3/files/'
               + file_id + '?uploadType=media')
        req = urllib.request.Request(url, data=payload, method='PATCH')
    else:
        boundary = 'jojo_boundary_123'
        meta = json.dumps({'name': FILE_NAME, 'parents': ['appDataFolder']})
        body = (
            '--' + boundary + '\r\n'
            'Content-Type: application/json; charset=UTF-8\r\n\r\n'
            + meta + '\r\n'
            '--' + boundary + '\r\n'
            'Content-Type: application/json\r\n\r\n'
        ).encode('utf-8') + payload + ('\r\n--' + boundary + '--').encode('utf-8')
        url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart'
        req = urllib.request.Request(url, data=body, method='POST')
        req.add_header('Content-Type', 'multipart/related; boundary=' + boundary)
    req.add_header('Authorization', 'Bearer ' + token)
    if 'Content-Type' not in [h[0] for h in req.header_items()]:
        req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            resp.read()
        return True, 'ok'
    except urllib.error.HTTPError as exc:
        return False, 'http_' + str(exc.code)
    except Exception as exc:
        return False, str(exc)


def pull():
    token = _token()
    if not token:
        return None, 'not_connected'
    file_id = _find_file(token)
    if not file_id:
        return None, 'no_file'
    url = 'https://www.googleapis.com/drive/v3/files/' + file_id + '?alt=media'
    req = urllib.request.Request(url)
    req.add_header('Authorization', 'Bearer ' + token)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        return data, None
    except urllib.error.HTTPError as exc:
        return None, 'http_' + str(exc.code)
    except Exception as exc:
        return None, str(exc)