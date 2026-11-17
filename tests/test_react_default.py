"""The React shell is the default; classic remains selectable."""
import pathlib
import sys
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = str(REPO_ROOT / "src")
if SRC not in sys.path:
    sys.path.append(SRC)

from jojo_code import create_app, routes  # noqa: E402


class ReactDefaultTests(unittest.TestCase):
    def test_default_and_gate_are_on(self):
        self.assertEqual(routes.DEFAULT_CONFIG["ui_backend"], "react")
        self.assertTrue(routes.REACT_ENABLED)

    def test_root_serves_the_react_shell(self):
        app = create_app()
        app.config["TESTING"] = True
        client = app.test_client()
        page = client.get("/").get_data(as_text=True)
        self.assertIn('id="root"', page)
        self.assertIn('/assets/index-', page)
        self.assertNotIn('id="settings-dialog"', page)


if __name__ == "__main__":
    unittest.main()
