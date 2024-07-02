import capnp, os, urllib, bz2, zstd, warnings
from collections.abc import Iterator
from schema import log

class LogFileReader:
  def __init__(self, fn, canonicalize=True, only_union_types=False, sort_by_time=False, dat=None):
    self.data_version = None
    self._only_union_types = only_union_types

    ext = None
    if not dat:
      _, ext = os.path.splitext(urllib.parse.urlparse(fn).path)
      if ext not in ('', '.bz2', '.zst'):
        # old rlogs weren't compressed
        raise Exception(f"unknown extension {ext}")
        
      with open(fn, 'rb') as f:
        dat = f.read()

    if ext == ".bz2" or dat.startswith(b'BZh9'):
      dat = bz2.decompress(dat)
    elif ext == ".zst" or dat.startswith(b'\x28\xB5\x2F\xFD'):
      # https://github.com/facebook/zstd/blob/dev/doc/zstd_compression_format.md#zstandard-frames
      dat = zstd.decompress(dat)

    ents = log.Event.read_multiple_bytes(dat)

    self._ents = []
    try:
      for e in ents:
        self._ents.append(e)
    except capnp.KjException:
      warnings.warn("Corrupted events detected", RuntimeWarning, stacklevel=1)

    if sort_by_time:
      self._ents.sort(key=lambda x: x.logMonoTime)
  
  def __iter__(self) -> Iterator[capnp._DynamicStructReader]:
    for ent in self._ents:
      if self._only_union_types:
        try:
          ent.which()
          yield ent
        except capnp.lib.capnp.KjException:
          pass
      else:
        yield ent