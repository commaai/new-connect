import capnp, os, urllib, bz2, zstd, warnings
from collections.abc import Iterator
from schema import log

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
