function problem(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

function text(value, label, max = 150, required = true) {
  if (value == null && !required) return null;
  if (typeof value !== 'string' || (required && !value.trim()) || value.trim().length > max) {
    throw problem(400, `${label} wajib diisi dengan benar (maksimal ${max} karakter).`);
  }
  return value.trim() || null;
}

function email(value) {
  const normalized = text(value, 'Email', 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw problem(400, 'Format email tidak valid.');
  return normalized;
}

function password(value) {
  if (typeof value !== 'string' || value.length < 8 || Buffer.byteLength(value, 'utf8') > 72) {
    throw problem(400, 'Kata sandi minimal 8 karakter dan maksimal 72 byte.');
  }
  return value;
}

function id(value) {
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value))) throw problem(400, 'ID tidak valid.');
  return Number(value);
}

async function transaction(pool, run) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await run(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { problem, text, email, password, id, transaction };
