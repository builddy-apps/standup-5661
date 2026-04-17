import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.join(__dirname, '..', 'data');

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

const schema = `
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    started_at TEXT NOT NULL,
    created_at DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daily_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    target_minutes INTEGER NOT NULL DEFAULT 30,
    achieved_minutes INTEGER DEFAULT 0,
    is_achieved INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    created_at DATETIME DEFAULT (datetime('now'))
);
`;

db.exec(schema);

const exerciseCount = db.prepare('SELECT COUNT(*) as count FROM exercises').get().count;
if (exerciseCount === 0) {
    const insertExercise = db.prepare('INSERT INTO exercises (name, description, category) VALUES (?, ?, ?)');
    const exercises = [
        ['Neck Rolls', 'Slowly roll your head in a circle, 5 times each direction.', 'Neck'],
        ['Shoulder Shrugs', 'Raise shoulders to ears, hold for 3s, release slowly.', 'Shoulders'],
        ['Torso Twist', 'Stand and gently twist your upper body left and right.', 'Back'],
        ['Forward Fold', 'Bend forward at the waist, reaching towards your toes.', 'Legs'],
        ['Wrist Stretch', 'Extend arm, palm out, pull fingers back gently.', 'Arms'],
        ['Deep Breath', 'Inhale deeply for 4s, hold 4s, exhale 4s.', 'Relaxation'],
        ['Leg Swings', 'Gently swing one leg back and forth while holding support.', 'Legs'],
        ['Overhead Reach', 'Interlace fingers and stretch arms upwards.', 'Upper Body']
    ];
    const insertMany = db.transaction((list) => {
        for (const item of list) insertExercise.run(item);
    });
    insertMany(exercises);
}

const defaultSettings = [
    { key: 'interval_minutes', value: '30' },
    { key: 'sound_type', value: 'chime' },
    { key: 'daily_goal_minutes', value: '30' },
    { key: 'theme', value: 'light' }
];

const initSettings = db.transaction((settings) => {
    const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    for (const s of settings) stmt.run(s.key, s.value);
});
initSettings(defaultSettings);

export function getSetting(key) {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : null;
}

export function setSetting(key, value) {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
        INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?
    `);
    return stmt.run(key, value, now, value, now);
}

export function calculateStreak() {
    const rows = db.prepare(`
        SELECT date FROM daily_goals
        WHERE is_achieved = 1
        ORDER BY date DESC
    `).all();

    if (rows.length === 0) return 0;

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const formatDate = (d) => d.toISOString().split('T')[0];
    const todayStr = formatDate(today);
    const yesterdayStr = formatDate(yesterday);

    if (rows[0].date !== todayStr && rows[0].date !== yesterdayStr) {
        return 0;
    }

    let streak = 0;
    let prevDate = new Date(rows[0].date);

    for (let i = 0; i < rows.length; i++) {
        if (i === 0) {
            streak++;
            continue;
        }

        const currentDate = new Date(rows[i].date);
        const diffTime = Math.abs(prevDate - currentDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            streak++;
            prevDate = currentDate;
        } else {
            break;
        }
    }

    return streak;
}

export default db;