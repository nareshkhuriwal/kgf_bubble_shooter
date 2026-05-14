from PIL import Image, ImageDraw, ImageFont
import os, random

ASSETS = os.path.join(os.path.dirname(__file__), '../assets')
OUT    = os.path.join(os.path.dirname(__file__), '../assets/screenshots')
os.makedirs(OUT, exist_ok=True)

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
GOLD   = (255,215,0)
WHITE  = (255,255,255)
PURPLE = (83,52,131)
CYAN   = (47,213,255)
GREEN  = (46,213,115)
ORANGE = (255,107,53)
RED    = (255,71,87)
BG_TOP = (8,8,31)
BG_BOT = (40,10,80)

def make_gradient(w, h, top, bot):
    img = Image.new('RGB', (w, h))
    draw = ImageDraw.Draw(img)
    for y in range(h):
        t = y / h
        r = int(top[0]+(bot[0]-top[0])*t)
        g = int(top[1]+(bot[1]-top[1])*t)
        b = int(top[2]+(bot[2]-top[2])*t)
        draw.line([(0,y),(w,y)], fill=(r,g,b))
    return img

def add_stars(draw, w, h, count=120, seed=42):
    random.seed(seed)
    for _ in range(count):
        x = random.randint(0,w); y = random.randint(0,h//2)
        s = random.randint(1,3); br = random.randint(150,255)
        draw.ellipse([x-s,y-s,x+s,y+s], fill=(br,br,br))

def draw_bubble(draw, cx, cy, r, cp):
    for i in range(5,0,-1):
        g = tuple(min(255,int(c*1.3)) for c in cp[1])
        draw.ellipse([cx-r-i,cy-r-i,cx+r+i,cy+r+i], outline=g)
    draw.ellipse([cx-r,cy-r,cx+r,cy+r], fill=cp[0])
    hr = max(4,r//3)
    draw.ellipse([cx-r+r//4-hr,cy-r+r//5-hr,cx-r+r//4+hr,cy-r+r//5+hr], fill=WHITE)

def get_font(size, bold=True):
    paths = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for p in paths:
        try: return ImageFont.truetype(p, size)
        except: pass
    return ImageFont.load_default()

def centered_text(draw, W, y, text, size, color, bold=True):
    font = get_font(size, bold)
    bbox = draw.textbbox((0,0), text, font=font)
    tw = bbox[2]-bbox[0]
    draw.text(((W-tw)//2, y), text, fill=color, font=font)

def shadow_text(draw, W, y, text, size, color):
    font = get_font(size)
    bbox = draw.textbbox((0,0), text, font=font)
    tw = bbox[2]-bbox[0]
    x = (W-tw)//2
    draw.text((x+3,y+3), text, fill=(0,0,0), font=font)
    draw.text((x,y), text, fill=color, font=font)

def draw_pill(draw, x1, y1, x2, y2, fill, outline=None, radius=30):
    draw.rounded_rectangle([x1,y1,x2,y2], radius=radius, fill=fill, outline=outline, width=3)

def generate_set(W, H, suffix):
    scale = W / 1080  # scale factor relative to phone

    # ── Screenshot 1: Home ──────────────────────────────────────────────────
    img = make_gradient(W, H, BG_TOP, BG_BOT)
    splash = Image.open(os.path.join(ASSETS,'splash.png')).convert('RGB')
    sw = W; sh = int(W * splash.height / splash.width)
    splash = splash.resize((sw, sh))
    img.paste(splash, (0,0))
    overlay = Image.new('RGB',(W, H//2), BG_TOP)
    mask = Image.new('L',(W, H//2))
    md = ImageDraw.Draw(mask)
    for y in range(H//2): md.line([(0,y),(W,y)], fill=int(220*(y/(H//2))))
    img.paste(overlay,(0,H//2),mask)
    draw = ImageDraw.Draw(img)
    add_stars(draw,W,H)

    title_y = int(H*0.51)
    shadow_text(draw,W, title_y,       "Bubble", int(110*scale), WHITE)
    shadow_text(draw,W, title_y+int(115*scale), "Kingdom", int(110*scale), GOLD)
    centered_text(draw,W, title_y+int(240*scale), "✨  Pop • Match • Win  ✨", int(42*scale), (200,200,255))

    py1 = int(H*0.72); py2 = py1+int(110*scale)
    draw_pill(draw, int(W*0.22),py1, int(W*0.78),py2, fill=(255,180,0), radius=int(50*scale))
    shadow_text(draw,W, py1+int(18*scale), "🎯  PLAY!", int(68*scale), WHITE)

    ly1 = py2+int(20*scale); ly2 = ly1+int(90*scale)
    draw_pill(draw, int(W*0.27),ly1, int(W*0.73),ly2, fill=PURPLE, outline=WHITE, radius=int(40*scale))
    centered_text(draw,W, ly1+int(18*scale), "🗺  Select Level", int(46*scale), WHITE)

    hx1=int(W*0.06); hx2=int(W*0.94)
    hy1=ly2+int(30*scale); hy2=hy1+int(260*scale)
    draw_pill(draw,hx1,hy1,hx2,hy2, fill=(20,20,60), outline=(80,60,120), radius=int(24*scale))
    centered_text(draw,W, hy1+int(20*scale), "HOW TO PLAY", int(36*scale), GOLD)
    for i,line in enumerate(["👆 Tap to aim & shoot","💥 Match 3 bubbles to BLAST!","🔥 Chain combos for bonus","⭐ Earn up to 3 stars per level"]):
        centered_text(draw,W, hy1+int(75*scale)+i*int(44*scale), line, int(32*scale), (220,220,255), bold=False)

    img.save(os.path.join(OUT, f'tablet_{suffix}_1_home.png'))
    print(f"Tablet {suffix} screenshot 1 done")

    # ── Screenshot 2: Gameplay ──────────────────────────────────────────────
    img = make_gradient(W, H, (5,5,25),(30,8,60))
    draw = ImageDraw.Draw(img)
    add_stars(draw,W,H,120)

    draw_pill(draw,int(30*scale),int(60*scale),int(W-30*scale),int(160*scale), fill=(20,15,50), outline=PURPLE, radius=int(20*scale))
    centered_text(draw,W, int(80*scale), "Level 5   •   ⭐ Score: 4,800   •   💥 x3 Combo", int(38*scale), WHITE)

    cols,rows = 8,7
    br = int(56*scale)
    grid_w = cols*br*2
    ox = (W-grid_w)//2+br
    oy = int(200*scale)
    random.seed(7)
    for row in range(rows):
        ncols = cols if row%2==0 else cols-1
        extra = 0 if row%2==0 else br
        for col in range(ncols):
            cx = ox+extra+col*br*2
            cy = oy+row*int(br*1.75)
            draw_bubble(draw,cx,cy,br-4,BUBBLE_COLORS[random.randint(0,7)])

    ax = W//2; ay = H-int(200*scale)
    for i in range(0,18):
        y1=ay-i*int(60*scale); y2=y1-int(40*scale)
        alpha=max(50,255-i*15)
        draw.line([(ax,y1),(ax,y2)], fill=(alpha,alpha,255), width=int(4*scale))

    cy2 = H-int(220*scale)
    draw.ellipse([W//2-int(60*scale),cy2-int(60*scale),W//2+int(60*scale),cy2+int(60*scale)], fill=(60,40,100), outline=GOLD, width=int(4*scale))
    draw.rectangle([W//2-int(18*scale),cy2-int(130*scale),W//2+int(18*scale),cy2-int(60*scale)], fill=(80,60,120), outline=GOLD, width=int(3*scale))
    draw_bubble(draw, W//2, H-int(100*scale), int(44*scale), BUBBLE_COLORS[2])
    centered_text(draw,W, H-int(155*scale), "NEXT", int(34*scale), (180,180,255))

    img.save(os.path.join(OUT, f'tablet_{suffix}_2_gameplay.png'))
    print(f"Tablet {suffix} screenshot 2 done")

    # ── Screenshot 3: Power-ups ─────────────────────────────────────────────
    img = make_gradient(W, H, (5,5,25),(50,10,80))
    draw = ImageDraw.Draw(img)
    add_stars(draw,W,H)

    shadow_text(draw,W, int(80*scale), "POWER-UPS", int(90*scale), GOLD)
    centered_text(draw,W, int(195*scale), "Unleash epic bubble blasters!", int(44*scale), (200,200,255))

    powerups = [
        ("💣","BOMB",      "Destroys nearby bubbles",  (200,50,50)),
        ("🔥","FIRE",      "Blasts the entire row",    (255,100,20)),
        ("🚀","ROCKET",    "Clears a full column",     (50,150,255)),
        ("⚡","LIGHTNING", "Zaps 9 random bubbles",    (255,220,0)),
        ("🌈","RAINBOW",   "Pops all of one color",    (150,80,220)),
        ("❄️","FREEZE",    "Stops bubbles cold",       (80,200,240)),
    ]
    cell_w = (W-int(80*scale))//2
    cell_h = int(380*scale)
    for i,(emoji,name,desc,color) in enumerate(powerups):
        col=i%2; row=i//2
        x1=int(40*scale)+col*(cell_w+int(20*scale))
        y1=int(300*scale)+row*(cell_h+int(20*scale))
        x2=x1+cell_w; y2=y1+cell_h
        draw_pill(draw,x1,y1,x2,y2, fill=(15,12,40), outline=color, radius=int(28*scale))
        cx=(x1+x2)//2
        draw_bubble(draw,cx,y1+int(100*scale),int(66*scale),[color,tuple(max(0,c-50) for c in color)])
        try:
            efont=ImageFont.truetype("/System/Library/Fonts/Apple Color Emoji.ttc",int(70*scale))
        except:
            efont=get_font(int(50*scale))
        eb=draw.textbbox((0,0),emoji,font=efont)
        draw.text((cx-(eb[2]-eb[0])//2,y1+int(55*scale)),emoji,font=efont)
        nf=get_font(int(40*scale))
        nb=draw.textbbox((0,0),name,font=nf)
        draw.text((cx-(nb[2]-nb[0])//2,y1+int(195*scale)),name,fill=color,font=nf)
        df=get_font(int(28*scale),False)
        db=draw.textbbox((0,0),desc,font=df)
        draw.text((cx-(db[2]-db[0])//2,y1+int(255*scale)),desc,fill=(200,200,220),font=df)

    img.save(os.path.join(OUT, f'tablet_{suffix}_3_powerups.png'))
    print(f"Tablet {suffix} screenshot 3 done")

    # ── Screenshot 4: Worlds ────────────────────────────────────────────────
    img = make_gradient(W, H, BG_TOP,(20,5,50))
    draw = ImageDraw.Draw(img)
    add_stars(draw,W,H)

    shadow_text(draw,W, int(70*scale), "4 WORLDS", int(90*scale), GOLD)
    centered_text(draw,W, int(185*scale), "32 levels of bubble adventure!", int(44*scale), (200,200,255))

    worlds=[
        ("🌟","World 1","Sunny Pop","Easy",  GREEN),
        ("🌿","World 2","Neon Garden","Medium",CYAN),
        ("💎","World 3","Crystal Rush","Hard",ORANGE),
        ("🔥","World 4","Expert Orbit","Expert",RED),
    ]
    wh = int(360*scale)
    for i,(emoji,wname,wlabel,diff,color) in enumerate(worlds):
        y1=int(280*scale)+i*(wh+int(20*scale)); y2=y1+wh
        draw_pill(draw,int(40*scale),y1,W-int(40*scale),y2, fill=(12,10,35), outline=color, radius=int(28*scale))
        try:
            efont=ImageFont.truetype("/System/Library/Fonts/Apple Color Emoji.ttc",int(80*scale))
        except:
            efont=get_font(int(60*scale))
        draw.text((int(70*scale),y1+int(25*scale)),emoji,font=efont)
        bf=get_font(int(50*scale)); sf=get_font(int(34*scale),False)
        draw.text((int(200*scale),y1+int(25*scale)),wname,fill=color,font=bf)
        draw.text((int(200*scale),y1+int(88*scale)),wlabel,fill=WHITE,font=bf)
        draw_pill(draw,int(200*scale),y1+int(150*scale),int(400*scale),y1+int(210*scale),fill=color,radius=int(14*scale))
        db=draw.textbbox((0,0),diff,font=sf)
        draw.text((int(300*scale)-(db[2]-db[0])//2,y1+int(157*scale)),diff,fill=WHITE,font=sf)
        dr=int(22*scale)
        for j in range(8):
            dx=int(80*scale)+j*int(115*scale); dy=y1+int(278*scale)
            draw.ellipse([dx-dr,dy-dr,dx+dr,dy+dr],fill=color,outline=color,width=2)
            nf=get_font(int(22*scale)); nb=draw.textbbox((0,0),str(j+1),font=nf)
            draw.text((dx-(nb[2]-nb[0])//2,dy-int(12*scale)),str(j+1),fill=WHITE,font=nf)

    img.save(os.path.join(OUT, f'tablet_{suffix}_4_worlds.png'))
    print(f"Tablet {suffix} screenshot 4 done")

# 7-inch tablet: 1200x1920
generate_set(1200, 1920, '7inch')

# 10-inch tablet: 1600x2560
generate_set(1600, 2560, '10inch')

print("\nAll tablet screenshots done!")
