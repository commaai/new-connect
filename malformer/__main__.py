from utils.downloader import Downloader
from utils.ui import UI
from utils.args import get_cli_args
from verify import Verifier
from corrupter import Corrupter

def main():

    ui = UI()

    account, device, route = get_cli_args()
    account = account if account else ui.get_account()
    device = device if device else ui.get_device()
    route = route if route else ui.get_route(device)

    print(f'\n-------- Downloading raw driving files of {route} -----------')
    downloader = Downloader(account=account, dongleId=device, route=route)
    paths = downloader.download_resources([{ 'name': 'qlogs', 'ext': '.bz2' }, { 'name': 'qcameras', 'ext': '.ts' }])

    print('\n--------------- Segment-wise verification --------------------')
    verifier = Verifier(paths)
    verifier.verify()
    print(verifier)

    if ui.do_continue(): ui.clear_screen()
    else: quit()

    params = ui.get_params()
    corrupter = Corrupter(paths)
    path = corrupter.corrupt(miss=params)
    ui.close(path)

if __name__ == '__main__':
    main()