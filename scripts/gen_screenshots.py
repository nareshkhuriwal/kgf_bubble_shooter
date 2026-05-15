from PIL import Image, ImageDraw, ImageFont
import math, os, random

W, H = 1080, 1920
OUT   = os.path.join(os.path.dirname(__file__), '../assets/screenshots')
os.makedirs(OUT, exist_ok=True)
ASSETS = os.path.join(os.path.dirname(__file__), '../assets')

# ── Palette (matches HomeScreen / LevelSelectScreen) ──────────────────────────
GOLD        = (255, 215,   0)
GOLD_DIM    = (184, 134,  11)
WHITE       = (255, 255, 255)
RED_HI      = (255,  26,  26)
RED_MID     = (208,   0,   0)
RED_DARK    = (139,   0,   0)
PURPLE_CARD = ( 28,   9,  69)
BG_HOME     = [(8,0,48),(19,0,80),(30,8,96),(42,13,20),(90,24,0)]
BG_LEVEL    = [(5,2,16),(14,6,32),(28,10,48),(45,13,16)]
BG_GAME     = (5, 5, 25)
BG_GAME_BOT = (30, 8, 60)

BUBBLE_COLORS = [
    [(255,71,87),(220,40,60)],
    [(47,134,235),(30,100,200)],
    [(46,213,115),(20,180,80)],
    [(255,215,0),(220,170,0)],
    [(180,80,200),(140,50,170)],
    [(255,107,53),(220,70,20)],
    [(255,105,180),(220,60,150)],
    [(0,206,209),(0,160,170)],
]

# ── Worlds (from src/data/levels.ts) ──────────────────────────────────────────
WORLDS = [
    { 'id':1, 'name':'The Village',  'label':'Peasant',    'range':(1,8),   'colors':((26,58,10),(74,124,47))   },
    { 'id':2, 'name':'The Fortress', 'label':'Knight',     'range':(9,16),  'colors':((42,26,14),(139,69,19))   },
    { 'id':3, 'name':'The Citadel',  'label':'Baron',      'range':(17,24), 'colors':((58,10,10),(192,57,43))   },
    { 'id':4, 'name':"Dragon's Keep",'label':'Dragon Lord','range':(25,32), 'colors':((26,10,46),(123,0,0))     },
]
WORLD_ICONS = ['🌿','🏰','🗡️','🐉']

# ── Fonts ──────────────────────────────────────────────────────────────────────
def font(size, bold=True):
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/Arial.ttf",
    ]
    for p in candidates:
        try: return ImageFont.truetype(p, size)
        except: pass
    return ImageFont.load_default()

def emoji_font(size):
    try: return ImageFont.truetype("/System/Library/Fonts/Apple Color Emoji.ttc", size)
    except: return font(size)

# ── Helpers ───────────────────────────────────────────────────────────────────
def make_gradient_multi(w, h, stops):
    img  = Image.new('RGB', (w, h))
    draw = ImageDraw.Draw(img)
    n    = len(stops) - 1
    for y in range(h):
        t     = y / h * n
        i     = min(int(t), n - 1)
        frac  = t - i
        c0, c1 = stops[i], stops[i+1]
        r = int(c0[0] + (c1[0]-c0[0]) * frac)
        g = int(c0[1] + (c1[1]-c0[1]) * frac)
        b = int(c0[2] + (c1[2]-c0[2]) * frac)
        draw.line([(0,y),(w,y)], fill=(r,g,b))
    return img

def make_gradient(w, h, top, bot):
    return make_gradient_multi(w, h, [top, bot])

def add_stars(draw, w, h, count=80, seed=42):
    random.seed(seed)
    for _ in range(count):
        x  = random.randint(0, w)
        y  = random.randint(0, int(h * 0.65))
        s  = random.choice([1, 1, 1, 2, 2, 3])
        br = random.randint(140, 255)
        op = random.uniform(0.25, 0.85)
        c  = int(br * op)
        draw.ellipse([x-s, y-s, x+s, y+s], fill=(c, c, c))

def draw_bubble(draw, cx, cy, r, cp):
    inner, outer = cp[0], cp[1]
    for i in range(7, 0, -1):
        glow = tuple(min(255, int(c * 1.25)) for c in outer)
        a    = max(10, 40 - i * 5)
        draw.ellipse([cx-r-i, cy-r-i, cx+r+i, cy+r+i], outline=glow)
    draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=inner)
    hr = max(4, r // 3)
    hx = cx - r//4 - hr
    hy = cy - r//3 - hr
    draw.ellipse([hx, hy, hx+hr*2, hy+hr*2], fill=(255,255,255))

def pill(draw, x1, y1, x2, y2, fill, outline=None, radius=30, width=3):
    draw.rounded_rectangle([x1, y1, x2, y2], radius=radius, fill=fill,
                           outline=outline, width=width)

def text_cx(draw, cx, y, txt, fnt, color):
    bb = draw.textbbox((0,0), txt, font=fnt)
    draw.text((cx - (bb[2]-bb[0])//2, y), txt, fill=color, font=fnt)

def shadow_cx(draw, cx, y, txt, fnt, color, shadow=(0,0,0), offset=3):
    bb = draw.textbbox((0,0), txt, font=fnt)
    x  = cx - (bb[2]-bb[0])//2
    draw.text((x+offset, y+offset), txt, fill=shadow, font=fnt)
    draw.text((x, y), txt, fill=color, font=fnt)

def centered(draw, y, txt, size, color, bold=True, shadow=None):
    fnt = font(size, bold)
    if shadow:
        shadow_cx(draw, W//2, y, txt, fnt, color, shadow)
    else:
        text_cx(draw, W//2, y, txt, fnt, color)

# ── Castle tower (side decoration) ───────────────────────────────────────────
def draw_tower(draw, img, x, flip=False):
    TW, TH = 66, int(H * 0.72)
    BW, BH, GAP = 14, 18, 10
    stone = (14, 5, 26)
    stone2 = (20, 6, 58)
    # body gradient
    tower_img = make_gradient(TW, TH, stone, stone2)
    img.paste(tower_img, (x, BH))
    # battlements
    bx = x
    while bx < x + TW - BW:
        draw.rectangle([bx, 0, bx+BW, BH+4], fill=(14, 3, 26))
        bx += BW + GAP
    # gold trim
    draw.rectangle([x, BH+4, x+TW, BH+6], fill=(*GOLD_DIM, 128))
    # windows
    for wy in [BH+30, BH+80]:
        draw.rounded_rectangle([x+TW//4, wy, x+TW//4+12, wy+18], radius=6, fill=(58,24,0))
        draw.rounded_rectangle([x+TW//4, wy, x+TW//4+12, wy+18], radius=6, fill=(255,140,0, 90))
    # flag
    fx = x + (TW//3 if not flip else int(TW*0.65))
    draw.rectangle([fx, BH+6, fx+3, BH+40], fill=(90,0,0))
    if not flip:
        draw.polygon([(fx, BH+6),(fx+22, BH+17),(fx, BH+28)], fill=(155,0,0))
    else:
        draw.polygon([(fx+3, BH+6),(fx+3-22, BH+17),(fx+3, BH+28)], fill=(155,0,0))

# ── Bottom castle wall ────────────────────────────────────────────────────────
def draw_bottom_castle(draw, img):
    h   = 110
    cx  = W // 2
    ww  = int(W * 0.52)
    wt  = h - 52
    wall = make_gradient(ww, h - wt, (20, 8, 48), (10, 3, 24))
    img.paste(wall, (cx - ww//2, H - h + wt))
    BW, BH, BG = 14, 10, 8
    for n in [-3, -1, 1, 3]:
        bx = cx + n*(BW+BG) - BW//2
        draw.rectangle([bx, H-h+wt-BH, bx+BW, H-h+wt], fill=(20,8,48))
    # gate arch
    draw.rectangle([cx-22, H-h+wt+12, cx+22, H-4], fill=(5,2,16))
    draw.ellipse([cx-22, H-h+wt+0, cx+22, H-h+wt+24], fill=(5,2,16))
    # gold trim
    draw.line([(cx-ww//2, H-h+wt-2),(cx+ww//2, H-h+wt-2)], fill=(*GOLD_DIM,), width=2)
    draw.line([(0, H-4),(W, H-4)], fill=(*GOLD_DIM,), width=3)

# ── Top badge strip ───────────────────────────────────────────────────────────
def draw_top_badges(draw, img):
    # Glory badge (left)
    pill(draw, 14, 42, 220, 97, fill=(70,20,5), outline=(*GOLD,), radius=28)
    fnt_ico = emoji_font(22)
    fnt_val = font(22)
    fnt_lbl = font(12)
    draw.text((26, 56), '👑', font=fnt_ico)
    draw.text((62, 54), '48', fill=GOLD, font=fnt_val)
    draw.text((95, 57), '/96', fill=(255,255,255,100), font=font(14))
    draw.text((62, 76), 'GLORY', fill=(*GOLD, 165), font=fnt_lbl)

    # Coin badge (right)
    pill(draw, W-220, 42, W-14, 97, fill=(55,18,0), outline=(*GOLD,), radius=28)
    draw.text((W-208, 56), '🪙', font=fnt_ico)
    draw.text((W-168, 54), '1,250', fill=GOLD, font=font(20))

# ── Nav bar ───────────────────────────────────────────────────────────────────
def draw_nav_bar(draw, img):
    bar = make_gradient(W, 68, (14,5,35), (8,2,20))
    img.paste(bar, (0, H-68))
    draw.line([(0, H-68),(W, H-68)], fill=(*GOLD_DIM, 64), width=1)
    icons = ['🏰','🛡️','⚔️','🏆','⚙️']
    fnt   = emoji_font(26)
    for i, ic in enumerate(icons):
        cx = W//5 * i + W//10
        bb = draw.textbbox((0,0), ic, font=fnt)
        x  = cx - (bb[2]-bb[0])//2
        draw.text((x, H-54), ic, font=fnt, fill=(255,255,255,255) if i==0 else (255,255,255,100))
    # active dot under castle
    cx = W//10
    draw.ellipse([cx-3, H-10, cx+3, H-4], fill=GOLD)


# ══════════════════════════════════════════════════════════════════════════════
# SCREENSHOT 1 — Home Screen
# ══════════════════════════════════════════════════════════════════════════════
def screenshot_1():
    img  = make_gradient_multi(W, H, BG_HOME)
    draw = ImageDraw.Draw(img)
    add_stars(draw, W, H, 90)

    # Side towers
    draw_tower(draw, img,   -4, flip=False)
    draw_tower(draw, img, W-62, flip=True)
    draw_bottom_castle(draw, img)

    # Purple radial glow (centre)
    glow = Image.new('RGBA', (W, int(H*0.55)), (0,0,0,0))
    gd   = ImageDraw.Draw(glow)
    for r in range(300, 0, -1):
        a = int(46 * (1 - r/300) * (r/300))
        gd.ellipse([W//2-r, 0, W//2+r, r*2], fill=(96,32,192,a))
    img.paste(glow, (0, 0), glow)

    # Load logo
    logo_path = os.path.join(ASSETS, 'kgf-orbito-icon-master.png')
    try:
        logo = Image.open(logo_path).convert('RGBA')
        lw   = int(W * 0.82)
        lh   = int(logo.height * lw / logo.width)
        logo = logo.resize((lw, lh), Image.LANCZOS)
        img.paste(logo, ((W-lw)//2, 88), logo)
        logo_bottom = 88 + lh
    except Exception as e:
        print(f"Logo load failed: {e}")
        shadow_cx(draw, W//2, 120, "Bubble", font(110), WHITE, shadow=(0,0,0))
        shadow_cx(draw, W//2, 240, "Kingdom", font(110), GOLD, shadow=(0,0,0))
        logo_bottom = 380

    y = logo_bottom + 10

    # Greatest Glory card
    card_h = 100
    pill(draw, 80, y, W-80, y+card_h, fill=(15,4,32), outline=(*GOLD,), radius=20)
    draw.line([(80, y),(W-80, y)], fill=(*GOLD, 115), width=2)
    text_cx(draw, W//2, y+12, 'GREATEST GLORY', font(22, False), (*GOLD, 165))
    shadow_cx(draw, W//2, y+38, '124,800', font(52), WHITE, shadow=(0,0,0,0))
    y += card_h + 18

    # BATTLE! button
    btn_w = int(W * 0.82)
    bx    = (W - btn_w)//2
    # Red gradient (simulate multi-stop)
    btn_h = 100
    for row in range(btn_h):
        t  = row / btn_h
        r_ = int(RED_HI[0] + (RED_DARK[0]-RED_HI[0])*t)
        g_ = int(RED_HI[1] + (RED_DARK[1]-RED_HI[1])*t)
        b_ = int(RED_HI[2] + (RED_DARK[2]-RED_HI[2])*t)
        draw.line([(bx, y+row),(bx+btn_w, y+row)], fill=(r_,g_,b_))
    # Clip to rounded rect
    mask = Image.new('L', (W, H), 0)
    ImageDraw.Draw(mask).rounded_rectangle([bx, y, bx+btn_w, y+btn_h], radius=44, fill=255)
    # Gold border
    draw.rounded_rectangle([bx, y, bx+btn_w, y+btn_h], radius=44, outline=(*GOLD,), width=3)
    # Sheen
    sheen = Image.new('RGBA', (W, H), (0,0,0,0))
    ImageDraw.Draw(sheen).rounded_rectangle([bx, y, bx+btn_w, y+btn_h//2], radius=44, fill=(255,255,255,30))
    img.paste(sheen, (0,0), sheen)
    shadow_cx(draw, W//2, y+24, '⚔️   BATTLE!', font(42), WHITE, shadow=(0,0,0))
    y += btn_h + 20

    # Three mini cards
    card_count = 3
    cw   = (int(W*0.88) - 16) // card_count
    cx0  = (W - int(W*0.88))//2
    mini_data = [
        ('🗺️','KINGDOM MAP','👑 48/96'),
        ('💰','TREASURY','🔥 Streak 7'),
        ('🎁','DAILY REWARD','Claim gift!'),
    ]
    card_height = 128
    fnt_lbl2 = font(18)
    fnt_sub  = font(16, False)
    for i, (ico, lbl, sub) in enumerate(mini_data):
        x1 = cx0 + i*(cw+8)
        x2 = x1 + cw
        pill(draw, x1, y, x2, y+card_height, fill=PURPLE_CARD, outline=(*GOLD, 46), radius=18)
        # sheen
        sheen2 = Image.new('RGBA', (W, H), (0,0,0,0))
        ImageDraw.Draw(sheen2).rounded_rectangle([x1, y, x2, y+card_height//2], radius=18, fill=(255,255,255,12))
        img.paste(sheen2, (0,0), sheen2)
        ef = emoji_font(30)
        ebl = draw.textbbox((0,0), ico, font=ef)
        ex  = (x1+x2)//2 - (ebl[2]-ebl[0])//2
        draw.text((ex, y+14), ico, font=ef)
        text_cx(draw, (x1+x2)//2, y+58, lbl, fnt_lbl2, WHITE)
        text_cx(draw, (x1+x2)//2, y+82, sub, fnt_sub, (*GOLD, 184))
        # arrow
        draw.rounded_rectangle([(x1+x2)//2-22, y+104, (x1+x2)//2+22, y+120], radius=6, fill=(*GOLD, 30))
        text_cx(draw, (x1+x2)//2, y+104, '→', font(14), (*GOLD, 178))
    y += card_height + 20

    # Battle guide box
    guide_h = 168
    pill(draw, 80, y, W-80, y+guide_h, fill=(22,6,52), outline=(*GOLD, 56), radius=20)
    # Divider title
    draw.line([(96, y+28),(300, y+28)], fill=(*GOLD, 64), width=1)
    text_cx(draw, W//2, y+18, '✦  BATTLE GUIDE  ✦', font(22), GOLD)
    draw.line([(W-300, y+28),(W-96, y+28)], fill=(*GOLD, 64), width=1)
    guide_rows = [
        ('⚔️','Tap to aim & launch gems'),
        ('💎','Match 3 gems to BLAST!'),
        ('🔥','Chain combos for glory'),
        ('👑','Earn up to 3 crowns per battle'),
    ]
    fnt_gr  = font(28, False)
    fnt_eml = emoji_font(24)
    for i, (ic, tx) in enumerate(guide_rows):
        ry = y+52+i*28
        draw.text((100, ry), ic, font=fnt_eml)
        draw.text((140, ry), tx, fill=(255,218,170,230), font=fnt_gr)
    draw.text((W-156, y+38), '🧑‍⚔️', font=emoji_font(72))

    # Top badges + nav
    draw_top_badges(draw, img)
    draw_nav_bar(draw, img)

    img.save(os.path.join(OUT, 'screenshot_1_home.png'))
    print("Screenshot 1 done")


# ══════════════════════════════════════════════════════════════════════════════
# SCREENSHOT 2 — Gameplay
# ══════════════════════════════════════════════════════════════════════════════
def screenshot_2():
    img  = make_gradient(W, H, BG_GAME, BG_GAME_BOT)
    draw = ImageDraw.Draw(img)
    add_stars(draw, W, H, 100)

    # Stone arch frame top
    arch_h = 40
    arch = make_gradient(W, arch_h, (20,10,50), (10,5,30))
    img.paste(arch, (0, 0))

    # HUD bar
    pill(draw, 28, 56, W-28, 168, fill=(20,15,50), outline=(83,52,131), radius=22)
    fnt_hud = font(34, False)
    text_cx(draw, W//2, 76, 'BATTLE  5', fnt_hud, WHITE)
    # Score row
    score_row = '⭐  Score: 4,800    💥  Combo ×3'
    text_cx(draw, W//2, 118, score_row, font(30, False), (*GOLD, 210))

    # Bubble grid (8 cols × 7 rows, hex offset)
    cols, rows = 8, 7
    br   = 56
    grid_w = cols * br * 2
    ox   = (W - grid_w) // 2 + br
    oy   = 210

    random.seed(7)
    for row in range(rows):
        ncols = cols if row % 2 == 0 else cols - 1
        extra = 0 if row % 2 == 0 else br
        for col in range(ncols):
            cx = ox + extra + col * br * 2
            cy = oy + row * int(br * 1.75)
            draw_bubble(draw, cx, cy, br-4, BUBBLE_COLORS[random.randint(0,7)])

    # Stone arch frame above grid
    for side_x in [0, W-10]:
        draw.rectangle([side_x, oy-10, side_x+10, oy+rows*int(br*1.75)+20], fill=(15,8,35))
    draw.rectangle([0, oy-10, W, oy-2], fill=(25,12,55))

    # Aim line (dashed, white-blue)
    ax, ay = W//2, H - 240
    for i in range(22):
        y1 = ay - i*55
        y2 = y1 - 36
        alpha = max(40, 240 - i*12)
        c  = (alpha, alpha, 255)
        draw.line([(ax, y1),(ax, y2)], fill=c, width=4)

    # Danger vignette
    vign = Image.new('RGBA', (W, H), (0,0,0,0))
    vd   = ImageDraw.Draw(vign)
    for i in range(60):
        a = int(80 * i/60)
        vd.rectangle([i, i, W-i, H-i], outline=(180,0,0,a))
    img.paste(vign, (0,0), vign)

    # Cannon base
    cannon_y = H - 250
    draw.ellipse([W//2-70, cannon_y-70, W//2+70, cannon_y+70], fill=(60,40,100), outline=GOLD, width=4)
    # Barrel
    barrel_len = 140
    draw.rectangle([W//2-20, cannon_y-barrel_len-70, W//2+20, cannon_y-62], fill=(80,60,120), outline=GOLD, width=3)
    # Current bubble in cannon
    draw_bubble(draw, W//2, cannon_y, 44, BUBBLE_COLORS[3])

    # NEXT label + bubble
    text_cx(draw, W//2, H-176, 'NEXT', font(34, False), (180,180,255))
    draw_bubble(draw, W//2, H-116, 38, BUBBLE_COLORS[0])

    # Shots left badge
    pill(draw, 48, H-196, 248, H-124, fill=(20,15,50), outline=(83,52,131), radius=18)
    text_cx(draw, 148, H-182, '🎯  18', font(44), WHITE)

    # Power-up quick bar (bottom right)
    pu_icons = ['⚔️','🔮','🔥']
    puf      = emoji_font(36)
    for i, pu in enumerate(pu_icons):
        px = W - 220 + i * 72
        draw.ellipse([px-28, H-196, px+28, H-140], fill=(28,9,69), outline=(*GOLD, 100), width=2)
        bb = draw.textbbox((0,0), pu, font=puf)
        draw.text((px-(bb[2]-bb[0])//2, H-190), pu, font=puf)

    img.save(os.path.join(OUT, 'screenshot_2_gameplay.png'))
    print("Screenshot 2 done")


# ══════════════════════════════════════════════════════════════════════════════
# SCREENSHOT 3 — Power-ups (8 total, 2×4 grid)
# ══════════════════════════════════════════════════════════════════════════════
def screenshot_3():
    img  = make_gradient(W, H, (5,5,25), (50,10,80))
    draw = ImageDraw.Draw(img)
    add_stars(draw, W, H)

    shadow_cx(draw, W//2, 80,  'POWER-UPS', font(90), GOLD, shadow=(0,0,0))
    text_cx(draw, W//2, 196, 'Unleash epic battle weapons!', font(44, False), (200,200,255))

    powerups = [
        ('⚔️',  'SWORD',     'Destroys nearby gems',       (220,  50, 50)),
        ('🔮',  'RAINBOW',   'Pops all of one colour',      (150,  80,220)),
        ('🔥',  'FIRE',      'Blasts the entire row',       (255, 100, 20)),
        ('⚡',  'LIGHTNING', 'Zaps 9 random gems',          (255, 220,  0)),
        ('❄️',  'FREEZE',    'Stops gems in their tracks',  ( 80, 200,240)),
        ('🏹',  'ARROW',     'Clears a full column',        ( 50, 150,255)),
        ('☄️',  'METEOR',    'Wipes out a large area',      (255, 120,  0)),
        ('💫',  'STAR BURST','Chain-pops all combos',       (220, 180,255)),
    ]

    cols, card_w, card_h = 2, 480, 370
    pad_x = (W - cols * card_w - 20) // 2

    for i, (emoji, name, desc, color) in enumerate(powerups):
        col = i % 2
        row = i // 2
        x1  = pad_x + col * (card_w + 20)
        y1  = 290  + row * (card_h + 14)
        x2  = x1 + card_w
        y2  = y1 + card_h

        # Card bg
        pill(draw, x1, y1, x2, y2, fill=(15,10,40), outline=color, radius=28)
        # Sheen
        sheen = Image.new('RGBA', (W, H), (0,0,0,0))
        ImageDraw.Draw(sheen).rounded_rectangle([x1, y1, x2, y1+(y2-y1)//3], radius=28, fill=(255,255,255,14))
        img.paste(sheen, (0,0), sheen)

        cx = (x1+x2)//2

        # Emoji + bubble bg
        draw_bubble(draw, cx, y1+96, 66, [color, tuple(max(0,c-50) for c in color)])
        ef  = emoji_font(68)
        ebb = draw.textbbox((0,0), emoji, font=ef)
        draw.text((cx-(ebb[2]-ebb[0])//2, y1+56), emoji, font=ef)

        # Name
        nf = font(44)
        nb = draw.textbbox((0,0), name, font=nf)
        draw.text((cx-(nb[2]-nb[0])//2, y1+182), name, fill=color, font=nf)

        # Desc (word wrap over 2 lines)
        df   = font(30, False)
        words = desc.split()
        mid  = len(words)//2 if len(words) > 3 else len(words)
        lines = [' '.join(words[:mid]), ' '.join(words[mid:])]
        for li, ln in enumerate(lines):
            if ln:
                lb = draw.textbbox((0,0), ln, font=df)
                draw.text((cx-(lb[2]-lb[0])//2, y1+242+li*38), ln, fill=(200,200,220), font=df)

    img.save(os.path.join(OUT, 'screenshot_3_powerups.png'))
    print("Screenshot 3 done")


# ══════════════════════════════════════════════════════════════════════════════
# SCREENSHOT 4 — Kingdom Map / Level Select
# ══════════════════════════════════════════════════════════════════════════════
def screenshot_4():
    img  = make_gradient_multi(W, H, BG_LEVEL)
    draw = ImageDraw.Draw(img)
    add_stars(draw, W, H)

    # Header
    pill(draw, 0, 0, W, 140, fill=(8,3,20), radius=0)
    draw.line([(0,140),(W,140)], fill=(*GOLD_DIM, 80), width=1)
    text_cx(draw, W//2, 56, '🗺️  KINGDOM MAP', font(44), GOLD)
    draw.rectangle([(W//2-60, 106),(W//2+60, 108)], fill=(*GOLD_DIM, 90))

    # Royal Glory banner
    banner_top = 156
    banner_h   = 136
    banner     = make_gradient(W-80, banner_h, (61,10,0), (107,24,0))
    img.paste(banner, (40, banner_top))
    draw.rounded_rectangle([40, banner_top, W-40, banner_top+banner_h], radius=20, outline=(*GOLD, 115), width=2)
    draw.line([(40, banner_top),(W-40, banner_top)], fill=(*GOLD, 128), width=2)
    ef = emoji_font(32)
    draw.text((62, banner_top+18), '👑', font=ef)
    draw.text((W-110, banner_top+18), '👑', font=ef)
    text_cx(draw, W//2, banner_top+14, 'ROYAL GLORY', font(24, False), (*GOLD, 178))
    text_cx(draw, W//2, banner_top+42, '48', font(52), GOLD)
    text_cx(draw, W//2+40, banner_top+54, '/96', font(28, False), (255,255,255,115))
    # progress bar
    bar_x, bar_y, bar_w, bar_h = 80, banner_top+102, W-160, 12
    draw.rounded_rectangle([bar_x, bar_y, bar_x+bar_w, bar_y+bar_h], radius=6, fill=(255,255,255,20))
    fill_w = int(bar_w * 0.5)
    draw.rounded_rectangle([bar_x, bar_y, bar_x+fill_w, bar_y+bar_h], radius=6, fill=GOLD)
    text_cx(draw, W//2, banner_top+118, '⚔️  48 crowns left to claim', font(26, False), (255,220,150,165))

    # World rows
    y = banner_top + banner_h + 22
    for wi, world in enumerate(WORLDS):
        wc0, wc1 = world['colors']
        row_h = 298

        # World header bar
        hbar = make_gradient(W-80, 68, wc0, wc1)
        img.paste(hbar, (40, y))
        draw.rounded_rectangle([40, y, W-40, y+68], radius=14, outline=(*GOLD, 52), width=1)
        # icon bubble
        draw.ellipse([56, y+12, 100, y+56], fill=(0,0,0,90))
        draw.text((59, y+13), WORLD_ICONS[wi], font=emoji_font(32))
        draw.text((114, y+10), world['name'], fill=WHITE, font=font(32))
        draw.text((114, y+40), f"{world['label']}  ·  Battles {world['range'][0]}–{world['range'][1]}", fill=(255,220,150,178), font=font(24,False))
        # crown count badge
        pill(draw, W-160, y+12, W-48, y+56, fill=(0,0,0,102), outline=(*GOLD, 76), radius=14)
        text_cx(draw, W-104, y+20, f'👑 0/24', font(24, False), GOLD)
        y += 70

        # Level cards (2 per row, 4 levels)
        card_w2 = (W - 80 - 24) // 2
        levels_in_world = world['range'][1] - world['range'][0] + 1
        shown = min(levels_in_world, 4)
        for li in range(shown):
            lnum   = world['range'][0] + li
            col    = li % 2
            lrow   = li // 2
            cx2    = 40 + col * (card_w2 + 24)
            cy2    = y + lrow * (card_w2 * 0.72 + 14)
            ch     = int(card_w2 * 0.72)
            emoji  = ['⚔️','🛡️','🏰','🐉','💎','🏹','🔮','⚜️'][lnum % 8]
            unlocked = li < 2

            if unlocked:
                ccard = make_gradient(card_w2, ch, wc0, wc1)
                img.paste(ccard, (cx2, int(cy2)))
                draw.rounded_rectangle([cx2, int(cy2), cx2+card_w2, int(cy2)+ch], radius=16, outline=(*GOLD, 76), width=1)
                draw.text((cx2+16, int(cy2)+10), emoji, font=emoji_font(28))
                draw.text((cx2+card_w2-52, int(cy2)+10), str(lnum), fill=WHITE, font=font(30))
                # crowns
                cf = emoji_font(14)
                for ci in range(3):
                    crow = '👑' if ci == 0 else '♛'
                    bb   = draw.textbbox((0,0), crow, font=cf)
                    draw.text((cx2 + 16 + ci*22, int(cy2)+ch-30), crow, font=cf,
                              fill=(*GOLD, 255) if ci==0 else (255,255,255,50))
                draw.text((cx2+card_w2//2-30, int(cy2)+ch-26), 'CONQUERED', fill=GOLD, font=font(16))
            else:
                draw.rounded_rectangle([cx2, int(cy2), cx2+card_w2, int(cy2)+ch], radius=16,
                                       fill=(26,13,26), outline=(255,255,255,25), width=1)
                text_cx(draw, cx2+card_w2//2, int(cy2)+ch//2-22, '⛓️', emoji_font(28), WHITE)
                text_cx(draw, cx2+card_w2//2, int(cy2)+ch//2+10, 'LOCKED', font(20), (255,255,255,76))

        y += int((card_w2 * 0.72 + 14) * 2) + 14

    img.save(os.path.join(OUT, 'screenshot_4_worlds.png'))
    print("Screenshot 4 done")


screenshot_1()
screenshot_2()
screenshot_3()
screenshot_4()
print("All screenshots saved to assets/screenshots/")
