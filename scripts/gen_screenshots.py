from PIL import Image, ImageDraw, ImageFont
import math, os

W, H = 1080, 1920
OUT = os.path.join(os.path.dirname(__file__), '../assets/screenshots')
os.makedirs(OUT, exist_ok=True)

ASSETS = os.path.join(os.path.dirname(__file__), '../assets')

# ── colour palette ──────────────────────────────────────────────────────────
BG_TOP    = (8,  8,  31)
BG_MID    = (15, 20, 80)
BG_BOT    = (40, 10, 80)
GOLD      = (255, 215,  0)
ORANGE    = (255, 107, 53)
WHITE     = (255, 255, 255)
PURPLE    = (83,  52, 131)
CYAN      = (47, 213, 255)
GREEN     = (46, 213, 115)
RED       = (255,  71,  87)

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

def make_gradient(w, h, top, bot):
    img = Image.new('RGB', (w, h))
    draw = ImageDraw.Draw(img)
    for y in range(h):
        t = y / h
        r = int(top[0] + (bot[0]-top[0])*t)
        g = int(top[1] + (bot[1]-top[1])*t)
        b = int(top[2] + (bot[2]-top[2])*t)
        draw.line([(0,y),(w,y)], fill=(r,g,b))
    return img

def draw_bubble(draw, cx, cy, r, color_pair, alpha=255):
    outer = color_pair[1]
    inner = color_pair[0]
    # outer glow
    for i in range(6, 0, -1):
        glow = tuple(min(255, int(c*1.3)) for c in outer)
        draw.ellipse([cx-r-i, cy-r-i, cx+r+i, cy+r+i], outline=glow+(30,) if len(glow)==3 else glow)
    draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=inner)
    # highlight
    hr = max(4, r//3)
    draw.ellipse([cx-r+r//4-hr, cy-r+r//5-hr, cx-r+r//4+hr, cy-r+r//5+hr],
                 fill=(255,255,255,180) if False else (255,255,255))

def add_stars(draw, w, h, count=80):
    import random
    random.seed(42)
    for _ in range(count):
        x = random.randint(0, w)
        y = random.randint(0, h//2)
        s = random.randint(1, 3)
        br = random.randint(150, 255)
        draw.ellipse([x-s, y-s, x+s, y+s], fill=(br, br, br))

def centered_text(draw, y, text, size, color, bold=False):
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", size)
    except:
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", size)
        except:
            font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, y), text, fill=color, font=font)
    return font

def shadow_text(draw, y, text, size, color, shadow=(0,0,0)):
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", size)
    except:
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", size)
        except:
            font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    x = (W - tw) // 2
    draw.text((x+3, y+3), text, fill=shadow, font=font)
    draw.text((x, y), text, fill=color, font=font)

def draw_pill(draw, x1, y1, x2, y2, fill, outline=None, radius=30):
    draw.rounded_rectangle([x1, y1, x2, y2], radius=radius, fill=fill, outline=outline, width=3)

# ── SCREENSHOT 1 — Home Screen ───────────────────────────────────────────────
def screenshot_1():
    img = make_gradient(W, H, BG_TOP, BG_BOT)
    draw = ImageDraw.Draw(img)
    add_stars(draw, W, H)

    # Load and paste splash image as background (top portion)
    splash = Image.open(os.path.join(ASSETS, 'splash.png')).convert('RGB')
    splash = splash.resize((W, int(W * splash.height / splash.width)))
    img.paste(splash, (0, 0))

    # Dark overlay bottom half
    overlay = Image.new('RGB', (W, H//2), BG_TOP)
    mask = Image.new('L', (W, H//2))
    md = ImageDraw.Draw(mask)
    for y in range(H//2):
        md.line([(0,y),(W,y)], fill=int(220*(y/(H//2))))
    img.paste(overlay, (0, H//2), mask)

    draw = ImageDraw.Draw(img)

    # Title
    shadow_text(draw, 980, "Bubble", 110, WHITE)
    shadow_text(draw, 1090, "Kingdom", 110, GOLD)
    centered_text(draw, 1215, "✨  Pop • Match • Win  ✨", 42, (200,200,255))

    # PLAY button
    draw_pill(draw, 240, 1330, 840, 1440, fill=(255,180,0), radius=50)
    shadow_text(draw, 1350, "🎯  PLAY!", 72, WHITE)

    # Level select button
    draw_pill(draw, 290, 1470, 790, 1560, fill=PURPLE, outline=(255,255,255,80), radius=40)
    centered_text(draw, 1488, "🗺  Select Level", 48, WHITE)

    # How to play box
    draw_pill(draw, 60, 1610, 1020, 1870, fill=(20,20,60), outline=(80,60,120), radius=24)
    centered_text(draw, 1630, "HOW TO PLAY", 38, GOLD)
    for i, line in enumerate([
        "👆  Tap to aim & shoot",
        "💥  Match 3 bubbles to BLAST!",
        "🔥  Chain combos for bonus",
        "⭐  Earn up to 3 stars per level",
    ]):
        centered_text(draw, 1695 + i*44, line, 34, (220,220,255))

    img.save(os.path.join(OUT, 'screenshot_1_home.png'))
    print("Screenshot 1 done")

# ── SCREENSHOT 2 — Gameplay ───────────────────────────────────────────────────
def screenshot_2():
    img = make_gradient(W, H, (5,5,25), (30,8,60))
    draw = ImageDraw.Draw(img)
    add_stars(draw, W, H, 100)

    # HUD bar
    draw_pill(draw, 30, 60, 1050, 160, fill=(20,15,50), outline=PURPLE, radius=20)
    centered_text(draw, 78, "Level 5   •   ⭐ Score: 4,800   •   💥 x3 Combo", 38, WHITE)

    # Bubble grid (8 cols x 7 rows)
    cols, rows = 8, 7
    br = 56
    grid_w = cols * br * 2
    ox = (W - grid_w) // 2 + br
    oy = 220

    import random
    random.seed(7)
    for row in range(rows):
        ncols = cols if row % 2 == 0 else cols - 1
        extra = 0 if row % 2 == 0 else br
        for col in range(ncols):
            cx = ox + extra + col * br * 2
            cy = oy + row * int(br * 1.75)
            color = BUBBLE_COLORS[random.randint(0, len(BUBBLE_COLORS)-1)]
            draw_bubble(draw, cx, cy, br-4, color)

    # Aim line (dashed)
    ax, ay = W//2, H - 200
    for i in range(0, 18):
        y1 = ay - i*60
        y2 = y1 - 40
        alpha = max(50, 255 - i*15)
        c = (alpha, alpha, 255)
        draw.line([(ax, y1), (ax, y2)], fill=c, width=4)

    # Cannon
    cannon_y = H - 220
    draw.ellipse([W//2-60, cannon_y-60, W//2+60, cannon_y+60], fill=(60,40,100), outline=GOLD, width=4)
    draw.rectangle([W//2-18, cannon_y-130, W//2+18, cannon_y-60], fill=(80,60,120), outline=GOLD, width=3)

    # Next bubble
    centered_text(draw, H-155, "NEXT", 34, (180,180,255))
    draw_bubble(draw, W//2, H-100, 44, BUBBLE_COLORS[2])

    # Shots left
    draw_pill(draw, 60, H-170, 260, H-100, fill=(20,15,50), outline=PURPLE, radius=16)
    centered_text(draw, H-158, "🎯 18", 42, WHITE)

    img.save(os.path.join(OUT, 'screenshot_2_gameplay.png'))
    print("Screenshot 2 done")

# ── SCREENSHOT 3 — Power-ups ──────────────────────────────────────────────────
def screenshot_3():
    img = make_gradient(W, H, (5,5,25), (50,10,80))
    draw = ImageDraw.Draw(img)
    add_stars(draw, W, H)

    shadow_text(draw, 100, "POWER-UPS", 90, GOLD)
    centered_text(draw, 210, "Unleash epic bubble blasters!", 44, (200,200,255))

    powerups = [
        ("💣", "BOMB",      "Destroys all nearby bubbles",     (200,50,50)),
        ("🔥", "FIRE",      "Blasts the entire row",           (255,100,20)),
        ("🚀", "ROCKET",    "Clears a full column",            (50,150,255)),
        ("⚡", "LIGHTNING", "Zaps 9 random bubbles",           (255,220,0)),
        ("🌈", "RAINBOW",   "Pops all of one color",           (150,80,220)),
        ("❄️", "FREEZE",    "Stops bubbles in their tracks",   (80,200,240)),
    ]

    for i, (emoji, name, desc, color) in enumerate(powerups):
        col = i % 2
        row = i // 2
        x1 = 40 + col * 520
        y1 = 330 + row * 480
        x2 = x1 + 480
        y2 = y1 + 420

        draw_pill(draw, x1, y1, x2, y2, fill=(15,12,40), outline=color, radius=28)

        # Bubble icon
        cx = (x1+x2)//2
        draw_bubble(draw, cx, y1+110, 72, [color, tuple(max(0,c-50) for c in color)])

        # Emoji
        try:
            efont = ImageFont.truetype("/System/Library/Fonts/Apple Color Emoji.ttc", 80)
        except:
            efont = ImageFont.load_default()
        ebbox = draw.textbbox((0,0), emoji, font=efont)
        draw.text((cx - (ebbox[2]-ebbox[0])//2, y1+60), emoji, font=efont)

        # Name
        try:
            nfont = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 42)
        except:
            nfont = ImageFont.load_default()
        nbbox = draw.textbbox((0,0), name, font=nfont)
        draw.text((cx-(nbbox[2]-nbbox[0])//2, y1+210), name, fill=color, font=nfont)

        # Desc
        try:
            dfont = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 30)
        except:
            dfont = ImageFont.load_default()
        words = desc.split()
        line1 = ' '.join(words[:4])
        line2 = ' '.join(words[4:])
        for li, line in enumerate([line1, line2]):
            if line:
                lb = draw.textbbox((0,0), line, font=dfont)
                draw.text((cx-(lb[2]-lb[0])//2, y1+270+li*38), line, fill=(200,200,220), font=dfont)

    img.save(os.path.join(OUT, 'screenshot_3_powerups.png'))
    print("Screenshot 3 done")

# ── SCREENSHOT 4 — Worlds / Level Select ─────────────────────────────────────
def screenshot_4():
    img = make_gradient(W, H, BG_TOP, (20,5,50))
    draw = ImageDraw.Draw(img)
    add_stars(draw, W, H)

    shadow_text(draw, 80, "4 WORLDS", 90, GOLD)
    centered_text(draw, 190, "32 levels of bubble adventure!", 44, (200,200,255))

    worlds = [
        ("🌟", "World 1",  "Sunny Pop",    "Easy",    GREEN,  [0,1,2,0,1,2,0,1]),
        ("🌿", "World 2",  "Neon Garden",  "Medium",  CYAN,   [1,2,0,1,0,2,1,0]),
        ("💎", "World 3",  "Crystal Rush", "Hard",    ORANGE, [2,1,0,2,1,0,2,1]),
        ("🔥", "World 4",  "Expert Orbit", "Expert",  RED,    [0,2,1,0,2,1,0,2]),
    ]

    for i, (emoji, wname, wlabel, diff, color, stars) in enumerate(worlds):
        y1 = 290 + i * 390
        y2 = y1 + 355
        draw_pill(draw, 40, y1, 1040, y2, fill=(12,10,35), outline=color, radius=28)

        # Left emoji
        try:
            efont = ImageFont.truetype("/System/Library/Fonts/Apple Color Emoji.ttc", 90)
        except:
            efont = ImageFont.load_default()
        draw.text((70, y1+30), emoji, font=efont)

        # World info
        try:
            bf = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 52)
            sf = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 36)
        except:
            bf = sf = ImageFont.load_default()
        draw.text((220, y1+30), wname, fill=color, font=bf)
        draw.text((220, y1+95), wlabel, fill=WHITE, font=bf)
        draw_pill(draw, 220, y1+160, 420, y1+220, fill=color, radius=14)
        db = draw.textbbox((0,0), diff, font=sf)
        draw.text((320-(db[2]-db[0])//2, y1+165), diff, fill=WHITE, font=sf)

        # Level dots
        dot_r = 22
        dot_y = y1 + 280
        for j in range(8):
            dx = 80 + j * 120
            filled = stars[j] > 0
            draw.ellipse([dx-dot_r, dot_y-dot_r, dx+dot_r, dot_y+dot_r],
                         fill=color if filled else (30,30,60),
                         outline=color, width=2)
            try:
                nf = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 24)
            except:
                nf = ImageFont.load_default()
            nb = draw.textbbox((0,0), str(j+1), font=nf)
            draw.text((dx-(nb[2]-nb[0])//2, dot_y-12), str(j+1), fill=WHITE, font=nf)

    img.save(os.path.join(OUT, 'screenshot_4_worlds.png'))
    print("Screenshot 4 done")

screenshot_1()
screenshot_2()
screenshot_3()
screenshot_4()
print("All screenshots saved to assets/screenshots/")
