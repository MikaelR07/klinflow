#!/bin/bash
SRC="$HOME/Downloads/cleanflow-base.png"
WIDTH=848

function generate_icons {
    APP_DIR=$1
    SOURCE_SQUARE=$2
    
    mkdir -p "$APP_DIR/public/icons"
    
    # 512x512
    magick "$SOURCE_SQUARE" -resize 512x512 "$APP_DIR/public/icons/icon-512.png"
    # 192x192
    magick "$APP_DIR/public/icons/icon-512.png" -resize 192x192 "$APP_DIR/public/icons/icon-192.png"
    # favicon (64x64)
    magick "$APP_DIR/public/icons/icon-512.png" -resize 64x64 "$APP_DIR/public/favicon.png"
    # apple touch icon 180x180
    magick "$APP_DIR/public/icons/icon-512.png" -resize 180x180 "$APP_DIR/public/apple-touch-icon.png"
}

# 1. Client App (As is, just crop)
echo "Generating Client..."
magick "$SRC" -gravity center -crop ${WIDTH}x${WIDTH}+0+0 +repage /tmp/client-sq.png
generate_icons "apps/client" "/tmp/client-sq.png"

# Helper for labeled logos (Drop Shadow + Text)
function label_icon {
    TEXT=$1
    OUT=$2
    magick "$SRC" -gravity center -crop ${WIDTH}x${WIDTH}+0+0 +repage \
      -pointsize 64 -weight Bold \
      -fill "rgba(0,0,0,0.4)" -annotate +3+163 "$TEXT" \
      -fill white -annotate +0+160 "$TEXT" \
      "$OUT"
}

# 2. Agent App
echo "Generating Agent..."
label_icon "A G E N T" "/tmp/agent-sq.png"
generate_icons "apps/agent" "/tmp/agent-sq.png"

# 3. Business App
echo "Generating Business..."
label_icon "B U S I N E S S" "/tmp/business-sq.png"
generate_icons "apps/business" "/tmp/business-sq.png"

# 4. Admin App
echo "Generating Admin..."
label_icon "A D M I N" "/tmp/admin-sq.png"
generate_icons "apps/admin" "/tmp/admin-sq.png"

echo "Done generating customized logos!"
