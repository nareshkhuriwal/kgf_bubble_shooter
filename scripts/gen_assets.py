"""
Generates Bubble Kingdom themed assets:
  - icon.png          (1024x1024)
  - adaptive-icon.png (1024x1024)
  - splash.png        (1080x1920)
  - bubble-kingdom-icon-master.png
  - bubble-kingdom-splash-master.png
"""

import math, random
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = "D:/kgf_bubble_shooter/assets"
random.seed(42)

# ── Palette ────────────────────────────────────────────────────────────────────
BG_TOP    = (10,  4,  35)
BG_BOT    = (60, 15, 100)
GOLD      = (255, 215,  0)
GOLD2     = (230, 160, 20)
PURPLE    = ( 80,  0, 160)
CROWN_OUT = (200, 140,   0)

BUBBLE_COLORS = [
    (255, 71, 87),   # red
    (47, 134, 235),  # blue
    (46, 213, 115),  # green
    (255, 215,   0), # yellow
    (155, 89, 182),  # purple
    (255, 107, 53),  # orange
    (255, 105, 180), # pink
    (  0, 206, 201), # cyan
]

# ── Helpers ────────────────────────────────────────────────────────────────────

def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i]-c1[i])*t) for i in range(3))

def vertical_gradient(draw, w, h, top, bot):
    for y in range(h):
        t = y / (h - 1)
        r,g,b = lerp_color(top, bot, t)
        draw.line([(0, y), (w, y)], fill=(r,g,b,255))

def draw_star(draw, cx, cy, r, color=(255,255,255,220)):
    for _ in range(4):
        angle = random.uniform(0, math.pi*2)
        draw.ellipse([cx-r,cy-r,cx+r,cy+r], fill=color)

def draw_stars_bg(draw, w, h, n=120):
    for _ in range(n):
        x = random.randint(0, w)
        y = random.randint(0, h)
        r = random.choice([1, 1, 1, 2, 2, 3])
        br = random.randint(160, 255)
        draw.ellipse([x-r, y-r, x+r, y+r], fill=(br,br,br,200))

def draw_bubble(img_draw_pair, cx, cy, radius, color, alpha=220):
    img, draw = img_draw_pair
    r = radius
    # Base circle
    overlay = Image.new("RGBA", img.size, (0,0,0,0))
    od = ImageDraw.Draw(overlay)
    od.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(*color, alpha))
    # Shine highlight top-left
    hr = int(r * 0.38)
    hx, hy = cx - int(r*0.28), cy - int(r*0.28)
    od.ellipse([hx-hr, hy-hr, hx+hr, hy+hr], fill=(255,255,255,130))
    # Tiny specular dot
    sr = max(2, int(r*0.12))
    sx, sy = cx - int(r*0.45), cy - int(r*0.42)
    od.ellipse([sx-sr, sy-sr, sx+sr, sy+sr], fill=(255,255,255,200))
    img.alpha_composite(overlay)

def draw_castle(img, cx, base_y, scale=1.0):
    """Draws a simple flat-art castle silhouette centered at cx."""
    draw = ImageDraw.Draw(img)
    s = scale
    W  = int(340*s)   # total castle width
    H  = int(280*s)   # main wall height
    TW = int(60*s)    # tower width
    TH = int(340*s)   # tower height
    MW = int(160*s)   # gate width
    MH = int(130*s)   # gate height
    BH = int(30*s)    # battlement height
    BW = int(28*s)    # battlement tooth width
    BS = int(18*s)    # battlement gap

    # Main wall body
    wall_left  = cx - W//2
    wall_right = cx + W//2
    wall_top   = base_y - H
    draw.rectangle([wall_left, wall_top, wall_right, base_y],
                   fill=(70, 30, 110))

    # Wall battlements (top edge, middle)
    bx = wall_left + int(10*s)
    while bx + BW < wall_right - int(10*s):
        draw.rectangle([bx, wall_top - BH, bx + BW, wall_top],
                       fill=(90, 40, 140))
        bx += BW + BS

    # Left tower
    lt = cx - W//2 - TW//2
    draw.rectangle([lt, base_y - TH, lt + TW, base_y], fill=(55, 20, 95))
    # Left tower battlements
    bx2 = lt
    while bx2 + BW < lt + TW:
        draw.rectangle([bx2, base_y-TH-BH, bx2+BW, base_y-TH],
                       fill=(75, 30, 120))
        bx2 += BW + BS

    # Right tower
    rt = cx + W//2 - TW//2
    draw.rectangle([rt, base_y - TH, rt + TW, base_y], fill=(55, 20, 95))
    bx3 = rt
    while bx3 + BW < rt + TW:
        draw.rectangle([bx3, base_y-TH-BH, bx3+BW, base_y-TH],
                       fill=(75, 30, 120))
        bx3 += BW + BS

    # Gate arch (dark opening)
    gx = cx - MW//2
    gy = base_y - MH
    draw.rectangle([gx, gy, gx+MW, base_y], fill=(15, 5, 30))
    # Arch top: filled semicircle
    arc_r = MW // 2
    draw.ellipse([gx, gy - arc_r, gx+MW, gy+arc_r], fill=(15,5,30))

    # Gold trim on towers
    for tx in [lt, rt]:
        for row in range(3):
            y0 = base_y - int(80*s) - row*int(60*s)
            draw.rectangle([tx, y0, tx+TW, y0+int(8*s)], fill=GOLD2)

    # Gold trim on main wall
    draw.rectangle([wall_left, wall_top+int(10*s),
                    wall_right, wall_top+int(18*s)], fill=GOLD2)

    # Windows on towers (small glowing slits)
    for tx in [lt, rt]:
        for wrow in range(2):
            wy = base_y - int(130*s) - wrow*int(80*s)
            wx = tx + TW//2 - int(8*s)
            draw.rectangle([wx, wy, wx+int(16*s), wy+int(30*s)],
                           fill=(255,200,80,220))


def draw_crown(img, cx, cy, size=1.0):
    """Draws a gold crown centered at (cx,cy)."""
    draw = ImageDraw.Draw(img)
    s = size
    W  = int(200*s)
    H  = int(100*s)
    PT = int(60*s)   # point height above band

    # Crown band base
    x0, y0 = cx - W//2, cy
    x1, y1 = cx + W//2, cy + H

    # 5 points: base at y0, tips alternating up
    pts = []
    n_pts = 5
    for i in range(n_pts):
        fx = x0 + (W/(n_pts-1))*i
        if i % 2 == 0:
            pts.append((int(fx), int(y0 - PT)))
        else:
            pts.append((int(fx), int(y0 - PT//3)))

    # Fill crown shape as polygon
    poly = [(x0, y1), (x1, y1), (x1, y0)] + list(reversed(pts)) + [(x0, y0)]
    draw.polygon(poly, fill=GOLD)

    # Outline
    draw.polygon(poly, outline=CROWN_OUT)

    # Gems on crown tips
    gem_colors = [(255,50,50), (50,150,255), (50,220,100),
                  (255,200,50), (200,50,200)]
    for i, (gx, gy) in enumerate(pts):
        if i % 2 == 0:
            gr = int(14*s)
            col = gem_colors[i % len(gem_colors)]
            draw.ellipse([gx-gr, gy-gr, gx+gr, gy+gr], fill=col,
                         outline=(255,255,255,180))

    # Band highlight
    draw.rectangle([x0+4, y1-int(18*s), x1-4, y1-4],
                   fill=(255,230,80))


# ══════════════════════════════════════════════════════════════════════════════
# ICON  (1024×1024)
# ══════════════════════════════════════════════════════════════════════════════
def make_icon(size=1024, path=None):
    img = Image.new("RGBA", (size, size), (0,0,0,0))
    draw = ImageDraw.Draw(img)

    s = size / 1024

    # Background gradient circle (rounded icon)
    bg = Image.new("RGBA", (size, size), (0,0,0,0))
    bg_d = ImageDraw.Draw(bg)
    vertical_gradient(bg_d, size, size, BG_TOP, BG_BOT)
    # Circular mask
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse([0,0,size-1,size-1], fill=255)
    bg.putalpha(mask)
    img.alpha_composite(bg)

    draw = ImageDraw.Draw(img)
    draw_stars_bg(draw, size, size, n=80)

    # Castle
    draw_castle(img, size//2, int(820*s), scale=s*0.88)

    # Crown above castle
    draw_crown(img, size//2, int(260*s), size=s*1.1)

    # Orbiting bubbles around crown
    orbit_r = int(310*s)
    n_orb = 8
    for i in range(n_orb):
        angle = (2*math.pi/n_orb)*i
        bx = size//2 + int(orbit_r * math.cos(angle))
        by = int(360*s) + int(orbit_r * 0.45 * math.sin(angle))
        br = int((28 + 10*abs(math.sin(angle)))*s)
        col = BUBBLE_COLORS[i % len(BUBBLE_COLORS)]
        draw_bubble((img, ImageDraw.Draw(img)), bx, by, br, col, alpha=210)

    # Soft vignette
    vig = Image.new("RGBA", (size, size), (0,0,0,0))
    vig_d = ImageDraw.Draw(vig)
    for r_step in range(60):
        t = r_step/60
        a = int(t * 90)
        rr = size//2 - r_step*(size//120)
        vig_d.ellipse([size//2-rr, size//2-rr, size//2+rr, size//2+rr],
                      outline=(0,0,0,a), width=size//120)
    img.alpha_composite(vig)

    if path:
        img.save(path)
    return img


# ══════════════════════════════════════════════════════════════════════════════
# SPLASH  (1080×1920)
# ══════════════════════════════════════════════════════════════════════════════
def make_splash(w=1080, h=1920, path=None):
    img = Image.new("RGBA", (w, h), (0,0,0,255))
    draw = ImageDraw.Draw(img)

    sx = w / 1080
    sy = h / 1920

    vertical_gradient(draw, w, h, BG_TOP, (80, 10, 120))
    draw_stars_bg(draw, w, h, n=180)

    # Ground strip
    draw.rectangle([0, int(1580*sy), w, h], fill=(30, 8, 60))
    draw.rectangle([0, int(1575*sy), w, int(1585*sy)], fill=GOLD2)

    # Castle (large, bottom half)
    draw_castle(img, w//2, int(1580*sy), scale=sx*1.35)

    # Crown (centred upper area)
    draw_crown(img, w//2, int(430*sy), size=sx*1.6)

    # Large title bubbles ring
    ring_r = int(340*sx)
    ring_cy = int(750*sy)
    n_b = 10
    for i in range(n_b):
        angle = (2*math.pi/n_b)*i - math.pi/2
        bx = w//2 + int(ring_r * math.cos(angle))
        by = ring_cy + int(ring_r * 0.4 * math.sin(angle))
        br = int((38 + 14*abs(math.sin(angle)))*sx)
        col = BUBBLE_COLORS[i % len(BUBBLE_COLORS)]
        draw_bubble((img, ImageDraw.Draw(img)), bx, by, br, col, alpha=215)

    # Extra floating bubbles
    extras = [
        (int(120*sx), int(300*sy), 22, 0),
        (int(960*sx), int(250*sy), 28, 3),
        (int(80*sx),  int(900*sy), 18, 1),
        (int(1010*sx),int(850*sy), 24, 5),
        (int(200*sx), int(1350*sy),20, 7),
        (int(900*sx), int(1380*sy),26, 2),
    ]
    for (ex, ey, er, ci) in extras:
        draw_bubble((img, ImageDraw.Draw(img)), ex, ey,
                    int(er*sx), BUBBLE_COLORS[ci], alpha=190)

    # Title text — "Bubble Kingdom" in two lines
    try:
        font_big  = ImageFont.truetype("arial.ttf", int(110*sx))
        font_sub  = ImageFont.truetype("arial.ttf", int(54*sx))
    except:
        font_big  = ImageFont.load_default()
        font_sub  = font_big

    draw2 = ImageDraw.Draw(img)
    # Shadow
    draw2.text((w//2+4, int(988*sy)+4), "Bubble", font=font_big,
               fill=(0,0,0,160), anchor="mm")
    draw2.text((w//2+4, int(1108*sy)+4), "Kingdom", font=font_big,
               fill=(0,0,0,160), anchor="mm")
    # Main text
    draw2.text((w//2, int(988*sy)), "Bubble", font=font_big,
               fill=(255,255,255,255), anchor="mm")
    draw2.text((w//2, int(1108*sy)), "Kingdom", font=font_big,
               fill=(*GOLD, 255), anchor="mm")
    draw2.text((w//2, int(1198*sy)), "✨ Pop · Match · Reign ✨", font=font_sub,
               fill=(220,200,255,200), anchor="mm")

    if path:
        # Save as RGB PNG (no alpha) for splash compatibility
        img.convert("RGB").save(path)
    return img


# ── Generate all files ────────────────────────────────────────────────────────
print("Generating icon.png …")
icon = make_icon(1024)
icon.save(f"{OUT}/icon.png")

print("Generating adaptive-icon.png …")
# Adaptive icon: same art but on plain dark bg (no circle mask)
aicon = Image.new("RGBA", (1024,1024), (*BG_TOP, 255))
ad = ImageDraw.Draw(aicon)
draw_stars_bg(ad, 1024, 1024, n=80)
draw_castle(aicon, 512, 820, scale=0.88)
draw_crown(aicon, 512, 260, size=1.1)
ring_r = 310
for i in range(8):
    angle = (2*math.pi/8)*i
    bx = 512 + int(ring_r * math.cos(angle))
    by = 360  + int(ring_r * 0.45 * math.sin(angle))
    br = int(28 + 10*abs(math.sin(angle)))
    draw_bubble((aicon, ImageDraw.Draw(aicon)), bx, by, br,
                BUBBLE_COLORS[i%len(BUBBLE_COLORS)], alpha=210)
aicon.save(f"{OUT}/adaptive-icon.png")

print("Generating splash.png …")
make_splash(1080, 1920, f"{OUT}/splash.png")

print("Generating bubble-kingdom-icon-master.png …")
make_icon(1024, f"{OUT}/bubble-kingdom-icon-master.png")

print("Generating bubble-kingdom-splash-master.png …")
make_splash(1080, 1920, f"{OUT}/bubble-kingdom-splash-master.png")

print("Done!")
