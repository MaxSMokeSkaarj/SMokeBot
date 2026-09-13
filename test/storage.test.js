import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { Database } from '../lib/db.js';
import { withFileLock } from '../lib/file-lock.js';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const createTempDirectory = async () => mkdtemp(join(tmpdir(), 'smokebot-test-'));

test('withFileLock serializes concurrent processes', async () => {
  const directory = await createTempDirectory();
  const resource = join(directory, 'resource');
  const events = [];

  try {
    await Promise.all([
      withFileLock(resource, async () => {
        events.push('first:start');
        await delay(50);
        events.push('first:end');
      }),
      withFileLock(resource, async () => {
        events.push('second:start');
        events.push('second:end');
      })
    ]);

    assert.deepEqual(events, [
      'first:start',
      'first:end',
      'second:start',
      'second:end'
    ]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Database.readAll ignores bank and transaction files', async () => {
  const directory = await createTempDirectory();

  try {
    await writeFile(join(directory, '1.json'), JSON.stringify({ id: '1', money: 10 }));
    await writeFile(join(directory, '2.json'), JSON.stringify({ id: '2', money: 20 }));
    await writeFile(join(directory, 'bank.json'), JSON.stringify({ balance: 100 }));
    await writeFile(join(directory, 'economy-transaction.json'), JSON.stringify({ version: 2 }));

    const database = new Database(directory);
    const users = await database.readAll();

    assert.deepEqual(users.map(user => user.id).sort(), ['1', '2']);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Database rejects corrupted user JSON instead of recreating it', async () => {
  const directory = await createTempDirectory();

  try {
    await writeFile(join(directory, '42.json'), '{not json');
    const database = new Database(directory);

    await assert.rejects(
      database.read('42'),
      /Ошибка чтения данных пользователя 42/
    );

    await assert.rejects(
      database.create('42'),
      /Ошибка чтения данных пользователя 42/
    );

    assert.equal(await readFile(join(directory, '42.json'), 'utf8'), '{not json');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('Database.modify serializes concurrent updates', async () => {
  const directory = await createTempDirectory();

  try {
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, '1.json'), JSON.stringify({ id: '1', counter: 0 }));

    const database = new Database(directory);
    await Promise.all(Array.from({ length: 10 }, () => database.modify('1', async user => {
      const current = user.counter;
      await delay(5);
      user.counter = current + 1;
    })));

    const result = JSON.parse(await readFile(join(directory, '1.json'), 'utf8'));
    assert.equal(result.counter, 10);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
