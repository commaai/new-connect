import threading, requests, os
from utils.defaults import DEVICE, ROUTE, ACCOUNT, STORAGE_PATH
from concurrent.futures import ThreadPoolExecutor, as_completed

class Downloader:
    def __init__(self, account=ACCOUNT, dongleId=DEVICE, route=ROUTE):
        self.files = self._request(f'https://api.commadotai.com/v1/route/{dongleId}|{route}/files', { 'Authorization': f'JWT {account}' })
        self.route = route
    
    def _request(self, url, headers):
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return response.json()
        raise Exception(f'{url} returned a response {response.text} with status code {response.status_code}')
    
    def _download_resource(self, url, index, name):
        response = requests.get(url)
        if response.status_code == 200:
            directory = f'{STORAGE_PATH}/{self.route}/{self.route}--{index}/'
            os.makedirs(os.path.dirname(directory), exist_ok=True)
            fn = os.path.join(directory, name)
            with open(fn, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            return fn
        raise Exception(f'{url} returned a response {response.text} with status code {response.status_code}')
    
    def download_resources(self, resources: 'what all you want to download (eg, qlogs, qcams)'):
        if self.files is None:
            return None
        
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
                if path:
                    downloads[name].append(path)
        
        for key in downloads:
            downloads[key].sort()

        return downloads
