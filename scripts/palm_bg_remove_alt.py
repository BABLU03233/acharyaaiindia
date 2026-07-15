"""Remove BG from the second palm PNG (already processed the first)."""
from pathlib import Path
from PIL import Image
from rembg import remove, new_session

DST = Path("/app/src/assets/palms")
DST.mkdir(parents=True, exist_ok=True)
session = new_session("u2net")

src = Path("/app/tmp/palm2.png")
dst = DST / "palm-open-alt.png"
print(f"processing {src.name} ({src.stat().st_size/1024:.0f} KB) -> {dst.name}")
data = src.read_bytes()
result_bytes = remove(
    data, session=session,
    alpha_matting=True,
    alpha_matting_foreground_threshold=240,
    alpha_matting_background_threshold=15,
    alpha_matting_erode_size=8,
)
dst.write_bytes(result_bytes)

img = Image.open(dst).convert("RGBA")
w, h = img.size
scale = 1200 / max(w, h)
if scale < 1:
    img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
web = DST / "palm-open-alt-1200.png"
img.save(web, format="PNG", optimize=True)
print(f"  -> transparent {dst.stat().st_size/1024:.0f} KB, web {web.stat().st_size/1024:.0f} KB")

for p in sorted(DST.iterdir()):
    print(f"  {p.name}: {p.stat().st_size/1024:.1f} KB")
