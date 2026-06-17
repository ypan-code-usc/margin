#!/usr/bin/env bash
cd "$(dirname "$0")"
echo "Serving Margin at http://localhost:5174"
python3 -m http.server 5174
