"""Generate cropped white + gradient logo variants from the brand PNG.
Outputs into presentation/assets/ for use on the dark landing page.
"""
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "presentation" / "assets" / "logowithoubackground.png"
OUT = ROOT / "presentation" / "assets"

img = Image.open(SRC).convert("RGBA")
alpha = img.split()[-1]
# threshold faint anti-alias/noise pixels so the crop is tight
mask = alpha.point(lambda a: 255 if a > 40 else 0)
bbox = mask.getbbox()
if bbox is None:
    raise SystemExit("logo has no opaque pixels")

img.putalpha(mask)

# 1) Full logo, tightly cropped, original gradient colours (transparent bg)
full = img.crop(bbox)
full.save(OUT / "logo-casamotion-gradient.png")

# 2) Full logo, white (recolour every visible pixel to white, keep alpha)
white_full = Image.new("RGBA", full.size, (255, 255, 255, 0))
white_full.putalpha(full.split()[-1])
# paint white where alpha > 0
solid = Image.new("RGBA", full.size, (248, 250, 252, 255))
white_full = Image.composite(solid, Image.new("RGBA", full.size, (0, 0, 0, 0)), full.split()[-1])
white_full.save(OUT / "logo-casamotion-white.png")

# 3) Compact lockup (icon + wordmark, drop the two tagline lines) -> white
w, h = full.size
compact = full.crop((0, 0, w, int(h * 0.62)))  # top portion = icon + CasaMotion wordmark
ca = compact.split()[-1]
cb = ca.getbbox()
compact = compact.crop(cb)
compact_solid = Image.new("RGBA", compact.size, (248, 250, 252, 255))
compact_white = Image.composite(compact_solid, Image.new("RGBA", compact.size, (0, 0, 0, 0)), compact.split()[-1])
compact_white.save(OUT / "logo-nav-white.png")

# 4) Compact lockup, gradient (for light chips if needed)
compact.save(OUT / "logo-nav-gradient.png")

for p in ["logo-casamotion-gradient.png", "logo-casamotion-white.png", "logo-nav-white.png", "logo-nav-gradient.png"]:
    im = Image.open(OUT / p)
    print(p, im.size)
