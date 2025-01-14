# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "openpilot",
# ]
#
# [tool.uv.sources]
# openpilot = { path = "../../openpilot" }
# ///

import argparse
import random
import subprocess
import sys
from functools import partial
from pathlib import Path

from tqdm import tqdm

from cereal.services import SERVICE_LIST
from openpilot.tools.lib.logreader import LogReader, save_log
from openpilot.tools.lib.route import Route, RouteName
from openpilot.tools.lib.url_file import URLFile

from auth import Auth, DEMO_ROUTE_ID
from utils import panic

OUTPUT_PATH = Path(__file__).parent.resolve() / "output"

QLOG_DURATION = (60.0, 62.0)  # seconds
QCAM_DURATION = (59.9, 61.0)  # seconds
MSG_FREQ_THRESHOLD = 0.95  # % of expected frequency


def get_expected_msg_freq(msg_type: str) -> float:
  service = SERVICE_LIST[msg_type]
  return service.frequency / (service.decimation if service.decimation else 1)


def validate_qlogs(qlog_paths: list[str]) -> None:
  # 1. Get the duration of each log
  #   i. Ensure that it is no longer than 60 seconds
  #   ii. Use duration to calculate expected message counts
  # 2. Check that the route contains messages at the correct frequency:
  #   i. gpsLocation is present and that any(gpsLocation.hasFix is True)
  #   ii. clocks is present and that any(msg.valid is True)
  #   iii. thumbnail is present

  msg_counts: dict[str, int] = {
    "gpsLocation": 0,
    "clocks": 0,
    "thumbnail": 0,
  }
  clocks_valid = False
  location_has_fix = False
  min_route_time, max_route_time = float("inf"), 0.0

  for i, qlog in tqdm(enumerate(qlog_paths), desc="Validating qlogs", total=len(qlog_paths)):
    min_log_time, max_log_time = float("inf"), 0.0

    for m in LogReader(qlog):
      msg_type = m.which()
      if msg_type == "initData":
        continue
      log_time = m.logMonoTime / 1.0e9
      min_log_time, max_log_time = min(min_log_time, log_time), max(max_log_time, log_time)
      if msg_type in ("gpsLocation", "thumbnail", "clocks"):
        msg_counts[msg_type] += 1
      if not clocks_valid and msg_type == "clocks" and m.valid is True:
        clocks_valid = True
      if not location_has_fix and msg_type == "gpsLocation" and m.gpsLocation.hasFix is True:
        location_has_fix = True

    min_route_time, max_route_time = min(min_route_time, min_log_time), max(max_route_time, max_log_time)
    log_duration = max_log_time - min_log_time

    if i != len(qlog_paths) - 1 and log_duration < QLOG_DURATION[0]:
      panic(f"Segment {i} qlog is too short ({log_duration:.2f}s)")
    if log_duration >= QLOG_DURATION[1]:
      panic(f"Segment {i} qlog is too long ({log_duration:.2f}s)")

  route_duration = max_route_time - min_route_time
  print(f"Route duration: {route_duration:.2f}s")
  print(f"  logMonoTime min {min_route_time:.2f}, max: {max_route_time:.2f}")

  print("\nServices:")
  freq_valid = {}
  for msg_type, count in msg_counts.items():
    freq = count / route_duration
    expected_freq = get_expected_msg_freq(msg_type)
    valid = freq / expected_freq >= MSG_FREQ_THRESHOLD
    freq_valid[msg_type] = valid
    print(f"  {msg_type}: {count} msgs, {freq:.2f}Hz (expected {expected_freq:.2f}Hz) {'PASS' if valid else 'FAIL'}")
    if msg_type == "clocks":
      print(f"    any(valid): {'PASS' if clocks_valid else 'FAIL'}")
    elif msg_type == "gpsLocation":
      print(f"    any(gpsLocation.hasFix): {'PASS' if location_has_fix else 'FAIL'}")

  if not clocks_valid:
    panic("FAIL: clocks.valid is False")
  elif not location_has_fix:
    panic("FAIL: gpsLocation.hasFix is False")
  elif not all(freq_valid.values()):
    panic("FAIL: Not all services have the expected frequency")


def validate_qcams(qcamera_paths: list[str]) -> None:
  # Simply check the duration of each qcamera.ts
  # TODO: check for existence of video stream in correct format
  for i, qcam in tqdm(enumerate(qcamera_paths), desc="Validating qcams", total=len(qcamera_paths)):
    result = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", qcam],
                            capture_output=True, text=True)
    if result.stderr:
      panic(f"Error processing segment {i} qcamera: {result.stderr}")

    try:
      duration = float(result.stdout)
      if i != len(qcamera_paths) - 1 and duration < QCAM_DURATION[0] or duration >= QCAM_DURATION[1]:
        panic(f"Segment {i} qcamera.ts duration ({duration:.2f}s) is out of range")
    except ValueError as e:
      panic(f"Error processing segment {i} qcamera: could not parse duration: {e}")


def get_next_log_count(dongle_path: Path, route_name: RouteName) -> int:
  try:
    count = int(route_name.time_str.split("--")[0], 16)
  except ValueError:
    count = 0
  for dir in filter(lambda d: d.is_dir(), dongle_path.iterdir()):
    try:
      count = max(count, int(dir.name.split("--")[0], 16))
    except ValueError:
      pass
  return count + 1


def corrupt_qlog(omit_msg_types: list[str], qlog_path: str) -> list:
  return filter(lambda m: m.which() not in omit_msg_types, LogReader(qlog_path))


def process(route: Route, omit_msg_types: list[str], drop_qcams: set[int]) -> None:
  print(f"Route: {route.name}\n")

  # Get all file URLs from segment 0 to max
  qlogs, qcams = route.qlog_paths(), route.qcamera_paths()
  assert all(qlog is not None for qlog in qlogs), "At least one qlog is missing"
  assert all(qcam is not None for qcam in qcams), "At least one qcam is missing"

  validate_qlogs(qlogs)
  print()
  validate_qcams(qcams)

  dongle_path = OUTPUT_PATH / route.name.dongle_id
  if not dongle_path.exists():
    dongle_path.mkdir(parents=True, exist_ok=True)

  count = get_next_log_count(dongle_path, route.name)
  log_id = f"{count:08x}--{''.join(random.choices("0123456789abcdef", k=10))}"
  print(f"\nNew route: {route.name.dongle_id}|{log_id}")
  print(f"Omitting message types: {omit_msg_types}")
  print(f"Dropping qcamera.ts files: {drop_qcams}\n")

  segment_count = len(qlogs)
  corrupt_qlogs = map(partial(corrupt_qlog, omit_msg_types), qlogs)
  for (i, qlog, qcam) in tqdm(zip(range(segment_count), corrupt_qlogs, qcams, strict=True), desc="Generating logs", total=segment_count):
    segment_path = dongle_path / f"{log_id}--{i}"
    segment_path.mkdir(parents=True, exist_ok=True)

    qlog_path = segment_path / "qlog.gz"
    save_log(qlog_path.as_posix(), qlog)

    if i not in drop_qcams:
      qcam_path = segment_path / "qcamera.ts"
      dat = URLFile(qcam, cache=True).read()
      qcam_path.write_bytes(dat)


def main() -> None:
  parser = argparse.ArgumentParser(description="Generate a route with missing logs or messages")
  parser.add_argument("--omit", action="append", choices=["clocks", "gpsLocation", "thumbnail"], help="Omit a message type. Can be specified more than once.")
  parser.add_argument("--drop-qcam", action="append", type=int, help="Drop a qcamera.ts file. Can be specified more than once.")
  parser.add_argument("--drop-qcams", type=int, help="Drop all qcamera.ts files beginning with this segment number. Use 0 to drop all.")
  parser.add_argument("route_name", nargs="?", default=DEMO_ROUTE_ID)
  args = parser.parse_args()

  route = Route(args.route_name)

  drop_qcams = set(args.drop_qcam or [])
  if args.drop_qcams is not None:
    drop_qcams.update(range(args.drop_qcams, len(route.qcamera_paths())))

  if not args.omit and not drop_qcams:
    parser.error("Pass at least one flag to generate a corrupt route")

  with Auth(route):
    process(route, args.omit or [], drop_qcams)


if __name__ == "__main__":
  main()
