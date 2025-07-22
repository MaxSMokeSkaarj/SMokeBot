import https from 'https';
import { Buffer } from 'buffer';

export const get = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      // Собираем данные по частям
      res.on('data', (chunk) => {
        data += chunk;
      });

      // Завершение получения данных
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(new Error('Ошибка запроса: ' + err.message));
    });
  });
};

export const post = (url, body, headers) => {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(body)),
        ...headers
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Ошибка парсинга JSON: ' + e.message));
          }
        } else {
          reject(new Error(`Ошибка сервера: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error('Ошибка запроса: ' + err.message));
    });

    req.write(JSON.stringify(body));
    req.end();
  });
};