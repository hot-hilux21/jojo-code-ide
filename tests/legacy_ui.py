"""Force the classic Jinja page for template-contract tests.

The React shell is the default now, but these tests assert against the
server-rendered markup. They opt out of the React default for the duration of
their module; production is unaffected.
"""


def use_legacy_ui(namespace):
    state = {"old": None}

    def setUpModule():
        from jojo_code import routes
        state["old"] = routes.REACT_ENABLED
        routes.REACT_ENABLED = False

    def tearDownModule():
        from jojo_code import routes
        routes.REACT_ENABLED = state["old"]

    namespace["setUpModule"] = setUpModule
    namespace["tearDownModule"] = tearDownModule
