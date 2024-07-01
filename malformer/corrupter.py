from utils.defaults import ROUTE, STORAGE_PATH
from utils.reader import LogFileReader
from schema import log
from concurrent.futures import ThreadPoolExecutor
import random
import string
import bz2
import shutil
import os

class Corrupter:
    def __init__(self, paths, route=ROUTE):
        self.route = self._generate_name(route)
        self._qlogs = paths['qlogs']
        self._qcams = paths['qcameras']
    
    def _generate_name(self, name, n=4):
        words = name.split('--')
        if len(words) < 1:
            return name

        length = len(words[1])
        word_list = list(words[1])

        random_indices = random.sample(range(length), n)
        for index in random_indices:
            word_list[index] = random.choice(string.ascii_lowercase)

        modified_word = ''.join(word_list)
        return f"{words[0]}--{modified_word}"

    def _corrupt_qlog(self, source, index, miss=[]):
        readers = LogFileReader(source)
        
        directory = f'{STORAGE_PATH}/{self.route}/{self.route}--{index}/'
        os.makedirs(directory, exist_ok=True)  # Corrected directory creation
        fn = os.path.join(directory, 'qlog.bz2')

        data = bytearray()
        for reader in readers:
            if reader.which() not in miss:
                builder = reader.as_builder()
                data.extend(builder.to_bytes())
        compressed = bz2.compress(data)

        with open(fn, 'wb') as qlog:
            qlog.write(compressed)
    
    def _copy_qcam(self, source, index):
        destination = f'{STORAGE_PATH}/{self.route}/{self.route}--{index}/'
        os.makedirs(destination, exist_ok=True)  # Corrected directory creation
        shutil.copy(source, destination)

    def _corrupt_segment(self, qlog, qcam, index, miss):
        self._corrupt_qlog(qlog, index, miss)
        if 'qcameras' not in miss:
            self._copy_qcam(qcam, index)

    def corrupt(self, miss=[]):
        with ThreadPoolExecutor() as executor:
            futures = [
                executor.submit(self._corrupt_segment, qlog, self._qcams[index], index, miss)
                for index, qlog in enumerate(self._qlogs)
            ]
            for future in futures:
                future.result()
