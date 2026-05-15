from PIL import Image, ImageDraw, ImageFont
import os, random, math

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

GOLD     = (255,215,0)
GOLD_DIM = (184,134,11)
WHITE    = (255,255,255)
RED_HI   = (255,26,26)
RED_DARK = (139,0,0)
PURPLE_CARD = (28,9,69)

BG_HOME  = [(8,0,48),(19,0,80),(30,8,96),(42,13,20),(90,24,0)]
BG_LEVEL = [(5,2,16),(14,6,32),(28,10,48),(45,13,16)]

WORLDS = [
    {'name':'The Village',  'label':'Peasant',    'range':(1,8),   'colors':((26,58,10),(74,124,47))},
    {'name':'The Fortress', 'label':'Knight',     'range':(9,16),  'colors':((42,26,14),(139,69,19))},
    {'name':'The Citadel',  'label':'Baron',      'range':(17,24), 'colors':((58,10,10),(192,57,43))},
    {'name':"Dragon's Keep",'label':'Dragon Lord','range':(25,32), 'colors':((26,10,46),(123,0,0))},
]
WORLD_ICONS = ['🌿','🏰','🗡️','🐉']

def get_font(size, bold=True):
    paths = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for p in paths:
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
        t     = y / h * n
        i     = min(int(t), n-1)
        frac  = t - i
        c0, c1 = stops[i], stops[i+1]
        r = int(c0[0] + (c1[0]-c0[0]) * frac)
        g = int(c0[1] + (c1[1]-c0[1]) * frac)
        b = int(c0[2] + (c1[2]-c0[2]) * frac)
        draw.line([(0,y),(w,y)], fill=(r,g,b))
    return img

def make_gradient(w, h, top, bot):
    return make_gradient_multi(w, h, [top, bot])

def add_stars(draw, w, h, count=140, seed=42):
    random.seed(seed)
    for _ in range(count):
        x  = random.randint(0, w)
        y  = random.randint(0, int(h*0.6))
        s  = random.choice([1,1,2,2,3])
        br = random.randint(140,255)
        draw.ellipse([x-s,y-s,x+s,y+s], fill=(br,br,br))

def draw_bubble(draw, cx, cy, r, cp):
    inner, outer = cp[0], cp[1]
    for i in range(6,0,-1):
        g = tuple(min(255,int(c*1.25)) for c in outer)
        draw.ellipse([cx-r-i,cy-r-i,cx+r+i,cy+r+i], outline=g)
    draw.ellipse([cx-r,cy-r,cx+r,cy+r], fill=inner)
    hr = max(4, r//3)
    draw.ellipse([cx-r//3-hr, cy-r//3-hr, cx-r//3+hr, cy-r//3+hr], fill=WHITE)

def pill(draw, x1, y1, x2, y2, fill, outline=None, radius=30, width=3):
    draw.rounded_rectangle([x1,y1,x2,y2], radius=radius, fill=fill, outline=outline, width=width)

def text_cx(draw, W, y, txt, fnt, color):
    bb = draw.textbbox((0,0), txt, font=fnt)
    draw.text(((W-(bb[2]-bb[0]))//2, y), txt, fill=color, font=fnt)

def shadow_cx(draw, W, y, txt, fnt, color, shadow=(0,0,0), off=3):
    bb = draw.textbbox((0,0), txt, font=fnt)
    x  = (W-(bb[2]-bb[0]))//2
    draw.text((x+off, y+off), txt, fill=shadow, font=fnt)
    draw.text((x, y), txt, fill=color, font=fnt)


def generate_set(W, H, suffix):
    s = W / 1080  # scale factor

    def S(n): return int(n * s)

    # ══ Screenshot 1: Home ═══════════════════════════════════════════════════
    img  = make_gradient_multi(W, H, BG_HOME)
    draw = ImageDraw.Draw(img)
    add_stars(draw, W, H, int(110*s))

    # Side towers
    TW, TH = S(66), int(H*0.7)
    BW, BH, GAP = S(14), S(18), S(10)
    stone = (14,5,26)
    tower_l = make_gradient(TW, TH, stone, (20,6,58))
    img.paste(tower_l, (0, BH))
    tower_r = make_gradient(TW, TH, stone, (20,6,58))
    img.paste(tower_r, (W-TW, BH))
    for bx in range(0, TW-BW, BW+GAP):
        draw.rectangle([bx, 0, bx+BW, BH+S(4)], fill=(14,3,26))
        draw.rectangle([W-TW+bx, 0, W-TW+bx+BW, BH+S(4)], fill=(14,3,26))
    draw.rectangle([0, BH+S(4), TW, BH+S(6)], fill=(*GOLD_DIM,))
    draw.rectangle([W-TW, BH+S(4), W, BH+S(6)], fill=(*GOLD_DIM,))

    # Logo
    logo_path = os.path.join(ASSETS, 'kgf-orbito-icon-master.png')
    try:
        logo = Image.open(logo_path).convert('RGBA')
        lw   = int(W*0.80)
        lh   = int(logo.height * lw / logo.width)
        logo = logo.resize((lw, lh), Image.LANCZOS)
        img.paste(logo, ((W-lw)//2, S(90)), logo)
        logo_bottom = S(90) + lh
    except:
        shadow_cx(draw, W, S(120), "Bubble Kingdom", get_font(S(100)), GOLD, shadow=(0,0,0))
        logo_bottom = S(260)

    y = logo_bottom + S(16)

    # Glory card
    pill(draw, S(80), y, W-S(80), y+S(96), fill=(15,4,32), outline=GOLD, radius=S(20))
    draw.line([(S(80),y),(W-S(80),y)], fill=(*GOLD,128), width=2)
    text_cx(draw, W, y+S(14), 'GREATEST GLORY', get_font(S(22), False), (*GOLD,165))
    shadow_cx(draw, W, y+S(38), '124,800', get_font(S(52)), WHITE, shadow=(0,0,0))
    y += S(96) + S(18)

    # BATTLE button
    btn_w = int(W*0.80)
    bx    = (W-btn_w)//2
    btn_h = S(100)
    for row in range(btn_h):
        t  = row/btn_h
        r_ = int(RED_HI[0]+(RED_DARK[0]-RED_HI[0])*t)
        g_ = int(RED_HI[1]+(RED_DARK[1]-RED_HI[1])*t)
        b_ = int(RED_HI[2]+(RED_DARK[2]-RED_HI[2])*t)
        draw.line([(bx,y+row),(bx+btn_w,y+row)], fill=(r_,g_,b_))
    draw.rounded_rectangle([bx,y,bx+btn_w,y+btn_h], radius=S(44), outline=GOLD, width=3)
    sheen = Image.new('RGBA',(W,H),(0,0,0,0))
    ImageDraw.Draw(sheen).rounded_rectangle([bx,y,bx+btn_w,y+btn_h//2], radius=S(44), fill=(255,255,255,28))
    img.paste(sheen,(0,0),sheen)
    shadow_cx(draw, W, y+S(26), '⚔️   BATTLE!', get_font(S(42)), WHITE, shadow=(0,0,0))
    y += btn_h + S(20)

    # Three mini cards
    cw = (int(W*0.88)-S(16))//3
    cx0 = (W-int(W*0.88))//2
    mini_data = [('🗺️','KINGDOM MAP','👑 48/96'),('💰','TREASURY','🔥 Streak 7'),('🎁','DAILY REWARD','Claim gift!')]
    card_h = S(128)
    for i,(ico,lbl,sub) in enumerate(mini_data):
        x1=cx0+i*(cw+S(8)); x2=x1+cw
        pill(draw,x1,y,x2,y+card_h, fill=PURPLE_CARD, outline=(*GOLD,46), radius=S(18))
        ef=emoji_font(S(28)); eb=draw.textbbox((0,0),ico,font=ef)
        draw.text(((x1+x2)//2-(eb[2]-eb[0])//2, y+S(14)), ico, font=ef)
        text_cx(draw, x1+x2, y+S(56), lbl, get_font(S(18)), WHITE)
        text_cx(draw, x1+x2, y+S(80), sub, get_font(S(16),False), (*GOLD,184))
    y += card_h + S(20)

    # Battle guide
    gh = S(168)
    pill(draw,S(80),y,W-S(80),y+gh, fill=(22,6,52), outline=(*GOLD,56), radius=S(20))
    draw.line([(S(96),y+S(28)),(W//2-S(90),y+S(28))], fill=(*GOLD,64), width=1)
    text_cx(draw, W, y+S(18), '✦  BATTLE GUIDE  ✦', get_font(S(22)), GOLD)
    draw.line([(W//2+S(90),y+S(28)),(W-S(96),y+S(28))], fill=(*GOLD,64), width=1)
    rows = [('⚔️','Tap to aim & launch gems'),('💎','Match 3 gems to BLAST!'),('🔥','Chain combos for glory'),('👑','Earn up to 3 crowns per battle')]
    ef2=emoji_font(S(22)); gf=get_font(S(26),False)
    for ri,(ic,tx) in enumerate(rows):
        ry=y+S(50)+ri*S(26)
        draw.text((S(100),ry),ic,font=ef2)
        draw.text((S(140),ry),tx,fill=(255,218,170,230),font=gf)
    draw.text((W-S(154),y+S(36)),'🧑‍⚔️',font=emoji_font(S(70)))

    # Top badges
    pill(draw,S(14),S(42),S(220),S(97), fill=(70,20,5), outline=GOLD, radius=S(28))
    draw.text((S(26),S(56)),'👑',font=emoji_font(S(22)))
    draw.text((S(62),S(54)),'48', fill=GOLD, font=get_font(S(22)))
    draw.text((S(95),S(57)),'/96', fill=(*WHITE,100), font=get_font(S(14)))
    pill(draw,W-S(220),S(42),W-S(14),S(97), fill=(55,18,0), outline=GOLD, radius=S(28))
    draw.text((W-S(208),S(56)),'🪙',font=emoji_font(S(20)))
    draw.text((W-S(168),S(54)),'1,250',fill=GOLD,font=get_font(S(20)))

    # Nav bar
    nav_bar = make_gradient(W,S(68),(14,5,35),(8,2,20))
    img.paste(nav_bar,(0,H-S(68)))
    draw.line([(0,H-S(68)),(W,H-S(68))],fill=(*GOLD_DIM,64),width=1)
    nav_icons=['🏰','🛡️','⚔️','🏆','⚙️']
    nf=emoji_font(S(26))
    for ni,ic in enumerate(nav_icons):
        ncx=W//5*ni+W//10
        bb=draw.textbbox((0,0),ic,font=nf)
        draw.text((ncx-(bb[2]-bb[0])//2,H-S(54)),ic,font=nf,fill=WHITE if ni==0 else (*WHITE,100))

    img.save(os.path.join(OUT, f'tablet_{suffix}_1_home.png'))
    print(f"Tablet {suffix} screenshot 1 done")

    # ══ Screenshot 2: Gameplay ════════════════════════════════════════════════
    img  = make_gradient(W, H, (5,5,25),(30,8,60))
    draw = ImageDraw.Draw(img)
    add_stars(draw,W,H,int(120*s))

    pill(draw,S(28),S(56),W-S(28),S(168), fill=(20,15,50), outline=(83,52,131), radius=S(22))
    text_cx(draw,W,S(76),'BATTLE  5',get_font(S(34),False),WHITE)
    text_cx(draw,W,S(118),'⭐  Score: 4,800    💥  Combo ×3',get_font(S(30),False),(*GOLD,210))

    cols,rows2 = 8,7
    br   = S(56)
    grid_w = cols*br*2
    ox   = (W-grid_w)//2+br
    oy   = S(210)
    random.seed(7)
    for row in range(rows2):
        ncols=cols if row%2==0 else cols-1
        extra=0 if row%2==0 else br
        for col in range(ncols):
            cx=ox+extra+col*br*2
            cy=oy+row*int(br*1.75)
            draw_bubble(draw,cx,cy,br-4,BUBBLE_COLORS[random.randint(0,7)])

    ax=W//2; ay=H-S(240)
    for i in range(22):
        y1=ay-i*S(55); y2=y1-S(36)
        a=max(40,240-i*12)
        draw.line([(ax,y1),(ax,y2)],fill=(a,a,255),width=S(4))

    cy2=H-S(250)
    draw.ellipse([W//2-S(70),cy2-S(70),W//2+S(70),cy2+S(70)],fill=(60,40,100),outline=GOLD,width=S(4))
    draw.rectangle([W//2-S(20),cy2-S(210),W//2+S(20),cy2-S(62)],fill=(80,60,120),outline=GOLD,width=S(3))
    draw_bubble(draw,W//2,cy2,S(44),BUBBLE_COLORS[3])
    text_cx(draw,W,H-S(176),'NEXT',get_font(S(34),False),(180,180,255))
    draw_bubble(draw,W//2,H-S(116),S(38),BUBBLE_COLORS[0])

    pill(draw,S(48),H-S(196),S(248),H-S(124), fill=(20,15,50), outline=(83,52,131), radius=S(18))
    text_cx(draw,S(296),H-S(182),'🎯  18',get_font(S(44)),WHITE)

    img.save(os.path.join(OUT, f'tablet_{suffix}_2_gameplay.png'))
    print(f"Tablet {suffix} screenshot 2 done")

    # ══ Screenshot 3: Power-ups (8 in 2×4) ═══════════════════════════════════
    img  = make_gradient(W, H, (5,5,25),(50,10,80))
    draw = ImageDraw.Draw(img)
    add_stars(draw,W,H)

    shadow_cx(draw,W,S(80),'POWER-UPS',get_font(S(90)),GOLD,shadow=(0,0,0))
    text_cx(draw,W,S(196),'Unleash epic battle weapons!',get_font(S(44),False),(200,200,255))

    powerups=[
        ('⚔️','SWORD',    'Destroys nearby gems',       (220, 50, 50)),
        ('🔮','RAINBOW',  'Pops all of one colour',      (150, 80,220)),
        ('🔥','FIRE',     'Blasts the entire row',       (255,100, 20)),
        ('⚡','LIGHTNING','Zaps 9 random gems',          (255,220,  0)),
        ('❄️','FREEZE',   'Stops gems in their tracks',  ( 80,200,240)),
        ('🏹','ARROW',    'Clears a full column',        ( 50,150,255)),
        ('☄️','METEOR',   'Wipes out a large area',      (255,120,  0)),
        ('💫','STAR BURST','Chain-pops all combos',      (220,180,255)),
    ]

    cw2  = (W-S(80)-S(20))//2
    ch2  = S(370)
    pad  = S(40)
    for i,(emoji,name,desc,color) in enumerate(powerups):
        col=i%2; row=i//2
        x1=pad+col*(cw2+S(20)); y1=S(290)+row*(ch2+S(14))
        x2=x1+cw2; y2=y1+ch2
        pill(draw,x1,y1,x2,y2,fill=(15,10,40),outline=color,radius=S(28))
        sheen=Image.new('RGBA',(W,H),(0,0,0,0))
        ImageDraw.Draw(sheen).rounded_rectangle([x1,y1,x2,y1+(y2-y1)//3],radius=S(28),fill=(255,255,255,14))
        img.paste(sheen,(0,0),sheen)
        cx=(x1+x2)//2
        draw_bubble(draw,cx,y1+S(96),S(66),[color,tuple(max(0,c-50) for c in color)])
        ef3=emoji_font(S(68)); eb3=draw.textbbox((0,0),emoji,font=ef3)
        draw.text((cx-(eb3[2]-eb3[0])//2,y1+S(56)),emoji,font=ef3)
        nf3=get_font(S(44)); nb3=draw.textbbox((0,0),name,font=nf3)
        draw.text((cx-(nb3[2]-nb3[0])//2,y1+S(182)),name,fill=color,font=nf3)
        df3=get_font(S(30),False)
        words=desc.split(); mid=len(words)//2 if len(words)>3 else len(words)
        lines=[' '.join(words[:mid]),' '.join(words[mid:])]
        for li,ln in enumerate(lines):
            if ln:
                lb=draw.textbbox((0,0),ln,font=df3)
                draw.text((cx-(lb[2]-lb[0])//2,y1+S(242)+li*S(38)),ln,fill=(200,200,220),font=df3)

    img.save(os.path.join(OUT, f'tablet_{suffix}_3_powerups.png'))
    print(f"Tablet {suffix} screenshot 3 done")

    # ══ Screenshot 4: Kingdom Map ═════════════════════════════════════════════
    img  = make_gradient_multi(W, H, BG_LEVEL)
    draw = ImageDraw.Draw(img)
    add_stars(draw,W,H)

    # Header
    pill(draw,0,0,W,S(140),fill=(8,3,20),radius=0)
    draw.line([(0,S(140)),(W,S(140))],fill=(*GOLD_DIM,80),width=1)
    text_cx(draw,W,S(56),'🗺️  KINGDOM MAP',get_font(S(44)),GOLD)
    draw.rectangle([(W//2-S(60),S(106)),(W//2+S(60),S(108))],fill=(*GOLD_DIM,90))

    # Royal Glory banner
    bt,bh2=S(156),S(136)
    banner=make_gradient(W-S(80),bh2,(61,10,0),(107,24,0))
    img.paste(banner,(S(40),bt))
    draw.rounded_rectangle([S(40),bt,W-S(40),bt+bh2],radius=S(20),outline=(*GOLD,115),width=2)
    draw.line([(S(40),bt),(W-S(40),bt)],fill=(*GOLD,128),width=2)
    draw.text((S(62),bt+S(18)),'👑',font=emoji_font(S(32)))
    draw.text((W-S(110),bt+S(18)),'👑',font=emoji_font(S(32)))
    text_cx(draw,W,bt+S(14),'ROYAL GLORY',get_font(S(24),False),(*GOLD,178))
    text_cx(draw,W,bt+S(42),'48',get_font(S(52)),GOLD)
    text_cx(draw,W+S(40),bt+S(54),'/96',get_font(S(28),False),(*WHITE,115))
    bx,bwy=S(80),bt+S(102)
    bbar=W-S(160)
    draw.rounded_rectangle([bx,bwy,bx+bbar,bwy+S(12)],radius=S(6),fill=(*WHITE,20))
    draw.rounded_rectangle([bx,bwy,bx+bbar//2,bwy+S(12)],radius=S(6),fill=GOLD)
    text_cx(draw,W,bt+S(118),'⚔️  48 crowns left to claim',get_font(S(26),False),(255,220,150,165))

    # Worlds
    yw=bt+bh2+S(22)
    for wi,world in enumerate(WORLDS):
        wc0,wc1=world['colors']
        # World header
        hbar=make_gradient(W-S(80),S(68),wc0,wc1)
        img.paste(hbar,(S(40),yw))
        draw.rounded_rectangle([S(40),yw,W-S(40),yw+S(68)],radius=S(14),outline=(*GOLD,52),width=1)
        draw.ellipse([S(56),yw+S(12),S(100),yw+S(56)],fill=(0,0,0,90))
        draw.text((S(59),yw+S(13)),WORLD_ICONS[wi],font=emoji_font(S(32)))
        draw.text((S(114),yw+S(10)),world['name'],fill=WHITE,font=get_font(S(32)))
        draw.text((S(114),yw+S(40)),f"{world['label']}  ·  Battles {world['range'][0]}–{world['range'][1]}",fill=(255,220,150,178),font=get_font(S(24),False))
        pill(draw,W-S(160),yw+S(12),W-S(48),yw+S(56),fill=(0,0,0,102),outline=(*GOLD,76),radius=S(14))
        text_cx(draw,W-S(96),yw+S(20),'👑 0/24',get_font(S(24),False),GOLD)
        yw+=S(70)

        # Level cards
        cw3=(W-S(80)-S(24))//2
        for li in range(4):
            lnum=world['range'][0]+li
            col=li%2; lrow=li//2
            cx3=S(40)+col*(cw3+S(24))
            cy3=yw+lrow*(int(cw3*0.65)+S(14))
            ch3=int(cw3*0.65)
            emoji_l=['⚔️','🛡️','🏰','🐉','💎','🏹','🔮','⚜️'][lnum%8]
            unlocked=li<2
            if unlocked:
                cc=make_gradient(cw3,ch3,wc0,wc1)
                img.paste(cc,(cx3,cy3))
                draw.rounded_rectangle([cx3,cy3,cx3+cw3,cy3+ch3],radius=S(16),outline=(*GOLD,76),width=1)
                draw.text((cx3+S(14),cy3+S(10)),emoji_l,font=emoji_font(S(28)))
                draw.text((cx3+cw3-S(50),cy3+S(10)),str(lnum),fill=WHITE,font=get_font(S(28)))
                cf2=emoji_font(S(14))
                for ci in range(3):
                    crow='👑' if ci==0 else '♛'
                    draw.text((cx3+S(14)+ci*S(20),cy3+ch3-S(28)),crow,font=cf2,fill=(*GOLD,255) if ci==0 else (*WHITE,50))
                draw.text((cx3+cw3//2-S(40),cy3+ch3-S(24)),'CONQUERED',fill=GOLD,font=get_font(S(14)))
            else:
                draw.rounded_rectangle([cx3,cy3,cx3+cw3,cy3+ch3],radius=S(16),fill=(26,13,26),outline=(*WHITE,25),width=1)
                text_cx(draw,cx3+cw3,cy3+ch3//2-S(20),'⛓️',emoji_font(S(26)),WHITE)
                text_cx(draw,cx3+cw3,cy3+ch3//2+S(8),'LOCKED',get_font(S(18)),(255,255,255,76))

        yw+=int((cw3*0.65+S(14))*2)+S(14)

    img.save(os.path.join(OUT, f'tablet_{suffix}_4_worlds.png'))
    print(f"Tablet {suffix} screenshot 4 done")


# 7-inch tablet: 1200×1920
generate_set(1200, 1920, '7inch')

# 10-inch tablet: 1600×2560
generate_set(1600, 2560, '10inch')

print("\nAll tablet screenshots done!")
