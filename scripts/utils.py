import sys
from typing import NoReturn


def panic(*args, **kwargs) -> NoReturn:
  print(*args, file=sys.stderr, **kwargs)
  sys.exit(1)
