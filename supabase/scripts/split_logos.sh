#!/bin/bash
SRC="$HOME/Downloads/cleanflow-base2.png"

# Split into 4 quadrants
echo "Splitting image into quadrants..."
magick "$SRC" -crop 50%x50% +repage /tmp/grid-%d.png

function process_app {
    QUAD_IMG="/tmp/grid-$1.png"
    APP_DIR="apps/$2"
    
    echo "Processing $APP_DIR..."
    
    # 1. Center crop the tall quadrant into a perfect square
    # Since 50% of 847 is ~423, and 50% of 1264 is 632
    # The text and logo is in the middle of each. We'll crop 400x400.
    magick "$QUAD_IMG" -gravity center -crop 420x420+0+0 +repage /tmp/temp-sq.png
    
    # 2. Generate standard icons
    mkdir -p "$APP_DIR/public/icons"
    magick /tmp/temp-sq.png -resize 512x512 "$APP_DIR/public/icons/icon-512.png"
    magick "$APP_DIR/public/icons/icon-512.png" -resize 192x192 "$APP_DIR/public/icons/icon-192.png"
    magick "$APP_DIR/public/icons/icon-512.png" -resize 64x64 "$APP_DIR/public/favicon.png"
    magick "$APP_DIR/public/icons/icon-512.png" -resize 180x180 "$APP_DIR/public/apple-touch-icon.png"
    
    # Clean up old generic files
    rm -f "$APP_DIR/public/favicon.svg" "$APP_DIR/public/vite.svg" "$APP_DIR/public/favicon.ico"
}

# Map layout to apps
# grid-0: Top-Left (Client)
# grid-1: Top-Right (Agent)
# grid-2: Bottom-Left (Business)
# grid-3: Bottom-Right (Admin)
process_app 0 "client"
process_app 1 "agent"
process_app 2 "business"
process_app 3 "admin"

echo "Done splitting and assigning new logos!"
