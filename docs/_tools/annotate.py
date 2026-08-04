# -*- coding: utf-8 -*-
"""Anotacoes visuais (retangulo vermelho arredondado / selo numerado) para
os prints dos guias do cliente, no mesmo estilo dos guias anteriores."""
from PIL import Image, ImageDraw, ImageFont

RED = (219, 39, 60)
WHITE = (255, 255, 255)


def _font(size):
    for name in ("arialbd.ttf", "Arial Bold.ttf", "DejaVuSans-Bold.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            continue
    return ImageFont.load_default()


def highlight(path, box, pad=6, radius=14, width=4, out=None):
    """Desenha um retangulo vermelho arredondado ao redor de `box`
    (dict x/y/width/height, como retornado por locator.bounding_box())."""
    img = Image.open(path).convert("RGB")
    draw = ImageDraw.Draw(img)
    x0 = box["x"] - pad
    y0 = box["y"] - pad
    x1 = box["x"] + box["width"] + pad
    y1 = box["y"] + box["height"] + pad
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, outline=RED, width=width)
    img.save(out or path)


def numbered_badges(path, boxes, out=None, radius_px=15):
    """boxes: lista de dicts x/y/width/height. Desenha um retangulo vermelho
    ao redor de cada campo e um selo numerado (1..N) no canto superior
    esquerdo, sobreposto a borda."""
    img = Image.open(path).convert("RGB")
    draw = ImageDraw.Draw(img)
    font = _font(16)
    for i, box in enumerate(boxes, start=1):
        x0 = box["x"] - 6
        y0 = box["y"] - 6
        x1 = box["x"] + box["width"] + 6
        y1 = box["y"] + box["height"] + 6
        draw.rounded_rectangle([x0, y0, x1, y1], radius=10, outline=RED, width=3)
        cx, cy = x0, y0
        draw.ellipse(
            [cx - radius_px, cy - radius_px, cx + radius_px, cy + radius_px],
            fill=RED,
            outline=WHITE,
            width=2,
        )
        text = str(i)
        bbox = draw.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        draw.text((cx - tw / 2 - bbox[0], cy - th / 2 - bbox[1]), text, fill=WHITE, font=font)
    img.save(out or path)
