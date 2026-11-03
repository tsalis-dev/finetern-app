const path = require('node:path');
const fs = require('node:fs');
const dotenv = require('dotenv');
const file = path.join(__dirname, '../.local/finetern_demo_class/demo.env');
const manifest = path.join(path.dirname(file), 'manifest.json');
if (!fs.existsSync(file) || !fs.existsSync(manifest)) throw new Error('Selesaikan npm run demo:prepare terlebih dahulu.');
dotenv.config({ path: file, override: true, quiet: true });
if (process.env.DB_NAME !== 'finetern_demo_class' || process.env.PORT !== '5001' || !['localhost', '127.0.0.1', '::1'].includes(process.env.DB_HOST)) {
  throw new Error('Konfigurasi demo lokal tidak valid.');
}
require('../server');
