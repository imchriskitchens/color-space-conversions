const to16 = (n) => parseInt(n, 10).toString(16);
const expand = (n) => (n.length === 1) ? `0${n}` : n;

const digits = (str) => str.match(/\d+/g);
const minMax = (r, g, b) => [Math.min(r, g, b), Math.max(r, g, b)];

const rgbToHEX = (rgb) => {
  let [r, g, b] = digits(rgb);
  [r, g, b] = [r, g, b].map(to16);
  [r, g, b] = [r, g, b].map(expand);
  return `#${r}${g}${b}`;
}

const rgbToHSL = (rgb) => {
  let [r, g, b] = digits(rgb).map((n) => n / 255);
  let [min, max] = minMax(r, g, b);
  let [hue, sat, lit, c] = Array(4).fill(0);

  lit = (max + min) / 2;
  c = max - min;

  if (c !== 0) hue = (max === r) ? ((g - b) / c) % 6 :
    (max === g) ? (b - r) / c + 2 :
    (r - g) / c + 4; //(max === b)

  hue *= 60;
  if (hue < 0) hue += 360;
  if (c !== 0) sat = (c) / (1 - Math.abs(max + min - 1));
  sat *= 100;
  lit *= 100;

  [hue, sat, lit] = [hue, sat, lit].map((n) => parseInt(n));
  return `hsl(${hue}, ${sat}%, ${lit}%)`;
}

const hexToRGB = (hex) => {
  hex = +`0x${hex.replace("#", "")}`;
  let [r, g, b] = [(hex >> 16), (hex >> 8), hex].map((n) => n & 255);
  return `rgb(${r}, ${g}, ${b})`;
}

const hexToHSL = (hex) => {
  hex = hexToRGB(hex);
  return rgbToHSL(hex);
}

function hslToHEX(hsl) {
  let [h, s, l] = digits(hsl);
  s /= 100;
  l /= 100;

  let [c, x, m, r, g, b] = Array(6).fill(0);
  c = (1 - Math.abs(2 * l - 1)) * s;
  x = c * (1 - Math.abs((h / 60) % 2 - 1));
  m = l - c / 2;

  const sixty = (h) => Math.floor(h / 60);

  [r, g, b] =
  (sixty(h) == 0) ? [c, x, 0] :
  (sixty(h) == 1) ? [x, c, 0] :
  (sixty(h) == 2) ? [0, c, x] :
  (sixty(h) == 3) ? [0, x, c] :
  (sixty(h) == 4) ? [x, 0, c] :
  (sixty(h) == 5) ? [c, 0, x] : [r, g, b];

  r = Math.round((r + m) * 255).toString(16);
  g = Math.round((g + m) * 255).toString(16);
  b = Math.round((b + m) * 255).toString(16);

  [r, g, b] = [r, g, b].map(expand);
  return `#${r}${g}${b}`;
}

const hslToRGB = (hsl) => {
  let hex = hslToHEX(hsl);
  return hexToRGB(hex);
}