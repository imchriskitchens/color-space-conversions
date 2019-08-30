const body = document.body;
// const textarea = document.getElementById("textarea");
// const table = document.getElementById("table");
const tr = table.getElementsByTagName("tr");
// const btnEXPORT = document.getElementById("btnEXPORT");

let colorArray = ["#E5F2EE", "rgb(171, 223, 207)", "#78CBB4", "#4FB79D", "hsl(166, 53%, 41%)", "#1B9077", "#0C7C66", "#036855", "#005545", "#004136", "hsl(170, 100%, 8%)", "#001A15", "rgb(242, 229, 229)", "#F2C2C3", "#F0A0A1", "rgb(236, 127, 129)", "#E66467", "hsl(357, 68%, 58%)", "hsl(357, 61%, 51%)", "#BE2A31", "#A41E25", "#7F131A", "#500B10", "#1A0305", "#F2EAE5", "#EFCEBC", "#EAB293", "#E2986E", "#D8814F", "hsl(22, 57%, 50%)", "#B75D22", "#A04E14", "#843F0A", "#632F05", "#3E1F01", "#1A0D00", "hsl(38, 34%, 92%)", "#F0DBAE", "#E7C878", "rgb(217, 179, 72)", "#C49D21", "#AB8606", "hsl(47, 100%, 28%)", "#765E00", "#5C4A00", "#443700", "#2E2600", "hsl(48, 100%, 5%)", "#EDF2E3", "rgb(204, 235, 169)", "#99D971", "hsl(105, 53%, 51%)", "#2EB01E", "#069A08", "#008310", "#006D16", "#005817", "#004214", "#002E0F", "#001A09"];

const getTextArea = () => textarea.value;
const setTextArea = content => (textarea.value = content);
setTextArea(colorArray.join(`\n`));

let objectArray = []; // array of objects containing color data


let count = 0;
const nextNum = () => `count${count++}`;

const copyAnim = (el) => {
  const elmnt = document.getElementById(el);
  const storedValue = elmnt.className;
  elmnt.className = `${storedValue} pulse`;
  elmnt.addEventListener(
    "animationend",
    function (event) {
      elmnt.className = storedValue;
    },
    false
  );
};

// color values in table are "click-to-copy" 
const copyToClip = eid => {
  // id's generated onclick
  copyAnim(eid);
  let content = document.getElementById(eid).textContent;
  const el = document.createElement("textarea");
  el.value = content;
  el.setAttribute("readonly", "");
  el.style.position = "absolute";
  el.style.left = "-9999px";
  body.appendChild(el);
  const selected =
    document.getSelection().rangeCount > 0 ?
    document.getSelection().getRangeAt(0) :
    false;
  el.select();
  document.execCommand("copy");
  body.removeChild(el);
  if (selected) {
    document.getSelection().removeAllRanges();
    document.getSelection().addRange(selected);
  }
};


btnEXPORT.addEventListener(
  "click",
  function () {
    const el = document.createElement("a");
    const content = JSON.stringify({ palette: objectArray }, null, 2);
    el.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(content)
    );
    el.setAttribute("download", "palette.json");
    el.style.display = "none";
    body.appendChild(el);
    el.click();
    body.removeChild(el);
  },
  false
);

function tableData() {
  const el = document.querySelector("[data-toggle]");
  if (el.hasAttribute("data-active")) {
    objectArray = [];
    el.textContent = "";
    const fragment = document.getElementById("table-reset");
    const instance = document.importNode(fragment.content, true);
    el.appendChild(instance);
  } else el.setAttribute("data-active", true);
}

const getsRGB = v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

const LUM = color => {
  let [r, g, b] = color.match(/\d+/g);
  r = getsRGB(r / 255) * 0.2126;
  g = getsRGB(g / 255) * 0.7152;
  b = getsRGB(b / 255) * 0.0722;
  return r + g + b;
};

// "Contrast" late 17th century (as a term in fine art, in the sense ‘juxtapose so as to bring out differences in form and color’). [Etymology] - Latin "contra-" against + "stare" stand.
const getContrast = (colorA, colorB) => {
  const L1 = typeof colorA === "string" ? LUM(colorA) : colorA;
  const L2 = typeof colorB === "string" ? LUM(colorB) : colorB;
  const compare = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  // truncate to two decimal places without rounding
  const contrast = compare.toString().match(/(?:\d*\.?\d{2})/);
  if (contrast != null) return contrast[0];
  return L1 === L2 ? 1 : 21;
};

function plusTable(array) {
  const fragment = document.getElementById("template");

  array.forEach(color => {
    const [formatDEF, formatRGB, formatHEX, formatHSL, contrast] = [color.default, color.rgb, color.hex, color.hsl, color.contrast];

    const instance = document.importNode(fragment.content, true);
    const defaultFormat = instance.querySelector(".def");
    const contrastVals = `Black: ${contrast.black}\nWhite: ${contrast.white}`;

    defaultFormat.textContent = formatDEF;
    defaultFormat.style.backgroundColor = formatRGB;
    defaultFormat.style.color = contrast.white > 4.5 ? "white" : "black";
    defaultFormat.setAttribute("data-tip", contrastVals);
    instance.querySelector(".vl0").textContent = formatRGB;
    instance.querySelector(".vl1").textContent = formatHEX;
    instance.querySelector(".vl2").textContent = formatHSL;
    instance.querySelector(".ccBlk").textContent = contrast.black;
    instance.querySelector(".ccWh").textContent = contrast.white;
    table.appendChild(instance);
  });
}

// I REALLY need to update these conversions!

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

  if (0 <= h && h < 60)
    [r, g, b] = [c, x, 0];
  else if (60 <= h && h < 120)
    [r, g, b] = [x, c, 0];
  else if (120 <= h && h < 180)
    [r, g, b] = [0, c, x];
  else if (180 <= h && h < 240)
    [r, g, b] = [0, x, c];
  else if (240 <= h && h < 300)
    [r, g, b] = [x, 0, c];
  else if (300 <= h && h < 360)
    [r, g, b] = [c, 0, x];

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
// _____________________________________________________________

function submit() {
  tableData(); // refresh data on next submit()
  btnEXPORT.removeAttribute("data-hide");

  const colorList = getTextArea().split("\n");

  const isHEX = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i;
  const isRGB = /^rgb\((\s*\d{1,3}\s*),(\s*\d{1,3}\s*),(\s*\d{1,3}\s*)\)$/i;
  const isHSL = /^hsl\((\s*\d{1,3}\s*),(\s*\d{1,3}%\s*),(\s*\d{1,3}%\s*)\)$/i;

  const contrastBlk = color => getContrast(color, "rgb(0,0,0)");
  const contrastWh = color => getContrast(color, "rgb(255,255,255)");

  colorList.forEach(color => {
    if (color === "") return;

    // HACK: Quick fix for hex short codes
    if (isHEX.test(color) && color.length < 6) {
      let [r, g, b] = color.match(/[0-9A-F]/gi);
      color = `#${[r, r, g, g, b, b].join("")}`;
    }

    const getFormat = (color) =>
      (isHEX.test(color)) ? ['HEX', hexToRGB(color), color, hexToHSL(color)] :
      (isRGB.test(color)) ? ['RGB', color, rgbToHEX(color), rgbToHSL(color)] :
      (isHSL.test(color)) ? ['HSL', hslToRGB(color), hslToHEX(color), color] : '';

    const [formatDEF, formatRGB, formatHEX, formatHSL] = getFormat(color);

    const ColorObj = {
      default: formatDEF,
      rgb: formatRGB,
      hex: formatHEX.toUpperCase(),
      hsl: formatHSL,
      contrast: {
        black: contrastBlk(formatRGB),
        white: contrastWh(formatRGB)
      }
    }
    objectArray.push(ColorObj);
  });

  plusTable(objectArray);
}
submit();