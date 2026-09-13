import https from 'https';
import { Buffer } from 'buffer';

const REQUEST_TIMEOUT = 10_000;
const MAX_RESPONSE_SIZE = 1024 * 1024;

const collectResponse = (res, parseJson, resolve, reject) => {
  let data = '';
  let size = 0;
  let settled = false;

  const fail = error => {
    if (settled) return;
    settled = true;
    reject(error);
    res.destroy();
  };

  res.on('data', chunk => {
    if (settled) return;
    size += chunk.length;
    if (size > MAX_RESPONSE_SIZE) {
      fail(new Error('Ответ сервера слишком большой'));
      return;
    }
    data += chunk;
  });

  res.on('error', fail);

  res.on('end', () => {
    if (settled) return;
    settled = true;

    if (res.statusCode < 200 || res.statusCode >= 300) {
      reject(new Error(`Ошибка сервера: ${res.statusCode}`));
      return;
    }

    if (!parseJson) {
      resolve(data);
      return;
    }

    try {
      resolve(JSON.parse(data));
    } catch (error) {
      reject(new Error(`Ошибка парсинга JSON: ${error.message}`));
    }
  });
};

export const get = url => new Promise((resolve, reject) => {
  const req = https.get(url, res => collectResponse(res, false, resolve, reject));

  req.setTimeout(REQUEST_TIMEOUT, () => {
    req.destroy(new Error('Таймаут запроса'));
  });

  req.on('error', error => reject(new Error(`Ошибка запроса: ${error.message}`)));
});

export const post = (url, body, headers = {}) => new Promise((resolve, reject) => {
  const payload = JSON.stringify(body);
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      ...headers
    }
  };

  const req = https.request(url, options, res => collectResponse(res, true, resolve, reject));

  req.setTimeout(REQUEST_TIMEOUT, () => {
    req.destroy(new Error('Таймаут запроса'));
  });

  req.on('error', error => reject(new Error(`Ошибка запроса: ${error.message}`)));
  req.write(payload);
  req.end();
});
