#!/bin/bash
function convert_logo {
    SRC="$1"
    DIR="$2"
    echo "Processing $DIR..."
    mkdir -p "$DIR/public/icons"
    # Read image width to crop square perfectly
    WIDTH=$(magick identify -format "%w" "$SRC")
    # 512x512
    magick "$SRC" -gravity center -crop ${WIDTH}x${WIDTH}+0+0 +repage -resize 512x512 "$DIR/public/icons/icon-512.png"
    # 192x192
    magick "$DIR/public/icons/icon-512.png" -resize 192x192 "$DIR/public/icons/icon-192.png"
    # favicon (64x64)
    magick "$DIR/public/icons/icon-512.png" -resize 64x64 "$DIR/public/favicon.png"
    # apple touch icon 180x180
    magick "$DIR/public/icons/icon-512.png" -resize 180x180 "$DIR/public/apple-touch-icon.png"
    # Clean up generic svgs or icons
    rm -f "$DIR/public/favicon.svg" "$DIR/public/vite.svg" "$DIR/public/favicon.ico"
}

convert_logo "$HOME/Downloads/cleanflow-client.png" "apps/client"
convert_logo "$HOME/Downloads/cleanflow agent.png" "apps/agent"
convert_logo "$HOME/Downloads/cleanflow business.png" "apps/business"
convert_logo "$HOME/Downloads/cleanadmin.png" "apps/admin"
echo "Done!"
