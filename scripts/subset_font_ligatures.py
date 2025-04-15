# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "brotli",
#     "fonttools",
#     "requests",
# ]
# ///
import argparse
import requests
import re
import os
from fontTools.subset import Subsetter
from fontTools.ttLib import TTFont


def fetch_font_url(stylesheet_url):
  response = requests.get(stylesheet_url, headers={
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  })
  response.raise_for_status()
  match = re.search(r'url\((https://[^)]+\.woff2)\)', response.text)
  if not match:
    raise Exception("Font URL not found in stylesheet")
  return match.group(1)


def download_font(font_url, save_path):
  response = requests.get(font_url)
  response.raise_for_status()
  with open(save_path, "wb") as f:
    f.write(response.content)
  print(f"Font downloaded: {save_path}")


def subset_font(font_path, output_path, ligatures):
  font = TTFont(font_path)

  existing_ligatures = set()
  for table in font["cmap"].tables:
    existing_ligatures.update(table.cmap.values())  # Gets glyph names
  print(existing_ligatures)

  missing_ligatures = {lig for lig in ligatures if lig not in existing_ligatures}
  if missing_ligatures:
    print(f"Error: The following ligatures are missing from the font: {missing_ligatures}")
    exit(1)

  subsetter = Subsetter()
  subsetter.populate(text="".join(ligatures))
  subsetter.subset(font)

  font.save(output_path)
  print(f"Subsetted font saved: {output_path}")


def main():
  parser = argparse.ArgumentParser(description="Create a subset font from a font file and list of ligatures.")
  parser.add_argument("stylesheet_url", help="Stylesheet URL")
  parser.add_argument("output_file", help="Output font filename (e.g., subset.woff2)")
  parser.add_argument("ligatures", nargs="+", help="List of ligatures to include in the subset")

  args = parser.parse_args()

  font_url = fetch_font_url(args.stylesheet_url)
  temp_font_path = "tmp_full_font.woff2"

  try:
    download_font(font_url, temp_font_path)
    subset_font(temp_font_path, args.output_file, args.ligatures)
  finally:
    if os.path.exists(temp_font_path):
      os.remove(temp_font_path)


if __name__ == "__main__":
  main()
