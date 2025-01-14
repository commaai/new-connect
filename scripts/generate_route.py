import argparse
import random
from functools import partial
from pathlib import Path

from tqdm import tqdm

from cereal.services import SERVICE_LIST
from openpilot.tools.lib.auth_config import clear_token, get_token, set_token
from openpilot.tools.lib.logreader import LogReader, save_log
from openpilot.tools.lib.route import Route, RouteName
from openpilot.tools.lib.url_file import URLFile


DEMO_DONGLE = "1d3dc3e03047b0c7"
DEMO_LOG_ID = "000000dd--455f14369d"
DEMO_ACCOUNT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDg1ODI0NjUsIm5iZiI6MTcxNzA0NjQ2NSwiaWF0IjoxNzE3MDQ2NDY1LCJpZGVudGl0eSI6IjBkZWNkZGNmZGYyNDFhNjAifQ.g3khyJgOkNvZny6Vh579cuQj1HLLGSDeauZbfZri9jw"

OUTPUT_PATH = Path(__file__).parent.resolve() / "output"

MAX_LOG_DURATION = 62.0  # seconds
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
  log_durations: list[float] = []

  for qlog in tqdm(qlog_paths, desc="Validating qlogs"):
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
    log_durations.append(max_log_time - min_log_time)

  route_duration = max_route_time - min_route_time
  print(f"\nRoute duration: {route_duration:.2f}s")
  print(f"  {len(qlog_paths)} qlogs")
  print(f"  logMonoTime min {min_route_time:.2f}, max: {max_route_time:.2f}")

  log_durations_valid = all(duration < MAX_LOG_DURATION for duration in log_durations)
  print(f"\nLog durations: {'PASS' if log_durations_valid else 'FAIL'}")
  if not log_durations_valid:
    for i, duration in enumerate(log_durations):
      print(f"  qlog {i} duration: {duration:.2f}s")
    exit(1)

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
    print("FAIL: clocks.valid is False")
    exit(1)
  elif not location_has_fix:
    print("FAIL: gpsLocation.hasFix is False")
    exit(1)
  elif not all(freq_valid.values()):
    print("FAIL: Not all services have the expected frequency")
    exit(1)


def get_next_log_count(dongle_path: Path, route_name: RouteName) -> int:
  count = 0
  try:
    count = int(route_name.time_str.split("--")[0], 16)
  except ValueError:
    pass
  for dir in filter(lambda d: d.is_dir(), dongle_path.iterdir()):
    try:
      count = max(count, int(dir.name.split("--")[0], 16))
    except ValueError:
      pass
  return count + 1


def corrupt_qlog(omit_msg_types: list[str], qlog_path: str) -> list:
  return filter(lambda m: m.which() not in omit_msg_types, LogReader(qlog_path))


def process(route: Route, omit_msg_types: list[str]) -> None:
  # Get all file URLs from segment 0 to max
  qlogs, qcameras = route.qlog_paths(), route.qcamera_paths()
  assert all(qlog is not None for qlog in qlogs), "At least one qlog is missing"
  assert all(qcam is not None for qcam in qcameras), "At least one qcam is missing"

  # TODO: validate qcamera.ts files
  validate_qlogs(qlogs)

  dongle_path = OUTPUT_PATH / route.name.dongle_id
  if not dongle_path.exists():
    dongle_path.mkdir(parents=True, exist_ok=True)

  count = get_next_log_count(dongle_path, route.name)
  log_id = f"{count:08x}--{''.join(random.choices("0123456789abcdef", k=10))}"
  print(f"\nNew route: {route.name.dongle_id}|{log_id}")
  print(f"Omitting messages: {omit_msg_types}")

  segment_names = [f"{log_id}--{i}" for i in range(len(qlogs))]
  corrupt_qlogs = map(partial(corrupt_qlog, omit_msg_types), qlogs)
  for (segment_name, qlog, qcam) in tqdm(list(zip(segment_names, corrupt_qlogs, qcameras, strict=True)), desc="Generating corrupt logs"):
    segment_path = dongle_path / segment_name
    segment_path.mkdir(parents=True, exist_ok=True)

    qlog_path = segment_path / "qlog.gz"
    save_log(qlog_path.as_posix(), qlog)

    qcam_path = segment_path / "qcamera.ts"
    dat = URLFile(qcam).read()
    qcam_path.write_bytes(dat)


def main() -> None:
  parser = argparse.ArgumentParser(description="Generate a corrupt route")
  parser.add_argument("--drop-clocks", action="store_true", help="Drop clocks messages")
  parser.add_argument("--drop-gps-location", action="store_true", help="Drop gpsLocation messages")
  parser.add_argument("--drop-thumbnail", action="store_true", help="Drop thumbnail messages")
  parser.add_argument("route_name", nargs="?", default=f"{DEMO_DONGLE}|{DEMO_LOG_ID}")
  args = parser.parse_args()

  route = Route(args.route_name)
  print(f"Route: {route.name}")

  omit_msg_types = []
  if args.drop_clocks:
    omit_msg_types.append("clocks")
  if args.drop_gps_location:
    omit_msg_types.append("gpsLocation")
  if args.drop_thumbnail:
    omit_msg_types.append("thumbnail")
  if not omit_msg_types:
    omit_msg_types = ["clocks", "gpsLocation", "thumbnail"]

  use_demo_account = route.name.dongle_id == DEMO_DONGLE and not get_token()
  if use_demo_account:
    print("Using demo account")
    set_token(DEMO_ACCOUNT)
  elif not get_token():
    print("Use the openpilot/tools/lib/auth.py script to set your JWT")
    exit(1)

  try:
    process(route, omit_msg_types)
  finally:
    if use_demo_account:
      clear_token()


if __name__ == "__main__":
  main()
