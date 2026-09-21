// Карта преломления жидкого стекла для feDisplacementMap: SDF скруглённого прямоугольника и профиль выпуклой кромки
// (приём из videos/ads-k1-vibecoding, проверен рендером 10.09.2026).
// Центр нейтрален (128,128): искажается только кромка шириной rim, вглубь сила гаснет по степени 2,2 (Снеллиус, n≈1,5).
// Вокруг фигуры поле margin, там карта тоже нейтральна: копия фона шире панели, поэтому кромка «затягивает» внутрь
// настоящий фон снаружи, как у стекла Apple, а не прозрачную пустоту.
// R — сдвиг по x, G — по y; нормаль смотрит наружу.
const cache = new Map<string, string>();

export type LensGeometry = {w: number; h: number; r: number; rim: number; margin: number};

export const lensMap = ({w, h, r, rim, margin}: LensGeometry, density = 0.5): string => {
  const key = `${w}:${h}:${r}:${rim}:${margin}:${density}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const W = w + margin * 2, Hh = h + margin * 2;
  const cw = Math.max(8, Math.round(W * density)), ch = Math.max(8, Math.round(Hh * density));
  const sx = W / cw, sy = Hh / ch, hw = w / 2, hh = h / 2, rr = Math.min(r, hw, hh);
  const c = document.createElement('canvas');
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(cw, ch);
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const px = (x + 0.5) * sx - margin - hw, py = (y + 0.5) * sy - margin - hh;
      const qx = Math.abs(px) - (hw - rr), qy = Math.abs(py) - (hh - rr);
      const mx = Math.max(qx, 0), my = Math.max(qy, 0), len = Math.hypot(mx, my);
      const e = -(len + Math.min(Math.max(qx, qy), 0) - rr); // глубина внутрь от кромки, < 0 снаружи
      let nx = 0, ny = 0;
      if (e >= 0 && e < rim) {
        if (len > 1e-4) { nx = mx / len; ny = my / len; } else if (qx > qy) nx = 1; else ny = 1;
        nx *= px < 0 ? -1 : 1;
        ny *= py < 0 ? -1 : 1;
        const m = Math.pow(1 - e / rim, 2.2);
        nx *= m;
        ny *= m;
      }
      const i = (y * cw + x) * 4;
      img.data[i] = 128 + Math.round(nx * 127);
      img.data[i + 1] = 128 + Math.round(ny * 127);
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const url = c.toDataURL('image/png');
  cache.set(key, url);
  return url;
};
