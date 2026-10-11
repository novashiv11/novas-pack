// Turn a pet photo into a cartoon, on this device. A classic image filter, not AI: nothing is uploaded, and it works
// offline. Three steps:
// 1. Colours: a Kuwahara filter (painterly smoothing that keeps edges) at a small size, scaled back up.
// 2. Ink lines: a difference of Gaussians on the smoothed brightness (catches eyes and nose, not just outlines).
// 3. Flat brightness bands with a touch more colour, then the ink on top.

const INK = [30, 27, 23]; // brand ink #1E1B17

function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

/** Kuwahara filter on RGBA pixels (w×h), radius r, using summed-area tables. Returns a new Uint8ClampedArray. */
function kuwahara(px, w, h, r) {
  const W = w + 1, n = W * (h + 1);
  const sR = new Float64Array(n), sG = new Float64Array(n), sB = new Float64Array(n), sQ = new Float64Array(n);
  for (let y = 0; y < h; y++) {
    let rr = 0, gg = 0, bb = 0, qq = 0;
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4, R = px[o], G = px[o + 1], B = px[o + 2];
      rr += R; gg += G; bb += B; qq += R * R + G * G + B * B;
      const i = (y + 1) * W + x + 1, up = y * W + x + 1;
      sR[i] = sR[up] + rr; sG[i] = sG[up] + gg; sB[i] = sB[up] + bb; sQ[i] = sQ[up] + qq;
    }
  }
  const box = (t, x0, y0, x1, y1) => t[(y1 + 1) * W + x1 + 1] - t[y0 * W + x1 + 1] - t[(y1 + 1) * W + x0] + t[y0 * W + x0];
  const out = new Uint8ClampedArray(px.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let best = Infinity, br = 0, bg = 0, bb = 0;
      for (let q = 0; q < 4; q++) {
        const x0 = Math.max(0, q & 1 ? x : x - r), x1 = Math.min(w - 1, q & 1 ? x + r : x);
        const y0 = Math.max(0, q & 2 ? y : y - r), y1 = Math.min(h - 1, q & 2 ? y + r : y);
        const cnt = (x1 - x0 + 1) * (y1 - y0 + 1);
        const mr = box(sR, x0, y0, x1, y1) / cnt, mg = box(sG, x0, y0, x1, y1) / cnt, mb = box(sB, x0, y0, x1, y1) / cnt;
        const v = box(sQ, x0, y0, x1, y1) / cnt - (mr * mr + mg * mg + mb * mb);
        if (v < best) { best = v; br = mr; bg = mg; bb = mb; }
      }
      const o = (y * w + x) * 4;
      out[o] = br; out[o + 1] = bg; out[o + 2] = bb; out[o + 3] = 255;
    }
  }
  return out;
}

/** Separable Gaussian blur of a single-channel Float32Array. */
function gauss(src, w, h, sigma) {
  const rad = Math.ceil(sigma * 3), k = new Float32Array(rad * 2 + 1);
  let sum = 0;
  for (let i = -rad; i <= rad; i++) { k[i + rad] = Math.exp(-(i * i) / (2 * sigma * sigma)); sum += k[i + rad]; }
  for (let i = 0; i < k.length; i++) k[i] /= sum;
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0;
    for (let i = -rad; i <= rad; i++) s += src[y * w + Math.min(w - 1, Math.max(0, x + i))] * k[i + rad];
    tmp[y * w + x] = s;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let s = 0;
    for (let i = -rad; i <= rad; i++) s += tmp[Math.min(h - 1, Math.max(0, y + i)) * w + x] * k[i + rad];
    out[y * w + x] = s;
  }
  return out;
}

/** Ink lines: difference of Gaussians on brightness; dark side of edges only; specks removed; thickened if big. */
function inkLines(px, w, h) {
  const n = w * h, lum = new Float32Array(n);
  for (let p = 0; p < n; p++) lum[p] = 0.299 * px[p * 4] + 0.587 * px[p * 4 + 1] + 0.114 * px[p * 4 + 2];
  const s = Math.max(w, h) / 512; // scale sigmas with the image
  const g1 = gauss(lum, w, h, 1.1 * s), g2 = gauss(lum, w, h, 1.8 * s);
  let line = new Uint8Array(n);
  for (let p = 0; p < n; p++) if (g1[p] - g2[p] < -2.4) line[p] = 1;
  for (let pass = 0; pass < 2; pass++) {
    const keep = new Uint8Array(n);
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      if (!line[p]) continue;
      const c = line[p - w - 1] + line[p - w] + line[p - w + 1] + line[p - 1] + line[p + 1] + line[p + w - 1] + line[p + w] + line[p + w + 1];
      if (c >= 2) keep[p] = 1;
    }
    line = keep;
  }
  return line;
}

/**
 * Photo (data URL) → cartoon (JPEG data URL), at most `size` px on the long side. About 0.2–0.5 s on a phone.
 */
export async function cartoonize(src, { size = 512 } = {}) {
  const img = await loadImage(src);
  const s = Math.min(1, size / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * s)), h = Math.max(1, Math.round(img.naturalHeight * s));

  const c = Object.assign(document.createElement("canvas"), { width: w, height: h });
  const g = c.getContext("2d", { willReadFrequently: true });
  g.fillStyle = "#fff"; g.fillRect(0, 0, w, h);
  g.imageSmoothingQuality = "high";
  g.drawImage(img, 0, 0, w, h);

  // Colours: Kuwahara twice at ~256 px, then back up to full size.
  const ss = Math.min(1, 256 / Math.max(w, h));
  const sw = Math.max(1, Math.round(w * ss)), sh = Math.max(1, Math.round(h * ss));
  const small = Object.assign(document.createElement("canvas"), { width: sw, height: sh });
  const sg = small.getContext("2d", { willReadFrequently: true });
  sg.imageSmoothingQuality = "high";
  sg.drawImage(c, 0, 0, sw, sh);
  const sd = sg.getImageData(0, 0, sw, sh);
  let k = kuwahara(sd.data, sw, sh, 3);
  k = kuwahara(k, sw, sh, 2);
  sd.data.set(k);
  sg.putImageData(sd, 0, 0);
  g.drawImage(small, 0, 0, w, h);

  // Ink lines from the smoothed picture, so fur and fabric texture don't turn into dots.
  const data = g.getImageData(0, 0, w, h);
  const px = data.data, n = w * h;
  const line = inkLines(px, w, h);
  const L = 6, step = 255 / L;
  for (let p = 0; p < n; p++) {
    const o = p * 4;
    if (line[p]) { px[o] = INK[0]; px[o + 1] = INK[1]; px[o + 2] = INK[2]; continue; }
    let r = px[o], gg = px[o + 1], b = px[o + 2];
    const y0 = 0.299 * r + 0.587 * gg + 0.114 * b;
    const sat = 1 + 0.2 * Math.min(1, y0 / 128); // more colour in the light, none added in the dark
    const m = (r + gg + b) / 3;
    r = m + (r - m) * sat; gg = m + (gg - m) * sat; b = m + (b - m) * sat;
    const y = Math.max(1, 0.299 * r + 0.587 * gg + 0.114 * b);
    const yq = Math.min(255, (Math.floor(y / step) + 0.65) * step);
    const f = yq / y;
    px[o] = r * f; px[o + 1] = gg * f; px[o + 2] = b * f; // Uint8ClampedArray clamps to 0..255
  }
  g.putImageData(data, 0, 0);
  return c.toDataURL("image/jpeg", 0.9);
}
