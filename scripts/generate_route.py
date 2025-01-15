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
from pathlib import Path
from typing import Iterator, NoReturn

from tqdm import tqdm

from cereal.services import SERVICE_LIST
from openpilot.tools.lib.auth_config import clear_token, get_token, set_token
from openpilot.tools.lib.logreader import LogReader, save_log
from openpilot.tools.lib.route import Route, RouteName
from openpilot.tools.lib.url_file import URLFile

OUTPUT_PATH = Path(__file__).parent.resolve() / "output"

DEMO_DONGLE_ID = "1d3dc3e03047b0c7"
DEMO_LOG_ID = "000000dd--455f14369d"
DEMO_ROUTE_ID = f"{DEMO_DONGLE_ID}|{DEMO_LOG_ID}"
DEMO_ACCOUNT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDg1ODI0NjUsIm5iZiI6MTcxNzA0NjQ2NSwiaWF0IjoxNzE3MDQ2NDY1LCJpZGVudGl0eSI6IjBkZWNkZGNmZGYyNDFhNjAifQ.g3khyJgOkNvZny6Vh579cuQj1HLLGSDeauZbfZri9jw"

QLOG_DURATION = (60.0, 62.0)  # seconds
QCAM_DURATION = (59.9, 61.0)  # seconds
MSG_FREQ_THRESHOLD = 0.95  # % of expected frequency


def panic(*args, **kwargs) -> NoReturn:
  print(*args, file=sys.stderr, **kwargs)
  sys.exit(1)


def setup_auth(dongle_id: str):
  if not get_token():
    if dongle_id != DEMO_DONGLE_ID:
      panic("Use the openpilot/tools/lib/auth.py script to set your JWT")
    print("Using demo account")
    set_token(DEMO_ACCOUNT)


def get_msgs_time_range(msgs: list) -> tuple[int, int]:
  min_time, max_time = sys.maxsize, 0
  for m in msgs:
    msg_type = m.which()
    if msg_type == "initData":
      continue
    log_time = m.logMonoTime
    min_time, max_time = min(min_time, log_time), max(max_time, log_time)
  return min_time, max_time


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
  min_route_time, max_route_time = sys.maxsize, 0.0

  for i, qlog in tqdm(enumerate(qlog_paths), desc="Validating qlogs", total=len(qlog_paths)):
    msgs = list(LogReader(qlog))

    for m in msgs:
      msg_type = m.which()
      if msg_type in ("gpsLocation", "thumbnail", "clocks"):
        msg_counts[msg_type] += 1
      if not clocks_valid and msg_type == "clocks" and m.valid is True:
        clocks_valid = True
      if not location_has_fix and msg_type == "gpsLocation" and m.gpsLocation.hasFix is True:
        location_has_fix = True

    min_log_time, max_log_time = get_msgs_time_range(msgs)
    min_route_time, max_route_time = min(min_route_time, min_log_time), max(max_route_time, max_log_time)
    log_duration = (max_log_time - min_log_time) / 1.0e9

    if i != len(qlog_paths) - 1 and log_duration < QLOG_DURATION[0]:
      panic(f"Segment {i} qlog is too short ({log_duration:.2f}s)")
    if log_duration >= QLOG_DURATION[1]:
      panic(f"Segment {i} qlog is too long ({log_duration:.2f}s)")

  route_duration = (max_route_time - min_route_time) / 1.0e9
  print(f"Route duration: {route_duration:.2f}s")
  print(f"  logMonoTime min: {min_route_time}, max: {max_route_time}")

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


def get_qcam_duration(qcam_path: str) -> float:
  result = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", qcam_path],
                          capture_output=True, text=True)
  if result.stderr:
    panic(f"Error processing qcam {qcam_path}: {result.stderr}")
  try:
    return float(result.stdout)
  except ValueError as e:
    panic(f"Error processing qcam {qcam_path}: could not parse duration: {e}")


def validate_qcams(qcamera_paths: list[str]) -> None:
  # TODO: check for existence of video stream in correct format
  for i, qcam in tqdm(enumerate(qcamera_paths), desc="Validating qcams", total=len(qcamera_paths)):
    duration = get_qcam_duration(qcam)
    if i != len(qcamera_paths) - 1 and duration < QCAM_DURATION[0] or duration >= QCAM_DURATION[1]:
      panic(f"Segment {i} qcamera.ts duration ({duration:.2f}s) is out of range")


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


def filter_msgs_log_time(msgs: Iterator, max_log_time: int) -> Iterator:
  return (m for m in msgs if m.logMonoTime < max_log_time)


def offset_msgs_log_time(msgs: Iterator, log_time_offset: int) -> Iterator:
  for m in msgs:
    builder = m.as_builder()
    builder.logMonoTime += log_time_offset
    yield builder.as_reader()


def create_corrupt_qlog(qlog_path: str, omit_msg_types: list[str], target_duration: float | None) -> Iterator:
  msgs = LogReader(qlog_path)
  if omit_msg_types:
    msgs = (m for m in msgs if m.which() not in omit_msg_types)

  if target_duration is None:
    yield from msgs
    return
  elif target_duration == 0:
    return

  target_duration = int(target_duration * 1e9)
  min_log_time, max_log_time = get_msgs_time_range(msgs)
  log_duration = max_log_time - min_log_time
  if target_duration <= log_duration:
    yield from filter_msgs_log_time(msgs, min_log_time + target_duration)
    return

  current_time = 0
  while current_time < target_duration:
    remaining_log_time = target_duration - current_time
    if remaining_log_time < log_duration:
      msgs = filter_msgs_log_time(msgs, min_log_time + remaining_log_time)
    yield from offset_msgs_log_time(msgs, current_time)
    current_time += log_duration


def create_corrupt_qcam(input_path: str, output_path: Path, target_duration: float | None):
  if not target_duration:
    output_path.write_bytes(URLFile(input_path, cache=True).read())
    return

  result = subprocess.run(["ffmpeg", "-v", "error", "-stream_loop", "-1", "-i", input_path,
                           "-t", f"{target_duration:.3f}", "-c:v", "copy", output_path.as_posix()],
                           capture_output=True, text=True)
  if result.stderr:
    panic(f"Error creating corrupt qcam {input_path}:\n{result.stderr}")
  elif result.stdout:
    print(result.stdout)


def process(route: Route, omit_msg_types: list[str], drop_qcams: set[int], segment_durations: dict[int, float]) -> None:
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
  print(f"Dropping qcamera.ts files: {drop_qcams}")
  print(f"Modifying segment durations: {segment_durations}\n")

  segment_count = len(qlogs)
  for (i, qlog, qcam) in tqdm(zip(range(segment_count), qlogs, qcams, strict=True), desc="Generating logs", total=segment_count):
    segment_path = dongle_path / f"{log_id}--{i}"
    segment_path.mkdir(parents=True, exist_ok=True)

    qlog_path = segment_path / "qlog.zst"
    corrupt_qlog = create_corrupt_qlog(qlog, omit_msg_types, segment_durations.get(i, None))
    save_log(qlog_path.as_posix(), corrupt_qlog)

    if i not in drop_qcams:
      qcam_path = segment_path / "qcamera.ts"
      create_corrupt_qcam(qcam, qcam_path, segment_durations.get(i, None))


def main() -> None:
  parser = argparse.ArgumentParser(description="Generate a route with missing logs or messages")
  parser.add_argument("--omit", action="append", choices=["clocks", "gpsLocation", "thumbnail"], help="Omit a message type. Can be specified more than once.")
  parser.add_argument("--drop-qcam", action="append", type=int, help="Drop a qcamera.ts file. Can be specified more than once.")
  parser.add_argument("--drop-qcams", type=int, help="Drop all qcamera.ts files beginning with this segment number. Use 0 to drop all.")
  parser.add_argument("--duration", action="append", type=str, help="Modify segment duration. Format: 'segment_index:duration_seconds' (e.g. 1:30.5)")
  parser.add_argument("route_name", nargs="?", default=DEMO_ROUTE_ID)
  args = parser.parse_args()

  route = Route(args.route_name)

  drop_qcams = set(args.drop_qcam or [])
  if args.drop_qcams is not None:
    drop_qcams.update(range(args.drop_qcams, len(route.qcamera_paths())))

  segment_durations: dict[int, float] = {}
  if args.duration:
    for segment_duration in args.duration:
      try:
        idx, duration = segment_duration.split(":")
        idx = int(idx)
        if idx in segment_durations:
          parser.error("More than one duration provided for the same segment")
        segment_durations[idx] = float(duration)
      except ValueError:
        parser.error("Invalid segment duration format. Use 'segment_index:duration_seconds'")

  if not args.omit and not drop_qcams and not segment_durations:
    parser.error("Pass at least one flag to generate a corrupt route")

  if not get_token():
    if route.name.dongle_id != DEMO_DONGLE_ID:
      panic("Use the openpilot/tools/lib/auth.py script to set your JWT")
    print("Using demo account")
    set_token(DEMO_ACCOUNT)

  try:
    process(route, args.omit or [], drop_qcams, segment_durations)
  finally:
    if get_token() == DEMO_ACCOUNT:
      clear_token()


if __name__ == "__main__":
  main()
