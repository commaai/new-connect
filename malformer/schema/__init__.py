import os
import capnp

BASE_PATH = os.path.dirname(os.path.abspath(__file__))
capnp.remove_import_hook()
log = capnp.load(os.path.join(BASE_PATH, "log.capnp"))
