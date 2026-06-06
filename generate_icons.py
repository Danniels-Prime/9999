import math, struct, zlib, os, random

def make_png(pixels, width, height):
    def chunk(tag, data):
        c = tag + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    raw = b''
    for row in pixels:
        raw += b'\x00'
        for r, g, b, a in row:
            raw += bytes([r, g, b, a])
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png  = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', ihdr)
    png += chunk(b'IDAT', zlib.compress(raw, 9))
    png += chunk(b'IEND', b'')
    return png

def lerp(a, b, t):
    return int(a + (b - a) * max(0.0, min(1.0, t)))

def draw_icon(size, maskable=False):
    cx, cy = size / 2, size / 2
    pad    = size * 0.12 if maskable else 0
    r_main = size * 0.44 - pad

    pixels = []
    for y in range(size):
        row = []
        for x in range(size):
            dx, dy = x - cx, y - cy
            dist   = math.sqrt(dx*dx + dy*dy)

            if dist <= r_main:
                t = dist / r_main
                # Purple gradient center→edge: #7C3AED → #3B0F8C
                pr = lerp(124, 59,  t)
                pg = lerp(58,  15,  t)
                pb = lerp(237, 140, t)

                # Crescent cutout (offset circle to the right)
                ccx   = cx + r_main * 0.30
                ccy   = cy - r_main * 0.04
                cr    = r_main * 0.74
                cdist = math.sqrt((x - ccx)**2 + (y - ccy)**2)

                if cdist <= cr:
                    # Inside cutout → space background
                    row.append((8, 7, 22, 255))
                else:
                    # Moon body — soft inner glow
                    glow = max(0.0, 1.0 - t) * 0.35
                    row.append((
                        min(255, pr + int(glow * 80)),
                        min(255, pg + int(glow * 30)),
                        min(255, pb + int(glow * 60)),
                        255,
                    ))
            else:
                # Outer glow halo
                halo_w = r_main * 0.10
                if dist <= r_main + halo_w:
                    ht    = (dist - r_main) / halo_w
                    alpha = int(180 * (1 - ht))
                    row.append((100, 50, 220, alpha))
                else:
                    row.append((8, 7, 22, 255))

        pixels.append(row)

    # Scatter stars in the dark background
    rng = random.Random(99)
    n_stars = max(12, size // 10)
    for _ in range(n_stars):
        sx, sy = rng.randint(0, size-1), rng.randint(0, size-1)
        if math.sqrt((sx-cx)**2 + (sy-cy)**2) > r_main * 1.05:
            br  = rng.randint(160, 255)
            sz  = 1 if size < 300 else rng.choice([1, 1, 1, 2])
            for dy2 in range(-sz+1, sz):
                for dx2 in range(-sz+1, sz):
                    nx, ny = sx+dx2, sy+dy2
                    if 0 <= nx < size and 0 <= ny < size:
                        pixels[ny][nx] = (br, br, br, rng.randint(160, 220))

    return pixels

os.makedirs('public', exist_ok=True)

for size, fname, maskable in [
    (192, 'public/icon-192.png',          False),
    (512, 'public/icon-512.png',          False),
    (512, 'public/maskable-icon-512.png', True),
]:
    data = make_png(draw_icon(size, maskable), size, size)
    with open(fname, 'wb') as f:
        f.write(data)
    print(f'  {fname}  ({len(data)//1024} KB)')

print('Icons generated.')
