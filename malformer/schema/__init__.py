import os, capnp, requests

BASE_PATH = os.path.dirname(os.path.abspath(__file__))
schemas = ['log.capnp', 'custom.capnp', 'legacy.capnp', 'car.capnp', 'include/c++.capnp']

def get_capnp_schema():
    if not all(os.path.isfile(os.path.join(BASE_PATH, schema)) for schema in schemas):
        print("\nPlease wait, downloading capnp schema files...\nThis is a one time thing and won't take long.\n")
        os.makedirs(os.path.dirname(f'{BASE_PATH}/include/'), exist_ok=True)
        for schema in schemas:
            response = requests.get(f"https://raw.githubusercontent.com/commaai/openpilot/master/cereal/{schema}".replace("+", "%2B"))
            response.raise_for_status()
            with open(os.path.join(BASE_PATH, schema), 'w') as capnp_file:
                capnp_file.write(response.text)
    return capnp.load(os.path.join(BASE_PATH, "log.capnp"))

capnp.remove_import_hook()
log = get_capnp_schema()
