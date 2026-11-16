"""
Jojo Code - A fully accessible IDE for dyslexic and neurodivergent learners.
"""
import os
import secrets

from flask import Flask, jsonify, request

__version__ = "2.0.0-beta"
__author__ = "Jojo Code Contributors"


def create_app():
    """Application factory."""
    app = Flask(__name__,
                template_folder='templates',
                static_folder='static')

    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or secrets.token_hex(32)
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload
    # The theme list is ordered on purpose (four common presets first, the
    # reader's own colours last) and both the setup step and the Settings
    # dropdown read that order. Sorting the keys would throw it away.
    app.json.sort_keys = False

    # Host header validation.
    # On the public web the host is whatever the platform gave us, so this
    # only applies to the local desktop app. It blocks DNS-rebinding
    # attacks that try to reach the local server from a malicious website.
    from .routes import main_bp, on_public_web
    from .icons import icon

    app.add_template_global(icon, 'icon')

    @app.before_request
    def validate_host():
        if on_public_web():
            return None
        host = request.host.split(':')[0].lower()
        if host not in ('localhost', '127.0.0.1', '::1'):
            return jsonify({'error': 'Invalid host.'}), 403
        return None

    # The page and its scripts must never be served from a cache: a stale
    # app.js is the one failure that looks like a broken app rather than an
    # old one, because the wiring never runs and the buttons do nothing.
    @app.after_request
    def no_cache(response):
        path = request.path or ''
        if path.endswith(('.html', '.js', '.css')) or path in ('', '/'):
            response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '0'
        return response

    app.register_blueprint(main_bp)

    return app