#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

VERSION=$(node -p "require('./package.json').version")
OUT="dist/Margin-${VERSION}-arm64.dmg"

echo "Building Margin v${VERSION}..."

# Refresh vendor/katex from node_modules
echo "→ Updating vendor/katex..."
mkdir -p vendor/katex/contrib vendor/katex/fonts
cp node_modules/katex/dist/katex.min.css vendor/katex/
cp node_modules/katex/dist/katex.min.js vendor/katex/
cp node_modules/katex/dist/contrib/auto-render.min.js vendor/katex/contrib/
cp node_modules/katex/dist/fonts/*.woff2 vendor/katex/fonts/

# Build the .app bundle
echo "→ Assembling .app bundle..."
rm -rf dist-app
mkdir -p dist-app
cp -R node_modules/electron/dist/Electron.app dist-app/Margin.app

APP=dist-app/Margin.app/Contents
mkdir -p "$APP/Resources/app"
cp index.html style.css app.js main.js "$APP/Resources/app/"
cp -r vendor "$APP/Resources/app/"
printf '{"name":"margin","version":"%s","main":"main.js"}' "$VERSION" > "$APP/Resources/app/package.json"

# Rename Electron → Margin in the bundle
mv "$APP/MacOS/Electron" "$APP/MacOS/Margin"
/usr/libexec/PlistBuddy -c "Set :CFBundleName Margin"          "$APP/Info.plist"
/usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName Margin"   "$APP/Info.plist"
/usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier com.margin.app" "$APP/Info.plist"
/usr/libexec/PlistBuddy -c "Set :CFBundleExecutable Margin"    "$APP/Info.plist"
xattr -cr dist-app/Margin.app

# Package as DMG
echo "→ Creating DMG..."
rm -rf /tmp/margin-dmg-stage
mkdir /tmp/margin-dmg-stage
cp -R dist-app/Margin.app /tmp/margin-dmg-stage/
ln -s /Applications /tmp/margin-dmg-stage/Applications

mkdir -p dist
rm -f "$OUT"
hdiutil create -volname "Margin" -srcfolder /tmp/margin-dmg-stage -ov -format UDZO "$OUT" > /dev/null

echo "✓ Done: $OUT"
