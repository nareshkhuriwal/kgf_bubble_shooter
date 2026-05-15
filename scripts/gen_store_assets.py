"""
Generates Play Store assets:
  1. play-store-icon.png   — 512×512, <1 MB
  2. feature-graphic.png   — 1024×500, current castle theme
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, math, random

ASSETS = os.path.join(os.path.dirname(__file__), '../assets')

GOLD     = (255, 215,   0)
GOLD2    = (184, 134,  11)
WHITE    = (255, 255, 255)
RED_HI   = (255,  26,  26)
RED_DARK = (139,   0,   0)

BUBBLE_COLORS = [
    [(255, 71, 87),(220, 40, 60)],
    [(47,134,235),(30,100,200)],
    [(46,213,115),(20,180, 80)],
    [(255,215,  0),(220,170,  0)],
    [(180, 80,200),(140, 50,170)],
    [(255,107, 53),(220, 70, 20)],
    [(255,105,180),(220, 60,150)],
    [(  0,206,209),(  0,160,170)],
]

# ── Helpers ───────────────────────────────────────────────────────────────────
def get_font(size, bold=True):
    for p in [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]:
        try: return ImageFont.truetype(p, size)
        except: pass
    return ImageFont.load_default()

def emoji_font(size):
    try: return ImageFont.truetype("/System/Library/Fonts/Apple Color Emoji.ttc", size)
    except: return get_font(size)

def make_gradient_multi(w, h, stops):
    img  = Image.new('RGB', (w, h))
    draw = ImageDraw.Draw(img)
    n    = len(stops) - 1
    for y in range(h):
        t    = y / h * n
        i    = min(int(t), n - 1)
        frac = t - i
        c0, c1 = stops[i], stops[i + 1]
        r = int(c0[0] + (c1[0] - c0[0]) * frac)
        g = int(c0[1] + (c1[1] - c0[1]) * frac)
        b = int(c0[2] + (c1[2] - c0[2]) * frac)
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    return img

def draw_bubble(draw, cx, cy, r, cp):
    inner, outer = cp[0], cp[1]
    for i in range(7, 0, -1):
        g = tuple(min(255, int(c * 1.25)) for c in outer)
        draw.ellipse([cx-r-i, cy-r-i, cx+r+i, cy+r+i], outline=g)
    draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=inner)
    hr = max(3, r // 3)
    draw.ellipse([cx-r//3-hr, cy-r//3-hr, cx-r//3+hr, cy-r//3+hr], fill=WHITE)

def add_stars(draw, w, h, count=60, seed=99):
    random.seed(seed)
    for _ in range(count):
        x  = random.randint(0, w)
        y  = random.randint(0, h)
        s  = random.choice([1, 1, 2])
        br = random.randint(160, 255)
        draw.ellipse([x-s, y-s, x+s, y+s], fill=(br, br, br))

def text_cx(draw, W, y, txt, fnt, color):
    bb = draw.textbbox((0, 0), txt, font=fnt)
    draw.text(((W - (bb[2]-bb[0]))//2, y), txt, fill=color, font=fnt)

def shadow_cx(draw, W, y, txt, fnt, color, shadow=(0,0,0), off=2):
    bb = draw.textbbox((0, 0), txt, font=fnt)
    x  = (W - (bb[2]-bb[0]))//2
    draw.text((x+off, y+off), txt, fill=shadow, font=fnt)
    draw.text((x, y), txt, fill=color, font=fnt)


# ══════════════════════════════════════════════════════════════════════════════
# 1. PLAY STORE ICON  512×512
# ══════════════════════════════════════════════════════════════════════════════
def gen_icon():
    W = H = 512
    out_path = os.path.join(ASSETS, 'play-store-icon.png')

    # Try to resize the existing master icon first
    master = os.path.join(ASSETS, 'kgf-orbito-icon-master.png')
    if os.path.exists(master):
        img = Image.open(master).convert('RGBA')
        img = img.resize((W, H), Image.LANCZOS)
        # Save with optimisation to stay under 1 MB
        img.save(out_path, 'PNG', optimize=True)
        size_kb = os.path.getsize(out_path) // 1024
        print(f"Icon from master: {W}x{H}, {size_kb} KB → {out_path}")
        if size_kb <= 1024:
            return
        # If still too big, fall through to generate

    # ── Generated icon (fallback / standalone) ────────────────────────────────
    img  = make_gradient_multi(W, H, [(8,0,48),(30,8,96),(90,24,0)])
    draw = ImageDraw.Draw(img)

    # Radial purple glow
    glow = Image.new('RGBA', (W, H), (0,0,0,0))
    gd   = ImageDraw.Draw(glow)
    for r in range(220, 0, -1):
        a = int(80 * (1 - r/220) * (r/220))
        gd.ellipse([W//2-r, H//2-r-40, W//2+r, H//2+r-40], fill=(96,32,192,a))
    img.paste(glow, (0, 0), glow)

    add_stars(draw, W, H, 50)

    # Castle battlement top
    bw, bh, gap = 28, 24, 12
    for bx in range(0, W, bw+gap):
        draw.rectangle([bx, 0, bx+bw, bh], fill=(14,5,26))
    draw.rectangle([0, bh, W, bh+3], fill=(*GOLD2,))

    # Crown jewel bubbles (arc of 5)
    bubble_layout = [
        (W//2,       130, BUBBLE_COLORS[0], 38),
        (W//2 - 90,  170, BUBBLE_COLORS[1], 32),
        (W//2 + 90,  170, BUBBLE_COLORS[2], 32),
        (W//2 - 170, 224, BUBBLE_COLORS[3], 26),
        (W//2 + 170, 224, BUBBLE_COLORS[4], 26),
    ]
    for cx, cy, color, r in bubble_layout:
        draw_bubble(draw, cx, cy, r, color)

    # Castle arch / gate
    arch_y = 230
    draw.rectangle([W//2-80, arch_y, W//2+80, H-60], fill=(14,5,26))
    draw.ellipse([W//2-80, arch_y-60, W//2+80, arch_y+60], fill=(14,5,26))
    draw.rectangle([W//2-80, arch_y, W//2+80, arch_y+3], fill=(*GOLD2,))

    # Title text
    shadow_cx(draw, W, 310, 'BUBBLE', get_font(68), WHITE, shadow=(0,0,0))
    shadow_cx(draw, W, 378, 'KINGDOM', get_font(68), GOLD, shadow=(0,0,0))

    # Gold border ring
    draw.rounded_rectangle([6, 6, W-6, H-6], radius=32,
                           outline=(*GOLD,), width=4)

    img.save(out_path, 'PNG', optimize=True)
    size_kb = os.path.getsize(out_path) // 1024
    print(f"Icon generated: {W}x{H}, {size_kb} KB → {out_path}")


# ══════════════════════════════════════════════════════════════════════════════
# 2. FEATURE GRAPHIC  1024×500
# ══════════════════════════════════════════════════════════════════════════════
def gen_feature_graphic():
    W, H = 1024, 500
    out_path = os.path.join(ASSETS, 'feature-graphic.png')

    # Background
    img  = make_gradient_multi(W, H, [(8,0,48),(19,0,80),(30,8,96),(90,24,0)])
    draw = ImageDraw.Draw(img)
    add_stars(draw, W, H, 80, seed=55)

    # Purple radial centre glow
    glow = Image.new('RGBA', (W, H), (0,0,0,0))
    gd   = ImageDraw.Draw(glow)
    for r in range(260, 0, -1):
        a = int(55 * (1 - r/260) * (r/260))
        gd.ellipse([W//2-r, H//2-r-30, W//2+r, H//2+r-30], fill=(96,32,192,a))
    img.paste(glow, (0,0), glow)

    # ── Left side: castle tower decoration ───────────────────────────────────
    TW, TH = 58, H
    stone = make_gradient_multi(TW, TH, [(14,5,26),(20,6,58),(14,5,26)])
    img.paste(stone, (0, 0))
    bw2, bh2, gap2 = 12, 16, 8
    for bx in range(0, TW, bw2+gap2):
        draw.rectangle([bx, 0, bx+bw2, bh2], fill=(8,2,16))
    draw.rectangle([0, bh2, TW, bh2+2], fill=(*GOLD2,))
    for wy in [60, 120, 190, 270]:
        draw.rounded_rectangle([18, wy, 30, wy+22], radius=5, fill=(58,24,0))
        draw.rounded_rectangle([18, wy, 30, wy+22], radius=5, fill=(255,140,0,70))

    # Right tower
    img.paste(stone, (W-TW, 0))
    for bx in range(0, TW, bw2+gap2):
        draw.rectangle([W-TW+bx, 0, W-TW+bx+bw2, bh2], fill=(8,2,16))
    draw.rectangle([W-TW, bh2, W, bh2+2], fill=(*GOLD2,))
    for wy in [60, 120, 190, 270]:
        draw.rounded_rectangle([W-30, wy, W-18, wy+22], radius=5, fill=(58,24,0))
        draw.rounded_rectangle([W-30, wy, W-18, wy+22], radius=5, fill=(255,140,0,70))

    # ── Centre: logo ─────────────────────────────────────────────────────────
    logo_path = os.path.join(ASSETS, 'kgf-orbito-icon-master.png')
    logo_placed = False
    try:
        logo = Image.open(logo_path).convert('RGBA')
        lh   = 340
        lw   = int(logo.width * lh / logo.height)
        logo = logo.resize((lw, lh), Image.LANCZOS)
        lx   = W//2 - lw//2
        ly   = H//2 - lh//2 - 30
        img.paste(logo, (lx, ly), logo)
        logo_placed = True
    except Exception as e:
        print(f"Logo load failed: {e}")

    if not logo_placed:
        shadow_cx(draw, W, 80, 'BUBBLE', get_font(96), WHITE)
        shadow_cx(draw, W, 182, 'KINGDOM', get_font(96), GOLD)

    # ── Bubble arc left ───────────────────────────────────────────────────────
    left_bubbles = [
        (128, 110, BUBBLE_COLORS[0], 30),
        ( 88, 178, BUBBLE_COLORS[2], 24),
        (148, 240, BUBBLE_COLORS[5], 20),
        (110, 300, BUBBLE_COLORS[7], 18),
        (170, 360, BUBBLE_COLORS[1], 22),
    ]
    for cx, cy, color, r in left_bubbles:
        draw_bubble(draw, cx, cy, r, color)

    # ── Bubble arc right ──────────────────────────────────────────────────────
    right_bubbles = [
        (W-128, 110, BUBBLE_COLORS[4], 30),
        (W- 88, 178, BUBBLE_COLORS[3], 24),
        (W-148, 240, BUBBLE_COLORS[6], 20),
        (W-110, 300, BUBBLE_COLORS[0], 18),
        (W-170, 360, BUBBLE_COLORS[2], 22),
    ]
    for cx, cy, color, r in right_bubbles:
        draw_bubble(draw, cx, cy, r, color)

    # ── Tagline banner at bottom ──────────────────────────────────────────────
    bar_h = 72
    bar = make_gradient_multi(W, bar_h, [(61,10,0),(107,24,0),(61,10,0)])
    img.paste(bar, (0, H - bar_h))
    draw.line([(0, H-bar_h), (W, H-bar_h)], fill=(*GOLD, 160), width=2)
    draw.line([(0, H-2),     (W, H-2)],     fill=(*GOLD2,),    width=2)

    tagline = '⚔️   Pop • Match • Conquer   ⚔️'
    shadow_cx(draw, W, H-bar_h+18, tagline, get_font(32), GOLD, shadow=(0,0,0,180))

    # ── Gold corner accents ───────────────────────────────────────────────────
    for (x1,y1,x2,y2) in [(0,0,40,3),(0,0,3,40),(W-40,0,W,3),(W-3,0,W,40),
                           (0,H-3,40,H),(0,H-40,3,H),(W-40,H-3,W,H),(W-3,H-40,W,H)]:
        draw.rectangle([x1,y1,x2,y2], fill=GOLD)

    img.save(out_path, 'PNG', optimize=True)
    size_kb = os.path.getsize(out_path) // 1024
    print(f"Feature graphic: {W}x{H}, {size_kb} KB → {out_path}")


gen_icon()
gen_feature_graphic()
print("Done.")
