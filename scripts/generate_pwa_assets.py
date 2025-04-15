# /// script
# requires-python = ">=3.12"
# dependencies = [
#   "CairoSVG",
#   "pillow",
# ]
# ///

import os
import re
import tempfile
import xml.etree.ElementTree as ET
from cairosvg import svg2png
from PIL import Image

# --- Path Configuration ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR) # Assumes script is in 'scripts/'

INPUT_SVG_PATH = os.path.join(PROJECT_ROOT, "public", "images", "comma-white.svg")
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "dist")
TARGET_HTML_PATH = os.path.join(OUTPUT_DIR, "index.html")

# --- Asset Configuration ---
BACKGROUND_COLOR = "#131318"
LOGO_FILL_COLOR = "#ffffff"
BASE_VIEWBOX = "0 0 128 128" # Should match viewBox of input logo.svg
BASE_WIDTH = 128 # Width corresponding to BASE_VIEWBOX
BASE_HEIGHT = 128 # Height corresponding to BASE_VIEWBOX
FAVICON_CORNER_RADIUS = "28"
LOGO_SPLASH_TARGET_SIZE = 256

# --- Padding Configuration ---
# Scale factor for the logo inside padded icons (e.g., 0.8 = 80% size, creating ~10% padding around)
# Applied to maskable, pwa-*, apple-touch-* icons. Set to 1.0 or None to disable padding.
PADDED_ICON_LOGO_SCALE = 0.6

# --- PWA Asset Definitions (Icons) ---
PWA_ASSETS = {
  "favicon.svg": {"type": "rounded", "size": (BASE_WIDTH, BASE_HEIGHT), "format": "svg", "padding": True},
  "favicon.ico": {"type": "rounded", "size": (48, 48), "format": "ico", "padding": True},
  "pwa-64x64.png": {"type": "rounded", "size": (64, 64), "format": "png", "padding": True},
  "pwa-192x192.png": {"type": "rounded", "size": (192, 192), "format": "png", "padding": True},
  "pwa-512x512.png": {"type": "rounded", "size": (512, 512), "format": "png", "padding": True},
  "maskable-icon-512x512.png": {"type": "square",  "size": (512, 512), "format": "png", "padding": True},
  "apple-touch-icon-180x180.png": {"type": "square",  "size": (180, 180), "format": "png", "padding": True},
}

# --- Apple Splash Screen Definitions (Device Info) ---
APPLE_SPLASH_SCREENS = [
  # device_width, device_height, pixel_ratio
  (1024, 1366, 2), (834, 1194, 2), (768, 1024, 2), (834, 1112, 2),
  (810, 1080, 2), (430, 932, 3), (393, 852, 3), (428, 926, 3),
  (390, 844, 3), (375, 812, 3), (414, 896, 2), (414, 896, 3),
  (414, 736, 3), (375, 667, 2), (320, 568, 2),
]

# --- Helper Functions ---

def create_output_dir(dir_path):
  """Creates the output directory if it doesn't exist."""
  if not os.path.exists(dir_path):
    os.makedirs(dir_path)
    print(f"Created output directory: '{dir_path}'")
  else:
    print(f"Output directory '{dir_path}' already exists.")

def extract_logo_path_data(svg_path):
  """Parses SVG, extracts path data, ensures fill color."""
  if not os.path.exists(svg_path):
    print(f"Error: Input SVG file not found at '{svg_path}'")
    exit(1)
  try:
    ET.register_namespace('', "http://www.w3.org/2000/svg")
    tree = ET.parse(svg_path)
    root = tree.getroot()
    ns = {'svg': 'http://www.w3.org/2000/svg'}

    # Attempt to find logo paths (adjust selectors if needed for complex SVGs)
    paths = root.findall('.//svg:path[@fill="#fff"]', ns) or \
            root.findall('.//svg:path[@fill="#FFF"]', ns)
    if not paths:
      # Fallback: check inside groups or just grab any path
      group = root.find('.//svg:g', ns)
      paths = (group.findall('.//svg:path', ns) if group is not None
               else root.findall('.//svg:path', ns))
      print("Warning: Using path(s) not explicitly filled white.")

    if not paths: raise ValueError("No <path> elements found in the input SVG.")

    path_elements_str = ""
    for path in paths:
      path.set('fill', LOGO_FILL_COLOR) # Ensure logo color
      # Clean up namespaces added by ET.tostring (if any)
      for key in list(path.attrib.keys()):
        if key.startswith('{'): del path.attrib[key]
      path_elements_str += ET.tostring(path, encoding='unicode', method='xml').strip() + "\n  "

    print(f"Successfully extracted path data from '{os.path.basename(svg_path)}'.")
    return path_elements_str.strip()

  except ET.ParseError: print(f"Error: Could not parse '{svg_path}'. Invalid XML/SVG?"); exit(1)
  except Exception as e: print(f"An error occurred during SVG parsing: {e}"); exit(1)


def generate_icon_svg_content(viewbox, bg_color, logo_path_data, corner_radius=None, padding_scale=None):
  """
  Generates SVG string for standard icons.
  Applies padding by scaling/centering the logo if padding_scale is provided.
  """
  rect_attr = f'width="100%" height="100%" fill="{bg_color}"'
  if corner_radius: rect_attr += f' rx="{corner_radius}" ry="{corner_radius}"'

  logo_content = logo_path_data
  # Apply padding if requested and valid scale factor
  if padding_scale and 0 < padding_scale < 1.0:
    # Calculate translation needed to center the scaled logo
    # Assumes logo's origin (0,0) is top-left within its coordinate system
    tx = (BASE_WIDTH * (1 - padding_scale)) / 2
    ty = (BASE_HEIGHT * (1 - padding_scale)) / 2
    transform = f"translate({tx:.4f} {ty:.4f}) scale({padding_scale:.4f})"
    # Wrap the original logo paths in a transformed group
    logo_content = f'<g transform="{transform}">\n    {logo_path_data}\n  </g>'

  return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}" fill="none">
  <rect {rect_attr}/>
  {logo_content}
</svg>'''


def generate_splash_svg_content(splash_w, splash_h, bg_color, logo_path_data,
                                original_logo_w, original_logo_h, target_logo_size):
  """Generates SVG for splash screens, centering the logo based on target size."""
  if original_logo_w <= 0: return "" # Avoid division by zero
  scale = target_logo_size / original_logo_w
  scaled_w = original_logo_w * scale
  scaled_h = original_logo_h * scale
  tx = (splash_w - scaled_w) / 2
  ty = (splash_h - scaled_h) / 2
  transform = f"translate({tx:.4f} {ty:.4f}) scale({scale:.4f})"
  return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {splash_w} {splash_h}" width="{splash_w}" height="{splash_h}" fill="none">
  <rect width="100%" height="100%" fill="{bg_color}"/>
  <g transform="{transform}">
    {logo_path_data}
  </g>
</svg>'''

def generate_png(svg_content, output_path, width, height):
  """Generates PNG from SVG content."""
  print(f"Generating PNG: {os.path.basename(output_path)} ({width}x{height})...")
  try:
    svg2png(bytestring=svg_content.encode('utf-8'), write_to=output_path,
            output_width=width, output_height=height)
  except Exception as e:
    print(f"Error generating {os.path.basename(output_path)}: {e}")
    print("Ensure cairosvg and dependencies (cairo, etc.) are installed.")

def generate_ico(svg_content, output_path, size):
  """Generates ICO from SVG via temp PNG."""
  width, height = size
  print(f"Generating ICO: {os.path.basename(output_path)} ({width}x{height})...")
  with tempfile.TemporaryDirectory() as tmpdir:
    temp_png = os.path.join(tmpdir, "temp_icon.png")
    try:
      generate_png(svg_content, temp_png, width, height)
      img = Image.open(temp_png)
      if img.mode != 'RGBA': img = img.convert('RGBA')
      img.save(output_path, format='ICO', sizes=[(width, height)])
    except FileNotFoundError: print(f"Error: Temp PNG for ICO not found. PNG generation failed?")
    except Exception as e: print(f"Error generating {os.path.basename(output_path)}: {e}")

def generate_splash_filename(png_w, png_h, orientation):
  """Generates filename for splash screens."""
  return f"apple-splash-{orientation}-{png_w}x{png_h}.png"

def generate_splash_media_query(device_w, device_h, ratio, orientation):
  """Generates media query string for splash screen."""
  return (f"screen and (device-width: {device_w}px) and "
          f"(device-height: {device_h}px) and "
          f"(-webkit-device-pixel-ratio: {ratio}) and "
          f"(orientation: {orientation})")

def inject_html_links(target_html_path, links_to_inject):
  """
  Reads HTML, finds the </head> tag, and injects the links block
  with markers just before it, using appropriate indentation.
  """
  print(f"\nAttempting to inject links into '{target_html_path}'...")
  if not os.path.exists(target_html_path):
    print(f"Error: Target HTML file not found at '{target_html_path}'. Skipping injection.")
    return

  try:
    with open(target_html_path, 'r', encoding='utf-8') as f:
      html_content = f.read()

    # 1. Find the position just before </head> and determine indentation
    # Search for optional whitespace before </head> on its own line
    head_end_match = re.search(r"^(.*?)(\s*)</head>", html_content, re.MULTILINE | re.IGNORECASE)
    if not head_end_match:
      print("Warning: '</head>' tag not found or couldn't determine its position accurately. Skipping HTML link injection.")
      return

    insertion_point = head_end_match.start(2) # Position right before the whitespace before </head>
    # Get whitespace on the </head> line itself to use as base indentation
    base_indentation = head_end_match.group(2).split('\n')[-1]

    # 2. Determine indentation for links (typically base + 2 spaces)
    link_indentation = base_indentation + "  "

    # 3. Construct the new block with correct indentation
    indented_links = "\n".join([f"{link_indentation}{link}" for link in links_to_inject])
    # Add newline before the start marker if insertion point isn't already preceded by one
    prefix_newline = "\n" if insertion_point > 0 and html_content[insertion_point-1:insertion_point] != '\n' else ''

    final_injection_block = (
      f"{prefix_newline}{base_indentation}\n"
      f"{indented_links}\n"
      f"{base_indentation}\n" # Ensure newline after end marker before </head>
    )

    # 4. Insert the block into the HTML content
    final_html = html_content[:insertion_point] + final_injection_block + html_content[insertion_point:]

    # 5. Write the updated content back to the file
    with open(target_html_path, 'w', encoding='utf-8') as f:
      f.write(final_html)
    print(f"Successfully injected PWA asset links into '{os.path.basename(target_html_path)}'.")

  except IOError as e:
    print(f"Error reading or writing '{target_html_path}': {e}")
  except Exception as e:
    print(f"An unexpected error occurred during HTML injection: {e}")
    import traceback
    traceback.print_exc()

# --- Main Execution ---
if __name__ == "__main__":
  print("Starting PWA asset generation...")
  print(f"Input SVG: '{INPUT_SVG_PATH}'")
  print(f"Output Dir: '{OUTPUT_DIR}'")

  create_output_dir(OUTPUT_DIR)
  logo_path_svg_elements = extract_logo_path_data(INPUT_SVG_PATH)

  generated_html_links = []

  # --- Generate PWA Icons ---
  print("\n--- Generating PWA Icons ---")
  for filename_base, config in PWA_ASSETS.items():
    output_path = os.path.join(OUTPUT_DIR, filename_base)
    asset_type = config["type"]
    size = config["size"]
    file_format = config["format"]
    needs_padding = config.get("padding", False) # Check if padding is needed
    width, height = size
    href = filename_base # Relative path for HTML

    # Determine scale factor for padding
    current_padding_scale = PADDED_ICON_LOGO_SCALE if needs_padding else None

    # Determine corner radius
    current_corner_radius = FAVICON_CORNER_RADIUS if asset_type == "rounded" else None

    # Generate the SVG content for this specific icon (with or without padding/rounding)
    current_icon_svg = generate_icon_svg_content(
      BASE_VIEWBOX,
      BACKGROUND_COLOR,
      logo_path_svg_elements,
      corner_radius=current_corner_radius,
      padding_scale=current_padding_scale
    )

    # Generate the output file (SVG, PNG, or ICO)
    if file_format == "svg":
      print(f"Generating SVG: {filename_base}...")
      try:
        with open(output_path, "w", encoding="utf-8") as f: f.write(current_icon_svg)
        generated_html_links.append(f'<link rel="icon" type="image/svg+xml" href="{href}">')
      except IOError as e: print(f"Error writing {output_path}: {e}")
    elif file_format == "png":
      generate_png(current_icon_svg, output_path, width, height)
      rel = 'apple-touch-icon' if 'apple-touch' in filename_base else 'icon'
      # Add purpose="maskable" if it's the maskable icon
      purpose = ' purpose="maskable"' if 'maskable' in filename_base else ''
      generated_html_links.append(f'<link rel="{rel}" type="image/png" sizes="{width}x{height}" href="{href}"{purpose}>')
    elif file_format == "ico":
      # ICO often doesn't need padding, use the non-padded version unless specified otherwise
      # The config currently sets favicon.ico padding: False, so current_icon_svg is correct
      generate_ico(current_icon_svg, output_path, size)
      generated_html_links.append(f'<link rel="icon" type="image/x-icon" sizes="{width}x{height}" href="{href}">')


  # --- Generate Apple Splash Screens ---
  print("\n--- Generating Apple Splash Screens ---")
  if not APPLE_SPLASH_SCREENS:
    print("No splash screen data defined.")
  else:
    # Splash screens use their own centering logic based on LOGO_SPLASH_TARGET_SIZE, padding is not applied here
    for screen_data in APPLE_SPLASH_SCREENS:
      dev_w, dev_h, ratio = screen_data
      for orientation in ['portrait', 'landscape']:
        png_w = int(dev_w * ratio) if orientation == 'portrait' else int(dev_h * ratio)
        png_h = int(dev_h * ratio) if orientation == 'portrait' else int(dev_w * ratio)

        filename_base = generate_splash_filename(png_w, png_h, orientation)
        output_path = os.path.join(OUTPUT_DIR, filename_base)
        href = filename_base # Relative path for HTML link

        splash_svg = generate_splash_svg_content(
          png_w, png_h, BACKGROUND_COLOR, logo_path_svg_elements,
          BASE_WIDTH, BASE_HEIGHT, LOGO_SPLASH_TARGET_SIZE
        )
        if not splash_svg: continue

        generate_png(splash_svg, output_path, png_w, png_h)

        media_query = generate_splash_media_query(dev_w, dev_h, ratio, orientation)
        generated_html_links.append(f'<link rel="apple-touch-startup-image" media="{media_query}" href="{href}">')

  # --- Inject Links into HTML ---
  if generated_html_links:
    generated_html_links.sort(key=lambda x: ('apple-touch-startup-image' not in x, 'maskable' not in x, x)) # Sort order tweak
    inject_html_links(TARGET_HTML_PATH, generated_html_links)
  else:
    print("\nNo HTML links were generated to inject.")


  print("\n--- Asset generation complete! ---")
  print(f"Assets saved in '{OUTPUT_DIR}' directory.")
  if os.path.exists(TARGET_HTML_PATH):
    print(f"Check '{TARGET_HTML_PATH}' for injected links.")
