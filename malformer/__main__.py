from bullet import Check
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections.abc import Iterator
import argparse, random, requests, string, shutil, os, capnp, urllib, bz2, zstd, warnings, capnp

ACCOUNT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDg1ODI0NjUsIm5iZiI6MTcxNzA0NjQ2NSwiaWF0IjoxNzE3MDQ2NDY1LCJpZGVudGl0eSI6IjBkZWNkZGNmZGYyNDFhNjAifQ.g3khyJgOkNvZny6Vh579cuQj1HLLGSDeauZbfZri9jw'
DEVICE = '1d3dc3e03047b0c7'
ROUTE = '000000dd--455f14369d'
FPS = 20 # video frame rate, for performing calculations on qlogs
STORAGE_PATH = './malformer/routes'
CAPNP_MAP = { 'GPS': 'gpsLocation', 'Thumbnail': 'thumbnail', 'qlogs': 'qEncodeIdx' }
SCHEMA_BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)),'schema')
schemas = ['log.capnp', 'custom.capnp', 'legacy.capnp', 'car.capnp', 'include/c++.capnp']

def get_capnp_schema():
    if not all(os.path.isfile(os.path.join(SCHEMA_BASE, schema)) for schema in schemas):
        print("\nPlease wait, downloading capnp schema files...\nThis is a one time thing and won't take long.\n")
        os.makedirs(os.path.dirname(f'{SCHEMA_BASE}/include/'), exist_ok=True)
        for schema in schemas:
            response = requests.get(f"https://raw.githubusercontent.com/commaai/openpilot/master/cereal/{schema}".replace("+", "%2B"))
            response.raise_for_status()
            with open(os.path.join(SCHEMA_BASE, schema), 'w') as capnp_file:
                capnp_file.write(response.text)
    return capnp.load(os.path.join(SCHEMA_BASE, "log.capnp"))

capnp.remove_import_hook()
log = get_capnp_schema()

class LogFileReader:
    def __init__(self, fn, only_union_types=False, dat=None):
        self._only_union_types = only_union_types

        if not dat:
            _, ext = os.path.splitext(urllib.parse.urlparse(fn).path)
            if ext not in ('', '.bz2', '.zst'):
                raise Exception(f"unknown extension {ext}")
                
            with open(fn, 'rb') as f:
                dat = f.read()
        else:
            ext = None

        if ext == ".bz2" or dat.startswith(b'BZh9'):
            dat = bz2.decompress(dat)
        elif ext == ".zst" or dat.startswith(b'\x28\xB5\x2F\xFD'):
            dat = zstd.decompress(dat)

        try:
            self._ents = list(log.Event.read_multiple_bytes(dat))
        except capnp.KjException:
            warnings.warn("Corrupted events detected", RuntimeWarning, stacklevel=1)

    def __iter__(self) -> Iterator[capnp._DynamicStructReader]:
        for ent in self._ents:
            if not self._only_union_types or self._is_valid_union_type(ent):
                yield ent

    def _is_valid_union_type(self, ent):
        try:
            ent.which()
            return True
        except capnp.lib.capnp.KjException:
            return False

def verify(qlogs, qcams):
    print('\n--------------- Segment-wise verification --------------------')
    for index, qlog in enumerate(qlogs):
        print(f"\nVerifying segment {index}")
        reader = LogFileReader(qlog)
        messages = list(reader)  # Read messages once and reuse

        checks = {
            "start segment": lambda: index > 0 or any(msg.which() == 'qRoadEncodeIdx' and msg.qRoadEncodeIdx.segmentNum == 0 for msg in messages),
            "all 60 qlogs": lambda: sum(1 for msg in messages if msg.which() == 'qRoadEncodeIdx') / 60 == FPS,
            "all 60 GPS coordinates": lambda: sum(1 for msg in messages if msg.which() == 'gpsLocation') == 60,
            "qcamera.ts file": lambda: os.path.exists(qcams[index]),
        }

        if all(check() for check in checks.values()):
            print("Segment OK\n")
        else:
            for check, result in checks.items():
                if not result():
                    print(f"• {check} not found")

class Downloader:
    def __init__(self, account=ACCOUNT, dongleId=DEVICE, route=ROUTE):
        self.files = self._request(f'https://api.commadotai.com/v1/route/{dongleId}|{route}/files', { 'Authorization': f'JWT {account}' })
        self.route = route
    
    def _request(self, url, headers):
        response = requests.get(url, headers=headers)
        if response.status_code == 200: return response.json()
        raise Exception(f'{url} returned a response {response.text} with status code {response.status_code}')
    
    def _download_resource(self, url, index, name):
        response = requests.get(url)
        response.raise_for_status()
        directory = f'{STORAGE_PATH}/{self.route}/{self.route}--{index}/'
        os.makedirs(os.path.dirname(directory), exist_ok=True)
        fn = os.path.join(directory, name)
        with open(fn, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        return fn
    
    def download_resources(self, resources: 'what all you want to download (eg, qlogs, qcams)'):
        if self.files is None: return None
        print(f'\n-------- Downloading raw driving files of {self.route} -----------')
        downloads = {resource['name']: [] for resource in resources}

        def _download(url, index, name, ext):
            try:
                path = self._download_resource(url, index, f"{name}{ext}")
                return name, path
            except Exception as e:
                print(f'Error downloading {url}: {e}')
                return name, None
        
        with ThreadPoolExecutor() as executor:
            futures = []
            for resource in resources:
                print(f'Downloading {resource["name"]}...')
                urls = self.files[resource['name']]
                for index, url in enumerate(urls):
                    futures.append(executor.submit(_download, url, index, resource["name"], resource["ext"]))
            
            for future in as_completed(futures):
                name, path = future.result()
                if path: downloads[name].append(path)
        
        for key in downloads: downloads[key].sort()
        verify(downloads['qlogs'], downloads['qcameras'])
        return downloads

class Corrupter:
    def __init__(self, paths, route=ROUTE):
        self.route = self._generate_name(route)
        self._segments, self._qcams = paths['qlogs'], paths['qcameras']
    
    def _generate_name(self, name, n=4):
        parts = name.split('--')
        if len(parts) < 2: return name
        word = parts[1]
        return f"{parts[0]}--{''.join(random.choice(string.ascii_lowercase) if i in random.sample(range(len(word)), n) else char for i, char in enumerate(word))}"

    def _corrupt_log(self, source, index, miss=[]):
        readers = LogFileReader(source)
        directory = os.path.join(STORAGE_PATH, self.route, f'{self.route}--{index}')
        os.makedirs(directory, exist_ok=True)
        fn = os.path.join(directory, 'qlog.bz2')

        data = b''.join(builder.to_bytes() for reader in readers if reader.which() not in miss for builder in [reader.as_builder()])
        with open(fn, 'wb') as qlog:
            qlog.write(data)

    def _copy_qcam(self, source, index):
        destination = f'{STORAGE_PATH}/{self.route}/{self.route}--{index}/'
        os.makedirs(destination, exist_ok=True)
        shutil.copy(source, destination)

    def _corrupt_segment(self, log, qcam, index, miss):
        self._corrupt_log(log, index, miss)
        if 'qcameras' not in miss:
            self._copy_qcam(qcam, index)

    def corrupt(self, miss=[]):
        with ThreadPoolExecutor() as executor:
            futures = [executor.submit(self._corrupt_segment, segment, self._qcams[index], index, miss) for index, segment in enumerate(self._segments)]
            for future in futures:
                future.result()
        
        return f'{STORAGE_PATH}/{self.route}/'

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