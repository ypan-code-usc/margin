#!/bin/bash
# Margin — one-line installer for macOS Apple Silicon
# Usage: bash <(curl -fsSL https://raw.githubusercontent.com/ypan-code-usc/margin/main/install.sh)

set -e

REPO="ypan-code-usc/margin"
APP_NAME="Margin"
INSTALL_DIR="/Applications"

echo "→ Fetching latest Margin release..."
DMG_URL=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" \
  | grep "browser_download_url.*\.dmg" \
  | head -1 \
  | sed 's/.*"browser_download_url": "\(.*\)"/\1/')

if [ -z "$DMG_URL" ]; then
  echo "Error: could not find a DMG in the latest release." >&2
  exit 1
fi

TMP_DMG=$(mktemp /tmp/Margin-XXXXXX.dmg)
echo "→ Downloading $DMG_URL..."
curl -fsSL -o "$TMP_DMG" "$DMG_URL"

echo "→ Mounting disk image..."
MOUNT_POINT=$(hdiutil attach "$TMP_DMG" -nobrowse -quiet | awk 'END {print $NF}')

echo "→ Copying $APP_NAME.app to $INSTALL_DIR..."
cp -R "$MOUNT_POINT/$APP_NAME.app" "$INSTALL_DIR/"

echo "→ Removing quarantine attribute (Gatekeeper bypass)..."
xattr -cr "$INSTALL_DIR/$APP_NAME.app"

echo "→ Unmounting disk image..."
hdiutil detach "$MOUNT_POINT" -quiet

rm -f "$TMP_DMG"

echo "✓ Margin installed. Launch it from /Applications or Spotlight."
