import os
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw, ImageFont
import numpy as np

src_path = r'C:\Users\Shashwath-K\.gemini\antigravity-ide\brain\dbc92b6c-fda1-49cf-893b-9e6d94bc1787\.user_uploaded\media_1791312349881.jpg'
orig = Image.open(src_path).convert('RGB')
w, h = orig.size

cw, ch = 1200, 630

# Background: soft blurred ambient version of the photo
bg = orig.resize((cw, int(cw * h / w)), Image.Resampling.LANCZOS)
bg_y = (bg.height - ch) // 2
bg = bg.crop((0, bg_y, cw, bg_y + ch))
bg = bg.filter(ImageFilter.GaussianBlur(32))

# Filmic deep grading on background (warm, rich, unobtrusive)
arr_bg = np.array(bg, dtype=np.float32) * 0.42
arr_bg[:,:,0] = np.clip(arr_bg[:,:,0] * 1.05, 0, 255)
arr_bg[:,:,2] = np.clip(arr_bg[:,:,2] * 0.92, 0, 255)
bg = Image.fromarray(arr_bg.astype(np.uint8))

# Foreground photo: 596px height with clean top/bottom margin
photo_h = 596
photo_w = int(photo_h * w / h)  # approx 335px
photo = orig.resize((photo_w, photo_h), Image.Resampling.LANCZOS)

# Cinematic color grading on foreground photo (natural, rich, filmic, not flashy)
arr = np.array(photo, dtype=np.float32) / 255.0
r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]

# Gentle contrast & warmth curve
r = np.clip(1.03 * (r ** 1.04) + 0.012, 0, 1)
g = np.clip(1.01 * (g ** 1.05) + 0.008, 0, 1)
b = np.clip(0.97 * (b ** 1.08) - 0.008, 0, 1)
photo_graded = Image.fromarray(np.clip(np.stack([r, g, b], axis=2) * 255.0, 0, 255).astype(np.uint8))
photo_graded = ImageEnhance.Color(photo_graded).enhance(1.06)
photo_graded = ImageEnhance.Sharpness(photo_graded).enhance(1.15)

# Place photo on the right side
px = 790
py = (ch - photo_h) // 2

canvas = bg.copy()

# Multi-layered luxury shadow behind photo
shadow = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
sdraw = ImageDraw.Draw(shadow)
sdraw.rectangle([px - 14, py - 6, px + photo_w + 14, py + photo_h + 6], fill=(0, 0, 0, 210))
shadow = shadow.filter(ImageFilter.GaussianBlur(18))
canvas = Image.alpha_composite(canvas.convert('RGBA'), shadow).convert('RGB')

# Paste photo
canvas.paste(photo_graded, (px, py))

# Draw elegant gold border around photo
draw = ImageDraw.Draw(canvas)
draw.rectangle([px - 1, py - 1, px + photo_w, py + photo_h], outline=(212, 175, 100), width=1)
draw.rectangle([px - 4, py - 4, px + photo_w + 3, py + photo_h + 3], outline=(180, 140, 70), width=1)

# Typography on the left side
font_eyebrow = ImageFont.truetype(r'C:\Windows\Fonts\georgia.ttf', 16)
font_title = ImageFont.truetype(r'C:\Windows\Fonts\georgiab.ttf', 46)
font_and = ImageFont.truetype(r'C:\Windows\Fonts\georgiai.ttf', 32)
font_sub = ImageFont.truetype(r'C:\Windows\Fonts\georgia.ttf', 20)
font_meta = ImageFont.truetype(r'C:\Windows\Fonts\georgia.ttf', 16)

tx = 85
ty = 205

# Eyebrow
draw.text((tx, ty - 50), "THE WEDDING RECEPTION OF", font=font_eyebrow, fill=(212, 175, 100))

# 'Kalyan' <small>'and '</small> 'Sanjana'
draw.text((tx, ty), "Kalyan", font=font_title, fill=(255, 250, 240))
bb_k = draw.textbbox((tx, ty), "Kalyan", font=font_title)
draw.text((bb_k[2] + 12, ty + 12), "and", font=font_and, fill=(212, 175, 100))
bb_and = draw.textbbox((bb_k[2] + 12, ty + 12), "and", font=font_and)
draw.text((bb_and[2] + 12, ty), "Sanjana", font=font_title, fill=(255, 250, 240))

# Golden divider flourish
div = Image.open('images/golden_divider.png').convert('RGBA')
div_w = 260
div_h = int(div_w * div.height / div.width)
div_scaled = div.resize((div_w, div_h), Image.Resampling.LANCZOS)
canvas.paste(div_scaled, (tx, ty + 70), div_scaled)

# Motto / Date / Location
draw.text((tx, ty + 115), "\u201cFamilies come together, lives blossom forever\u201d", font=font_sub, fill=(245, 235, 220))
draw.text((tx, ty + 155), "Saturday, 31st October 2026 \u2022 Bengaluru", font=font_meta, fill=(212, 175, 100))

# Save optimized PNG under 300KB
canvas_png = canvas.convert('RGB').quantize(colors=256, dither=Image.Dither.NONE)
out_target = 'images/og-preview.png'
canvas_png.save(out_target, optimize=True)

print(f"Saved {out_target}, Size: {os.path.getsize(out_target)} bytes")
