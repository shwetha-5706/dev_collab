import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSeedData } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data', 'db.json');

let cache = null;

export function readDb() {
  if (cache) return structuredClone(cache);
  if (!fs.existsSync(DB_PATH)) {
    const seed = getSeedData();
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2));
    cache = seed;
    return structuredClone(seed);
  }
  cache = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  return structuredClone(cache);
}

export function writeDb(updater) {
  const db = readDb();
  const next = typeof updater === 'function' ? updater(db) : updater;
  cache = next;
  fs.writeFileSync(DB_PATH, JSON.stringify(next, null, 2));
  return structuredClone(next);
}

export function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
