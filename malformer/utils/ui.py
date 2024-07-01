from bullet import Check, YesNo
from utils.defaults import ACCOUNT, ROUTE, DEVICE, CAPNP_MAP

def banner():
    print(
  '\n 8b    d8    db    88     888888  dP"Yb  88""Yb 8b    d8 888888 88""Yb\n', 
    '88b  d88   dPYb   88     88__   dP   Yb 88__dP 88b  d88 88__   88__dP\n', 
    '88YbdP88  dP__Yb  88  .o 88""   Yb   dP 88"Yb  88YbdP88 88""   88"Yb\n',  
    '88 YY 88 dP""""Yb 88ood8 88      YbodP  88  Yb 88 YY 88 888888 88  Yb\n\n',
    '------------------ corrupt good openpilot routes --------------------'
)

def prompt(label):
    return input(label)

def get_account():
    print('\nEnter your comma account access token. For more info, visit https://api.comma.ai/#authentication')
    account = prompt("\nType your token (ENTER for demo account) > ")

    return account if account else ACCOUNT

def get_device():
    print('\nEnter your device ID. This is used to uniquely identify your device.')
    device = prompt("\nType device ID (ENTER for demo 3X) > ")

    return device if device else DEVICE

def get_route():
    print("\nEach route is identified by a unique route ID. Enter the ID of the route you wish to corrupt")
    route = prompt("\nType route ID (ENTER for demo route) > ")

    return route if route else ROUTE

def get_params():
    print("\nSelect what all parameters you want corrupted in this route. (use UP & DOWN to scroll, SPACE to select/unselect)")
    cli = Check(
        check="✅",
        choices=[key for key in CAPNP_MAP.keys()]
        )
    
    return [CAPNP_MAP[key] for key in cli.launch()]

def do_continue():
    cli = YesNo(prompt="\nDo you wish to continue (y/n) > ", default='y')
    return cli.launch() == 'y'

def clear():
    os.system('clear')