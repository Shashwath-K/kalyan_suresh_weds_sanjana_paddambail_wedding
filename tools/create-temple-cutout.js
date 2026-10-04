// Makes a transparent-sky copy of the supplied temple image using only its
// original RGB pixels. The source photograph remains untouched.
const fs = require('node:fs');
const zlib = require('node:zlib');

const inputPath = 'images/scene-02.png';
const outputPath = 'images/scene-02-cutout.png';
const source = fs.readFileSync(inputPath);
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
if (!source.subarray(0, 8).equals(signature)) throw new Error('Expected a PNG input.');

let width, height, bitDepth, colorType;
const compressed = [];
for (let offset = 8; offset < source.length;) {
  const length = source.readUInt32BE(offset);
  const type = source.toString('ascii', offset + 4, offset + 8);
  const data = source.subarray(offset + 8, offset + 8 + length);
  if (type === 'IHDR') {
    width = data.readUInt32BE(0);
    height = data.readUInt32BE(4);
    bitDepth = data[8];
    colorType = data[9];
  }
  if (type === 'IDAT') compressed.push(data);
  offset += length + 12;
  if (type === 'IEND') break;
}
if (bitDepth !== 8 || colorType !== 2) throw new Error('Expected an 8-bit RGB PNG.');

const channels = 3;
const stride = width * channels;
const packed = zlib.inflateSync(Buffer.concat(compressed));
const rgb = Buffer.alloc(stride * height);
const paeth = (a, b, c) => {
  const p = a + b - c;
  const da = Math.abs(p - a), db = Math.abs(p - b), dc = Math.abs(p - c);
  return da <= db && da <= dc ? a : db <= dc ? b : c;
};
for (let y = 0; y < height; y++) {
  const packedRow = y * (stride + 1);
  const filter = packed[packedRow];
  const row = y * stride;
  for (let i = 0; i < stride; i++) {
    const value = packed[packedRow + 1 + i];
    const left = i >= channels ? rgb[row + i - channels] : 0;
    const up = y > 0 ? rgb[row - stride + i] : 0;
    const upperLeft = y > 0 && i >= channels ? rgb[row - stride + i - channels] : 0;
    const predictor = filter === 1 ? left : filter === 2 ? up : filter === 3 ? Math.floor((left + up) / 2) : filter === 4 ? paeth(left, up, upperLeft) : 0;
    rgb[row + i] = (value + predictor) & 255;
  }
}

// This follows the temple's roofline. Warm masonry and the two slender stone/
// brass markers above the roof are retained by the foreground checks below.
const ridge = [[0, 352], [92, 350], [166, 348], [220, 354], [748, 125], [1278, 377], [1380, 391], [1599, 403]];
function roofline(x) {
  let i = 0;
  while (i < ridge.length - 2 && x > ridge[i + 1][0]) i++;
  const [x1, y1] = ridge[i], [x2, y2] = ridge[i + 1];
  return y1 + (y2 - y1) * ((x - x1) / (x2 - x1));
}

const rgba = Buffer.alloc((width * 4 + 1) * height);
for (let y = 0; y < height; y++) {
  const sourceRow = y * stride;
  const outputRow = y * (width * 4 + 1);
  rgba[outputRow] = 0;
  for (let x = 0; x < width; x++) {
    const si = sourceRow + x * 3;
    const di = outputRow + 1 + x * 4;
    const r = rgb[si], g = rgb[si + 1], b = rgb[si + 2];
    rgba[di] = r; rgba[di + 1] = g; rgba[di + 2] = b;
    const warmDetail = r > 90 && r > g * 1.10 && g > b * 1.025;
    const foliage = g > 65 && g > r * 1.035 && g > b * 1.015;
    const stoneMarker = y >= 158 && y <= 458 && Math.abs(x - (1410 + (y - 158) * .045)) <= 10;
    const markerCap = y >= 158 && y <= 184 && x >= 1393 && x <= 1433;
    rgba[di + 3] = y >= roofline(x) - 1 || warmDetail || foliage || stoneMarker || markerCap ? 255 : 0;
  }
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type, 'ascii');
  const body = Buffer.concat([name, data]);
  let crc = 0xffffffff;
  for (const byte of body) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  crc = (crc ^ 0xffffffff) >>> 0;
  const out = Buffer.alloc(data.length + 12);
  out.writeUInt32BE(data.length, 0); name.copy(out, 4); data.copy(out, 8); out.writeUInt32BE(crc, data.length + 8);
  return out;
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8; ihdr[9] = 6;
const output = Buffer.concat([
  signature,
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(rgba, { level: 7 })),
  chunk('IEND', Buffer.alloc(0)),
]);
fs.writeFileSync(outputPath, output);
process.stdout.write(`Created ${outputPath} (${width}x${height})\n`);
