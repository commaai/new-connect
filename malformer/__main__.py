from utils.downloader import Downloader
from utils.ui import banner, get_account, get_device, get_route, get_params, do_continue
from verify import Verifier
from corrupter import Corrupter

def main():
    
    banner()
    account = get_account()
    device = get_device()
    route = get_route()
    if not account or not device or not route: quit()

    print(f'\n-------- Downloading raw driving files of {route} -----------')
    downloader = Downloader(account=account, dongleId=device, route=route)
    paths = downloader.download_resources([{ 'name': 'qlogs', 'ext': '.bz2' }, { 'name': 'qcameras', 'ext': '.ts' }])

    print('\n--------------- Segment-wise verification --------------------')
    verifier = Verifier(paths)
    verifier.verify()
    print(verifier)

    if not do_continue(): quit()

    params = get_params()
    corrupter = Corrupter(paths)
    corrupter.corrupt(miss=params)

if __name__ == '__main__':
    main()