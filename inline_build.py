#!/usr/bin/env python3
"""
After `npm run build`, inlines the JS bundle directly into dist/index.html
so the entire app is a single self-contained HTML file — no separate asset
fetches, no caching mismatches, no 404s on old hashes.
"""
import os, sys

assets = 'dist/assets'
js_files = [f for f in os.listdir(assets) if f.endswith('.js')]
if not js_files:
    print('ERROR: no JS file found in dist/assets'); sys.exit(1)

js_file = js_files[0]
print(f'Inlining {js_file} ...')

with open(f'{assets}/{js_file}', 'r', encoding='utf-8') as f:
    js = f.read()

with open('dist/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the external <script> tag with the full JS inline
tag = f'<script type="module" crossorigin src="/9999/assets/{js_file}"></script>'
if tag not in html:
    print(f'ERROR: expected script tag not found:\n  {tag}'); sys.exit(1)

html = html.replace(tag, f'<script type="module">{js}</script>')

with open('dist/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

size_kb = len(html) // 1024
print(f'Done. dist/index.html is now {size_kb} KB (self-contained).')
