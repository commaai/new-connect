from utils.downloader import Downloader
from verify import Verifier
from corrupter import Corrupter

def main():
    downloader = Downloader()
    paths = downloader.download_resources([{ 'name': 'qlogs', 'ext': '.bz2' }, { 'name': 'qcameras', 'ext': '.ts' }])

    verifier = Verifier(paths)
    verifier.verify()
    print(verifier)

    corrupter = Corrupter(paths)
    corrupter.corrupt(miss=['gpsLocation'])

if __name__ == '__main__':
    main()