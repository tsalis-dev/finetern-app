const fileNamePattern = /^[a-f0-9-]{36}\.(pdf|png|jpg)$/;

function extension(buffer) {
  if (buffer.subarray(0, 5).toString() === '%PDF-') return 'pdf';
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png';
  if (buffer.length >= 3 && buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return 'jpg';
  return null;
}

module.exports = { extension, fileNamePattern };
