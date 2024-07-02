import argparse

def get_cli_args():
    parser = argparse.ArgumentParser(description="A script to corrupt openpilot routes for comma connect")
    parser.add_argument('-a', '--account', type=str, help="JWT access token for comma account")
    parser.add_argument('-d', '--device', type=str, help="dongleId of the device from which route was uploaded")
    parser.add_argument('-r', '--route', type=str, help="Unique ID of the route to be corrupted")

    args = parser.parse_args()
    return args.account, args.device, args.route