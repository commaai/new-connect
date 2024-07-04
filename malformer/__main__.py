from utils.defaults import CAPNP_MAP
from malformer import Corrupter, Downloader
from bullet import Check
import argparse

def get_cli_args():
    parser = argparse.ArgumentParser(description="A script to corrupt openpilot routes for comma connect")
    parser.add_argument('-a', '--account', type=str, help="JWT access token for comma account")
    parser.add_argument('-d', '--device', type=str, help="dongleId of the device from which route was uploaded")
    parser.add_argument('-r', '--route', type=str, help="Unique ID of the route to be corrupted")

    args = parser.parse_args()
    return args.account, args.device, args.route

def get_params():
    print("\nSelect what all parameters you want corrupted in this route. (use UP & DOWN to scroll, SPACE to select/unselect)\n")
    return [CAPNP_MAP[key] for key in Check(check="✅", choices=[key for key in CAPNP_MAP.keys()]).launch()]

def main():
    account, device, route = get_cli_args()
    downloader = Downloader(account=account, dongleId=device, route=route) if account and device and route else Downloader()
    paths = downloader.download_resources([{ 'name': 'qlogs', 'ext': '.bz2' }, { 'name': 'qcameras', 'ext': '.ts' }])
    corrupter = Corrupter(paths)
    print(f"\nThe corrupted copy of route is at {corrupter.corrupt(miss=get_params())}")

if __name__ == '__main__':
    main()