export function isNumber(value) {
  return !Number.isNaN(value) && typeof value === 'number'
}

// 把文件按照二进制进行读取
export function readFile(file) {
  return new Promise((resolve) => {
    let reader = new FileReader();
    reader.readAsBinaryString(file);
    reader.onload = (ev) => {
      resolve(ev.target.result);
    };
  });
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h, s, l];
}

function hslToRgb(h, s, l) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function hexToRgb(hex) {
  // 移除可能存在的'#'符号
  hex = hex.replace('#', '');

  // 确保16进制颜色长度正确，如果是3位的短格式，则扩展为6位
  if (hex.length === 3) {
    hex = hex.split('').map(function (x) {
      return x + x;
    }).join('');
  }

  // 解析16进制颜色到RGB
  var r = parseInt(hex.substring(0, 2), 16); // 红色分量
  var g = parseInt(hex.substring(2, 4), 16); // 绿色分量
  var b = parseInt(hex.substring(4, 6), 16); // 蓝色分量

  // 返回RGB格式
  return [r, g, b]
}


export function mapValueToColor(color, value, minValue, maxValue, minLightness = 10, maxLightness = 80) {
  let rgb  = null
  if (!Array.isArray(color)) {
    rgb = hexToRgb(color)
  } else {
    rgb = color
  }

  const hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);

  let lightness // 初始化为最小亮度值

  if (maxValue - minValue !== 0 && isNumber(value)) {
    // 将值映射到 [0, 1] 的范围
    const normalizedValue = (maxValue - value) / (maxValue - minValue); // 反转映射，使得值越大，normalizedValue越小

    // 使用线性插值计算亮度值
    lightness = minLightness + normalizedValue * (maxLightness - minLightness);
  } else {
    lightness = maxLightness + 10;
  }
  // 返回 HSL 格式的颜色值
  return hslToRgb(hsl[0], hsl[1], lightness / 100);
}

export function bilinearInterpolation(index, blockColor, blockWidth, totalBlocks) {
  // // 计算所在像素块的索引和位置
  // var blockIndex = index; // 所在像素块的索引
  //
  // // 计算相邻像素块的索引
  // // var nextBlockIndex = blockIndex + 1;
  //
  // // 如果超出了像素图范围，则取最后一个像素块的索引
  // // nextBlockIndex = Math.min(nextBlockIndex, totalBlocks - 1);
  //
  // // 对每个颜色通道进行插值
  // var interpolatedColor = [];
  // for (var i = 0; i < 3; i++) { // 3 代表 RGB 通道
  //   // 取相邻像素块的颜色的平均值
  //   console.log(blockColor)
  //   interpolatedColor[i] = (blockColor[blockIndex - 1][i] + blockColor[blockIndex][i] + blockColor[blockIndex + 1][i]) / 3;
  //
  // }

  // return interpolatedColor;
}


function getPixelColor(pixelArray, width, height, x, y) {
  // 边界处理
  x = Math.min(Math.max(x, 0), width - 1);
  y = Math.min(Math.max(y, 0), height - 1);

  // 计算像素在一维数组中的索引
  let index = (y * width + x) * 3; // 3 代表 RGB 通道

  // 获取像素的颜色值
  let pixel = [];
  pixel[0] = pixelArray[index];
  pixel[1] = pixelArray[index + 1];
  pixel[2] = pixelArray[index + 2];

  return pixel;
}

export function countOccurrences(str, char) {
  // 使用正则表达式匹配字符，使用g标志匹配所有出现的字符
  const regex = new RegExp(char, 'g');
  // 使用match方法匹配所有出现的字符，并返回匹配结果的长度
  const count = (str.match(regex) || []).length;
  return count;
}

export function toScientificNotation(number) {
    if (number === 0) {
        return { mantissa: 0, exponent: 0 };
    }

    let exponent = 0;
    let mantissa = Math.abs(number);

    // 处理大于等于10的数
    while (mantissa >= 10) {
        mantissa /= 10;
        exponent += 1;
    }

    // 处理小于1的数
    while (mantissa < 1) {
        mantissa *= 10;
        exponent -= 1;
    }

    // 考虑负数的情况
    if (number < 0) {
        mantissa = -mantissa;
    }

    return { mantissa: mantissa, exponent: exponent };
}



