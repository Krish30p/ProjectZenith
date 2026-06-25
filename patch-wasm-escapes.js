const fs = require('fs');
const path = require('path');

// Helper to decode Emscripten binary string
function binaryDecode(bin) {
  for (var i = 0, l = bin.length, o = new Uint8Array(l), c; i < l; ++i) {
    c = bin.charCodeAt(i);
    o[i] = ~c >> 8 & c;
  }
  return o;
}

// Pure JS Base64 decoder to inject into the files
const base64DecodeFnStr = `
function base64Decode(b64) {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  var lookup = new Uint8Array(256);
  for (var i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }
  var len = b64.length;
  var bufferLength = len * 0.75;
  if (b64[len - 1] === '=') {
    bufferLength--;
    if (b64[len - 2] === '=') {
      bufferLength--;
    }
  }
  var bytes = new Uint8Array(bufferLength);
  var p = 0;
  for (var i = 0; i < len; i += 4) {
    var encoded1 = lookup[b64.charCodeAt(i)];
    var encoded2 = lookup[b64.charCodeAt(i + 1)];
    var encoded3 = lookup[b64.charCodeAt(i + 2)];
    var encoded4 = lookup[b64.charCodeAt(i + 3)];
    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (p < bufferLength) bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    if (p < bufferLength) bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }
  return bytes;
}
`;

function patchSatellite() {
  const targets = [
    path.join(__dirname, 'node_modules', 'satellite.js', 'wasm-build', 'base-release', 'index.js'),
    path.join(__dirname, 'node_modules', 'satellite.js', 'wasm-build', 'pthreads-release', 'index.js')
  ];

  targets.forEach((filePath) => {
    console.log(`Patching ${filePath}...`);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');

    // Skip if already patched
    if (content.includes('base64Decode(')) {
      console.log(`File is already patched: ${filePath}`);
      return;
    }

    // Find where findWasmBinary function calls binaryDecode
    const pattern = /function\s+findWasmBinary\s*\(\s*\)\s*\{\s*return\s+binaryDecode\s*\(\s*'/;
    const match = content.match(pattern);
    if (!match) {
      console.warn(`Could not find findWasmBinary pattern in ${filePath}`);
      return;
    }

    const matchIndex = match.index;
    const quoteStart = content.indexOf("'", matchIndex);
    if (quoteStart === -1) {
      console.warn(`Could not find opening quote after match in ${filePath}`);
      return;
    }

    let quoteEnd = -1;
    let isEscaped = false;
    for (let i = quoteStart + 1; i < content.length; i++) {
      if (isEscaped) {
        isEscaped = false;
      } else if (content[i] === '\\') {
        isEscaped = true;
      } else if (content[i] === "'") {
        quoteEnd = i;
        break;
      }
    }

    if (quoteEnd === -1) {
      console.warn(`Could not find closing quote in ${filePath}`);
      return;
    }

    const nextChar1 = content[quoteEnd + 1];
    const nextChar2 = content[quoteEnd + 2];
    if (nextChar1 !== ')' || nextChar2 !== '}') {
      console.warn(`Unexpected characters after closing quote in ${filePath}: ${nextChar1}${nextChar2}`);
      return;
    }

    const stringLiteral = content.substring(quoteStart, quoteEnd + 1);
    const actualString = eval(stringLiteral);
    const decoded = binaryDecode(actualString);
    const base64 = Buffer.from(decoded).toString('base64');

    const newCall = `${base64DecodeFnStr}\nfunction findWasmBinary(){return base64Decode('${base64}')}`;
    const patchedContent = content.substring(0, matchIndex) + newCall + content.substring(quoteEnd + 3);

    fs.writeFileSync(filePath, patchedContent, 'utf8');
    console.log(`Successfully patched ${filePath}`);
  });
}

function patchSpzLoader() {
  const filePath = path.join(__dirname, 'node_modules', '@spz-loader', 'core', 'dist', 'index.js');
  console.log(`Patching ${filePath}...`);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  // Skip if already patched
  if (content.includes('base64Decode(')) {
    console.log(`File is already patched: ${filePath}`);
    return;
  }

  const patternStr = 'er(\`';
  const patternIndex = content.indexOf(patternStr);
  if (patternIndex === -1) {
    console.warn('Could not find er(` pattern in @spz-loader/core');
    return;
  }

  const quoteStart = patternIndex + patternStr.length - 1;

  let quoteEnd = -1;
  let isEscaped = false;
  for (let i = quoteStart + 1; i < content.length; i++) {
    if (isEscaped) {
      isEscaped = false;
    } else if (content[i] === '\\') {
      isEscaped = true;
    } else if (content[i] === '`') {
      quoteEnd = i;
      break;
    }
  }

  if (quoteEnd === -1) {
    console.warn('Could not find closing backtick in @spz-loader/core');
    return;
  }

  const nextChar1 = content[quoteEnd + 1];
  const nextChar2 = content[quoteEnd + 2];
  if (nextChar1 !== ')' || nextChar2 !== ')') {
    console.warn(`Unexpected characters after closing backtick in @spz-loader/core: ${nextChar1}${nextChar2}`);
    return;
  }

  const templateLiteralStr = content.substring(quoteStart, quoteEnd + 1);
  const actualString = eval(templateLiteralStr);
  const decodedWasm = binaryDecode(actualString);
  const base64 = Buffer.from(decodedWasm).toString('base64');

  // Replace er(`...`) with base64Decode('...')
  const replaceStart = patternIndex + 5; // index of "er("
  const replaceEnd = quoteEnd + 2; // index after the closing paren of er(...)
  const newCall = `base64Decode('${base64}')`;
  const patchedContent = base64DecodeFnStr + '\n' + content.substring(0, replaceStart) + newCall + content.substring(replaceEnd);

  fs.writeFileSync(filePath, patchedContent, 'utf8');
  console.log(`Successfully patched ${filePath}`);
}

console.log('Running post-install WASM patches...');
try {
  patchSatellite();
  patchSpzLoader();
  console.log('Post-install patches completed successfully.');
} catch (err) {
  console.error('Error applying post-install patches:', err);
  process.exit(1);
}
