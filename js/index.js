const body = document.body;

const getValues = () => {
  return Array.from(textarea.value.split("\n"))
    .filter(v => !!v & v.length > 3)
    .map(item => item.trim());
}

const setValues = (values) => {
  textarea.value =
    values.filter(v => !!v & v.length > 3)
    .map(item => item.trim()).join("\n");
  textarea.rows = 10;
}

const dataObj = {
  values: [],
  add(data) {
    this.values.push(data);
  },

  init() {
    btnEXPORT.addEventListener("click", () => {
      const el = document.createElement("a");
      const content = JSON.stringify({ palette: dataObj.values }, null, 2);
      el.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`);
      el.setAttribute("download", "palette.json");
      el.style.display = "none";
      body.appendChild(el);
      el.click();
      body.removeChild(el);
    }, false);
  }
};

const tableObj = {
  reset() {
    const el = document.querySelector("[data-toggle]");
    if (el.hasAttribute("data-active")) {
      dataObj.values = [];
      el.textContent = "";
      const instance = document.importNode(table_reset.content, true);
      el.appendChild(instance);
    } else el.setAttribute("data-active", true);
  },

  add(array) {
    const IDManager = {
      value: 0, // NOTE: row count used for IDs
      next() { return this.value++; },
      generate() { // NOTE: generates IDs for table values
        return ((value) => (["rgb", "hex", "hsl"]).map(str => `${str}${value}`))(IDManager.next());
      }
    };

    array.forEach((color) => {
      const instance = document.importNode(template.content, true);
      const cells = [...instance.querySelectorAll("td")];
      const [c0, cRGB, cHEX, cHSL, cBl, cWh] = cells;
      ([cRGB.id, cHEX.id, cHSL.id] = IDManager.generate());

      const cc = color.contrast;
      c0.dataset.tip = `black: ${cc.black}\n white: ${cc.white}`;
      c0.style.color = (cc.white > 4.5) ? "white" : "black";
      c0.style.background = color.rgb;

      c0.textContent = color.default;
      cRGB.textContent = color.rgb;
      cHEX.textContent = color.hex;
      cHSL.textContent = color.hsl;
      cBl.textContent = cc.black;
      cWh.textContent = cc.white;
      table.appendChild(instance);
    });

    btnEXPORT.removeAttribute("data-hide");
  }
};


const colorUtil = {
  hexString({ r, g, b }) { return `#${r}${g}${b}` /**/ .toUpperCase() /**/ ; },
  rgbString({ r, g, b }) { return `rgb(${r}, ${g}, ${b})`; },
  hslString({ h, s, l }) { return `hsl(${h}, ${s}%, ${l}%)`; },

  rgbToHEX(value, { data } = false) {
    let [r, g, b] = value.match(/\d+/g);
    [r, g, b] = [r, g, b].map((n) => parseInt(n, 10).toString(16));
    [r, g, b] = [r, g, b].map((n) => n.length === 1 ? `0${n}` : n);
    return (data) ? ([r, g, b]) : colorUtil.hexString({ r, g, b });
  },

  rgbToHSL(value, { data } = false) {
    let [r, g, b] = (Array.isArray(value)) ? value: value.match(/\d+/g);
    [r, g, b] = [r, g, b].map((v) => v / 255);
    let cmin = Math.min(r, g, b);
    let cmax = Math.max(r, g, b);
    let c = cmax - cmin;
    let [h, s, l] = [0, 0, (cmax + cmin) * 0.5];
    if (c !== 0) {
      h = // condition hue value
        (cmax === r) ? ((g - b) / c) % 6 :
        (cmax === g) ? (b - r) / c + 2 :
        (r - g) / c + 4; // (cmax === b)
      s = c / (1 - Math.abs(cmax + cmin - 1));
    }
    [h, s, l] = [h * 60, s * 100, l * 100];
    if (h < 0) h += 360; // neg hue correction
    [h, s, l] = [h, s, l].map((n) => parseInt(n));
    return (data) ? ([h, s, l]) : colorUtil.hslString({ h, s, l });
  },

  hslToRGB(value, { data } = false) {
    let [h, s, l] = value.match(/\d+/g);
    [h, s, l] = [h / 60, s / 100, l / 100];
    let c = s * (1 - Math.abs(2 * l - 1));
    let x = c * (1 - Math.abs(h % 2 - 1));
    let m = l - c / 2;
    [c, x, m] = [(c + m), (x + m), m].map((v) => Math.round(v * 255));
    [c, x, m] = [c, x, m].map((v) => (v < 1) ? 0 : v);
    let [r, g, b] = [[c, x, m], [x, c, m], [m, c, x], [m, x, c], [x, m, c], [c, m, x]][Math.floor(h) % 6];
    return (data) ? ([r, g, b]) : colorUtil.rgbString({ r, g, b });
  },

  hslToHEX(value, { data } = false) {
    let [r, g, b] = colorUtil.hslToRGB(value, { data: true });
    [r, g, b] = [r, g, b].map((n) => parseInt(n, 10).toString(16));
    [r, g, b] = [r, g, b].map((n) => n.length === 1 ? `0${n}` : n);
    return (data) ? ([r, g, b]) : colorUtil.hexString({ r, g, b });
  },

  hexToRGB(value, { data } = false) {
    value = value.replace("#", "");
    value = (value.length === 3) ? ("0x" + ([...value]).map((ch) =>
      `${ch}${ch}`).join("")) : `0x${value}`;
    const [r, g, b] = [(value >> 16), (value >> 8), value].map((n) => n & 255);
    return (data) ? ([r, g, b]) : colorUtil.rgbString({ r, g, b });
  },

  hexToHSL(value) {
    const [r, g, b] = colorUtil.hexToRGB(value, { data: true });
    return colorUtil.rgbToHSL([r, g, b]);
  },

  getContrast(colorA, colorB) {
    const lin_sRGB = (v) =>
      (v < 0.04045) ? (v / 12.92) : ((v + 0.055) / 1.055) ** 2.4;
    const LUM = (value) => {
      let [r, g, b] = value.match(/\d+/g);
      [r, g, b] = [r, g, b].map(v => lin_sRGB(v / 255));
      [r, g, b] = [r * 0.2126, g * 0.7152, b * 0.0722];
      return [r, g, b].reduce((a, b) => a + b);
    }
    const [L1, L2] = [LUM(colorA), LUM(colorB)];
    const compare = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    return (compare != undefined) ?
      compare.toPrecision((compare >= 10) ? 4 : 3) : (L1 === L2) ? 1 : 21;
  },
};


const submit = () => {
  tableObj.reset(); // refresh data on next submit()

  const isHEX = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i;
  const isRGB = /^rgb\((\s*\d{1,3}\s*),(\s*\d{1,3}\s*),(\s*\d{1,3}\s*)\)$/i;
  const isHSL = /^hsl\((\s*\d{1,3}\s*),(\s*\d{1,3}%\s*),(\s*\d{1,3}%\s*)\)$/i;

  const { hexToRGB, hexToHSL, rgbToHEX, rgbToHSL, hslToRGB, hslToHEX, getContrast } = colorUtil;

  const inputValues = getValues(); //________// NOTE: NEW UPDATE 
  textarea.value = inputValues.join("\n"); //________// NOTE: NEW UPDATE 

  inputValues.forEach(color => { //________// NOTE: NEW UPDATE 
    if (isHEX.test(color) && color.length < 6) {
      color = "#" + ([...color.slice(1)])
        .map((v) => `${v}${v}`).join("");
    }

    const [formatDEF, formatRGB, formatHEX, formatHSL] =
    (isHEX.test(color)) ? ['HEX', hexToRGB(color), color, hexToHSL(color)] :
    (isRGB.test(color)) ? ['RGB', color, rgbToHEX(color), rgbToHSL(color)] :
    (isHSL.test(color)) ? ['HSL', hslToRGB(color), hslToHEX(color), color] : "";

    dataObj.add({
      default: formatDEF,
      rgb: formatRGB,
      hex: formatHEX,
      hsl: formatHSL,
      contrast: {
        black: getContrast(formatRGB, "rgb(0,0,0)"),
        white: getContrast(formatRGB, "rgb(255,255,255)")
      }
    });

  });

  tableObj.add(dataObj.values);
}

button.addEventListener("click", () => { submit() }, false);


const copyObj = {
  copyText(value) {
    const body = document.body;
    const el = document.createElement('textarea');
    el.value = value;
    el.setAttribute('readonly', "");
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    body.appendChild(el);
    const selected = document.getSelection().rangeCount > 0 ? document.getSelection().getRangeAt(0) : false;
    el.select();
    document.execCommand('copy');
    body.removeChild(el);
    if (selected) {
      document.getSelection().removeAllRanges();
      document.getSelection().addRange(selected);
    }
  },
  copyAnim(el) {
    el = document.getElementById(el);
    el.className = "box pulse";
    el.addEventListener("animationend", () => {
      el.className = "box";
    }, false);
  }
};

table.addEventListener("click", (e) => {
  if (e.target && e.target.nodeName == "TD") {
    if (!!e.target.id) {
      copyObj.copyAnim(e.target.id)
      copyObj.copyText(e.target.textContent);
    } 
  }
}, false);



const colorArray = ["#E5F2EE", "rgb(171, 223, 207)", "#78CBB4", "#4FB79D", "hsl(166, 53%, 41%)", "#1B9077", "#0C7C66", "#036855", "#005545", "#004136", "hsl(170, 100%, 8%)", "#001A15", "rgb(242, 229, 229)", "#F2C2C3", "#F0A0A1", "rgb(236, 127, 129)", "#E66467", "hsl(357, 68%, 58%)", "hsl(357, 61%, 51%)", "#BE2A31", "#A41E25", "#7F131A", "#500B10", "#1A0305", "#F2EAE5", "#EFCEBC", "#EAB293", "#E2986E", "#D8814F", "hsl(22, 57%, 50%)", "#B75D22", "#A04E14", "#843F0A", "#632F05", "#3E1F01", "#1A0D00", "hsl(38, 34%, 92%)", "#F0DBAE", "#E7C878", "rgb(217, 179, 72)", "#C49D21", "#AB8606", "hsl(47, 100%, 28%)", "#765E00", "#5C4A00", "#443700", "#2E2600", "hsl(48, 100%, 5%)", "#EDF2E3", "rgb(204, 235, 169)", "#99D971", "hsl(105, 53%, 51%)", "#2EB01E", "#069A08", "#008310", "#006D16", "#005817", "#004214", "#002E0F", "#001A09"];

setValues(colorArray);
dataObj.init();
submit(); /* FIRST RUN */






// NOTE: JSON EXPORT SAMPLE 

/* {
  "palette": [
    {
      "default": "HEX",
      "rgb": "rgb(229, 242, 238)",
      "hex": "#E5F2EE",
      "hsl": "hsl(161, 33%, 92%)",
      "contrast": {
        "black": "18.27",
        "white": "1.15"
      }
    },
    {
      "default": "RGB",
      "rgb": "rgb(171, 223, 207)",
      "hex": "#ABDFCF",
      "hsl": "hsl(161, 44%, 77%)",
      "contrast": {
        "black": "14.19",
        "white": "1.48"
      }
    },
    {
      "default": "HEX",
      "rgb": "rgb(120, 203, 180)",
      "hex": "#78CBB4",
      "hsl": "hsl(163, 44%, 63%)",
      "contrast": {
        "black": "11.00",
        "white": "1.91"
      }
    }
  ]
} */




//
