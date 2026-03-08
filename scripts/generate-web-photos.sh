#!/bin/zsh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE_DIR="$ROOT_DIR/public/photos"
WEB_DIR="$ROOT_DIR/public/photos-web"
THUMB_DIR="$ROOT_DIR/public/photos-thumb"
WEB_MAX_EDGE=2800
THUMB_MAX_EDGE=1200

rm -rf "$WEB_DIR" "$THUMB_DIR"
mkdir -p "$WEB_DIR" "$THUMB_DIR"

while IFS= read -r source_path; do
  relative_path="${source_path#$SOURCE_DIR/}"
  file_name="${relative_path:t}"
  extension="${file_name##*.}"
  extension="${(L)extension}"

  if [[ "$file_name" == .DS_Store || "$file_name" == .gitkeep ]]; then
    continue
  fi

  web_output_path="$WEB_DIR/$relative_path"
  thumb_output_path="$THUMB_DIR/$relative_path"

  mkdir -p "${web_output_path:h}" "${thumb_output_path:h}"

  case "$extension" in
    jpg|jpeg)
      sips -Z "$WEB_MAX_EDGE" -s format jpeg -s formatOptions best \
        "$source_path" --out "$web_output_path" >/dev/null
      sips -Z "$THUMB_MAX_EDGE" -s format jpeg -s formatOptions best \
        "$source_path" --out "$thumb_output_path" >/dev/null
      ;;
    png)
      sips -Z "$WEB_MAX_EDGE" "$source_path" --out "$web_output_path" >/dev/null
      sips -Z "$THUMB_MAX_EDGE" "$source_path" --out "$thumb_output_path" >/dev/null
      ;;
    *)
      cp "$source_path" "$web_output_path"
      cp "$source_path" "$thumb_output_path"
      ;;
  esac
done < <(find "$SOURCE_DIR" -type f | sort)

echo "Generated web assets in $WEB_DIR and $THUMB_DIR"
