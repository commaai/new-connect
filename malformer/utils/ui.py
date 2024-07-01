from bullet import Check, YesNo, Bullet
from utils.defaults import ACCOUNT, ROUTE, DEVICE, CAPNP_MAP
from utils.api import API
import os

class UI:
    def __init__(self):
        self.api = None

    def _set_api(self, token):
        self.api = API(token)

    def banner(self):
        print(
    '\n 8b    d8    db    88     888888  dP"Yb  88""Yb 8b    d8 888888 88""Yb\n', 
        '88b  d88   dPYb   88     88__   dP   Yb 88__dP 88b  d88 88__   88__dP\n', 
        '88YbdP88  dP__Yb  88  .o 88""   Yb   dP 88"Yb  88YbdP88 88""   88"Yb\n',  
        '88 YY 88 dP""""Yb 88ood8 88      YbodP  88  Yb 88 YY 88 888888 88  Yb\n\n',
        '------------------ corrupt good openpilot routes --------------------'
    )

    def _prompt(self, label):
        return input(label)

    def get_account(self):
        self._clear()
        print('\nEnter your comma account access token. For more info, visit https://api.comma.ai/#authentication')
        account = self._prompt("\nType your token (ENTER for demo account) > ")

        account = account if account else ACCOUNT
        self._set_api(account)
        return account

    def get_device(self):
        self._clear()
        print("\nDo you wish to choose from a list of available devices or enter an ID manually?\n")
        cli = YesNo(prompt="Yes, I'll choose (y/n) > ", default='y')
        if cli.launch() and self.api is not None:
            print("\nPlease wait...")
            devices = self.api.devices()
            self._clear()
            print("\nChoose a device from the list below. (UP & DOWN to scroll, ENTER to select)\n")
            cli = Bullet(choices=[device for device in devices])
            device = devices[cli.launch()]
        else:
            self._clear()
            print('\nEnter your device ID. This is used to uniquely identify your device.')
            device = self._prompt("\nType device ID (ENTER for demo 3X) > ")

        return device if device else DEVICE

    def get_route(self, device=None):
        self._clear()
        print("\nDo you wish to choose from a list of available drives or enter an ID manually?\n")
        cli = YesNo(prompt="Yes, I'll choose (y/n) > ", default='y')
        if cli.launch() and device is not None:
            print("\nPlease wait..")
            routes = self.api.routes(device)
            self._clear()
            print("\nChoose a drive from the list below. (UP & DOWN to scroll, ENTER to select)\n")
            cli = Bullet(choices=[route for route in routes])
            route = routes[cli.launch()]
        else:
            print("\nEach drive is identified by a unique route ID. Enter the ID of the route you wish to corrupt")
            route = self._prompt("\nType route ID (ENTER for a demo route) > ")

        return route if route else ROUTE

    def get_params(self):
        self._clear()
        print("\nSelect what all parameters you want corrupted in this route. (use UP & DOWN to scroll, SPACE to select/unselect)\n")
        cli = Check(
            check="✅",
            choices=[key for key in CAPNP_MAP.keys()]
            )
        
        return [CAPNP_MAP[key] for key in cli.launch()]

    def do_continue(self):
        print()
        cli = YesNo(prompt="Do you wish to continue (y/n) > ", default='y')
        return cli.launch()
    
    def close(self, path):
        self._clear()
        print(f"\nYour newly corrupted route files are at {path}")
        print(f"Thanks for using malformer. Run again to corrupt more routes. Happy testing!\n")

    def _clear(self):
        os.system('cls' if os.name == 'nt' else 'clear')
        self.banner()
    
    def clear_screen(self):
        self._clear()