from utils.downloader import Downloader
from utils.args import get_cli_args
from utils.defaults import CAPNP_MAP
from verify import Verifier
from corrupter import Corrupter
from bullet import Check

def get_params():
    print("\nSelect what all parameters you want corrupted in this route. (use UP & DOWN to scroll, SPACE to select/unselect)\n")
    cli = Check(check="✅", choices=[key for key in CAPNP_MAP.keys()])
    return [CAPNP_MAP[key] for key in cli.launch()]

def main():
    account, device, route = get_cli_args()

    downloader = Downloader(account=account, dongleId=device, route=route) if account and device and route else Downloader()
    paths = downloader.download_resources([{ 'name': 'qlogs', 'ext': '.bz2' }, { 'name': 'qcameras', 'ext': '.ts' }])

    print('\n--------------- Segment-wise verification --------------------')
    verifier = Verifier(paths)
    verifier.verify()
    print(verifier)

    params = get_params()
    corrupter = Corrupter(paths)
    path = corrupter.corrupt(miss=params)
    print(f"\nThe corrupted copy of {route} is at {path}")

if __name__ == '__main__':
    main()