const body = document.body;
const tr = table.getElementsByTagName("tr");

let colorArray = [
  // 
  "#E5F2EE", "rgb(171, 223, 207)", "#78CBB4", "#4FB79D", "hsl(166, 53%, 41%)", "#1B9077", "#0C7C66", "#036855", "#005545", "#004136", "hsl(170, 100%, 8%)", "#001A15", "rgb(242, 229, 229)", "#F2C2C3", "#F0A0A1", "rgb(236, 127, 129)", "#E66467", "hsl(357, 68%, 58%)", "hsl(357, 61%, 51%)", "#BE2A31", "#A41E25", "#7F131A", "#500B10", "#1A0305", "#F2EAE5", "#EFCEBC", "#EAB293", "#E2986E", "#D8814F", "hsl(22, 57%, 50%)", "#B75D22", "#A04E14", "#843F0A", "#632F05", "#3E1F01", "#1A0D00", "hsl(38, 34%, 92%)", "#F0DBAE", "#E7C878", "rgb(217, 179, 72)", "#C49D21", "#AB8606", "hsl(47, 100%, 28%)", "#765E00", "#5C4A00", "#443700", "#2E2600", "hsl(48, 100%, 5%)", "#EDF2E3", "rgb(204, 235, 169)", "#99D971", "hsl(105, 53%, 51%)", "#2EB01E", "#069A08", "#008310", "#006D16", "#005817", "#004214", "#002E0F", "#001A09"];


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
  elmnt.addEventListener("animationend", (event) => {
    elmnt.className = storedValue;
  }, false);
}

// color values in table are "click-to-copy" 
const copyToClip = (eid) => {
  // id's generated onclick
  copyAnim(eid);
  let content = document.getElementById(eid).textContent;
  const el = document.createElement("textarea");
  el.value = content;
  el.setAttribute("readonly", "");
  el.style.position = "absolute";
  el.style.left = "-9999px";
  body.appendChild(el);
  const selected = document.getSelection().rangeCount > 0 ?
    document.getSelection().getRangeAt(0) : false;
  el.select();
  document.execCommand("copy");
  body.removeChild(el);
  if (selected) {
    document.getSelection().removeAllRanges();
    document.getSelection().addRange(selected);
  }
}


btnEXPORT.addEventListener("click", () => {
  const el = document.createElement("a");
  const content = JSON.stringify({ palette: objectArray }, null, 2);
  el.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
  el.setAttribute("download", "palette.json");
  el.style.display = "none";
  body.appendChild(el);
  el.click();
  body.removeChild(el);
}, false);

const tableData = () => {
  const el = document.querySelector("[data-toggle]");
  if (el.hasAttribute("data-active")) {
    objectArray = [];
    el.textContent = "";
    const fragment = document.getElementById("table_reset");
    const instance = document.importNode(fragment.content, true);
    el.appendChild(instance);
  } else el.setAttribute("data-active", true);
}


const LUM = (rgb) => {
  const getsRGB = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  let [r, g, b] = rgb.match(/\d+/g);
  r = getsRGB(r / 255) * 0.2126;
  g = getsRGB(g / 255) * 0.7152;
  b = getsRGB(b / 255) * 0.0722;
  return r + g + b;
}

// "Contrast" late 17th century (as a term in fine art, in the sense ‘juxtapose so as to bring out differences in form and color’). [Etymology] - Latin "contra-" against + "stare" stand.
const getContrast = (colorA, colorB) => {
  const L1 = (typeof colorA === "string") ? LUM(colorA) : colorA;
  const L2 = (typeof colorB === "string") ? LUM(colorB) : colorB;
  const compare = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  // truncate to two decimal places without rounding
  const contrast = (`${compare}`).match(/(?:\d*\.?\d{2})/);
  if (contrast != undefined) return Number(contrast[0]);
  return L1 === L2 ? 1 : 21;
}

const plusTable = (array) => {
  const fragment = document.getElementById("template");

  array.forEach(color => {
    const [formatDEF, formatRGB, formatHEX, formatHSL, contrast] = [color.default, color.rgb, color.hex, color.hsl, color.contrast];

    const instance = document.importNode(fragment.content, true);
    const defaultFormat = instance.querySelector(".def");
    const contrastVals = `Black: ${contrast.black}\nWhite: ${contrast.white}`;

    defaultFormat.textContent = formatDEF;
    defaultFormat.style.backgroundColor = formatRGB;
    defaultFormat.style.color = (contrast.white > 4.5) ? "white" : "black";
    defaultFormat.setAttribute("data-tip", contrastVals);
    instance.querySelector(".vl0").textContent = formatRGB;
    instance.querySelector(".vl1").textContent = formatHEX;
    instance.querySelector(".vl2").textContent = formatHSL;
    instance.querySelector(".ccBlk").textContent = contrast.black;
    instance.querySelector(".ccWh").textContent = contrast.white;
    table.appendChild(instance);
  });
}


// _____________________________________________________________
const submit = () => {
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
      (isHSL.test(color)) ? ['HSL', hslToRGB(color), hslToHEX(color), color] : "";

    const [formatDEF, formatRGB, formatHEX, formatHSL] = getFormat(color);

    const ColorObj = {
      default: formatDEF,
      rgb: formatRGB,
      hex: formatHEX.toUpperCase(),
      hsl: formatHSL,
      contrast: {
        black: Number(contrastBlk(formatRGB)),
        white: Number(contrastWh(formatRGB))
      }
    }
    objectArray.push(ColorObj);
  });

  plusTable(objectArray);
}
submit();