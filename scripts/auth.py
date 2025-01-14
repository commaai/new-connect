from openpilot.tools.lib.auth_config import clear_token, get_token, set_token
from openpilot.tools.lib.route import Route

from utils import panic


DEMO_DONGLE_ID = "1d3dc3e03047b0c7"
DEMO_LOG_ID = "000000dd--455f14369d"
DEMO_ROUTE_ID = f"{DEMO_DONGLE_ID}|{DEMO_LOG_ID}"
DEMO_ACCOUNT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDg1ODI0NjUsIm5iZiI6MTcxNzA0NjQ2NSwiaWF0IjoxNzE3MDQ2NDY1LCJpZGVudGl0eSI6IjBkZWNkZGNmZGYyNDFhNjAifQ.g3khyJgOkNvZny6Vh579cuQj1HLLGSDeauZbfZri9jw"


class Auth:
  is_demo: bool

  def __init__(self, route: Route):
    self.is_demo = route.name.dongle_id == DEMO_DONGLE_ID

  def __enter__(self):
    if not get_token():
      if not self.is_demo:
        panic("Use the openpilot/tools/lib/auth.py script to set your JWT")
      print("Using demo account")
      set_token(DEMO_ACCOUNT)

  def __exit__(self, exc_type, exc_val, exc_tb):
    if self.is_demo and get_token() == DEMO_ACCOUNT:
      clear_token()
