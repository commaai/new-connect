from utils.defaults import ROUTE, STORAGE_PATH
from utils.reader import LogFileReader
from schema import log
from concurrent.futures import ThreadPoolExecutor
import random, string, shutil, os

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
