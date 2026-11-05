const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');
const config = require('../app.json').expo;
const decode = file => PNG.sync.read(fs.readFileSync(path.join(__dirname, '..', file)));

test('launcher icon is a square opaque PNG, and the favicon is exported at 64px', () => {
  for (const [file, size] of [[config.icon, 1024], [config.web.favicon, 64]]) {
    const png = decode(file);
    assert.equal(png.width, size);
    assert.equal(png.height, size);
    for (let index = 3; index < png.data.length; index += 4) assert.equal(png.data[index], 255);
    const colors = new Set();
    for (let index = 0; index < png.data.length; index += 4) colors.add(png.data.subarray(index, index + 3).toString('hex'));
    assert.ok(colors.size > 2, 'The exported icon must contain its mark and antialiased edges.');
  }
});

test('adaptive foreground and monochrome art stay inside the Android circular safe zone', () => {
  for (const file of [config.android.adaptiveIcon.foregroundImage, config.android.adaptiveIcon.monochromeImage]) {
    const png = decode(file);
    assert.equal(png.width, 1024);
    assert.equal(png.height, 1024);
    assert.equal(png.data[3], 0, 'Adaptive foreground corners must remain transparent.');
    let visible = 0;
    for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
      const index = (y * png.width + x) * 4;
      if (png.data[index + 3] === 0) continue;
      visible++;
      assert.ok(Math.hypot(x - 512, y - 512) < 1024 / 3, 'The mark must survive circular launcher masks.');
      if (file === config.android.adaptiveIcon.monochromeImage) {
        assert.equal(png.data[index], 255);
        assert.equal(png.data[index + 1], 255);
        assert.equal(png.data[index + 2], 255);
      }
    }
    assert.ok(visible > 50000, 'The foreground must contain a substantial visible mark.');
  }
});

test('adaptive background fills the canvas and agrees with the configured brand color', () => {
  const png = decode(config.android.adaptiveIcon.backgroundImage);
  assert.equal(png.width, 1024);
  assert.equal(png.height, 1024);
  const expected = Buffer.from(config.android.adaptiveIcon.backgroundColor.slice(1) + 'ff', 'hex');
  for (let index = 0; index < png.data.length; index += 4) assert.ok(png.data.subarray(index, index + 4).equals(expected));
});
