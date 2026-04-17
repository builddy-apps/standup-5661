import express from 'express';
import cors from 'cors';
import db from './db.js';
import { getSetting, setSetting, calculateStreak } from './db.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// POST /api/sessions - record standing session
app.post('/api/sessions', (req, res) => {
    try {
        const { type, duration_minutes, started_at } = req.body;
        
        if (!type || !duration_minutes) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }
        
        const stmt = db.prepare(`
            INSERT INTO sessions (type, duration_minutes, started_at)
            VALUES (?, ?, ?)
        `);
        
        const result = stmt.run(type, duration_minutes, started_at || new Date().toISOString());
        
        // Update daily goals
        const today = new Date().toISOString().split('T')[0];
        const targetMinutes = parseInt(getSetting('daily_goal_minutes') || '30');
        
        const existingGoal = db.prepare('SELECT * FROM daily_goals WHERE date = ?').get(today);
        
        if (!existingGoal) {
            db.prepare(`
                INSERT INTO daily_goals (date, target_minutes, achieved_minutes, is_achieved)
                VALUES (?, ?, ?, 0)
            `).run(today, targetMinutes, duration_minutes);
        } else {
            db.prepare(`
                UPDATE daily_goals
                SET achieved_minutes = achieved_minutes + ?
                WHERE date = ?
            `).run(duration_minutes, today);
        }
        
        // Check if goal is achieved
        db.prepare(`
            UPDATE daily_goals
            SET is_achieved = CASE WHEN achieved_minutes >= target_minutes THEN 1 ELSE 0 END
            WHERE date = ?
        `).run(today);
        
        res.json({ success: true, data: { id: result.lastInsertRowid } });
    } catch (err) {
        console.error('Error recording session:', err);
        res.status(500).json({ success: false, error: 'Failed to record session' });
    }
});

// GET /api/stats/daily/:date - get daily statistics
app.get('/api/stats/daily/:date', (req, res) => {
    try {
        const { date } = req.params;
        
        const goalStmt = db.prepare('SELECT * FROM daily_goals WHERE date = ?');
        const goal = goalStmt.get(date);
        
        const sessionsStmt = db.prepare(`
            SELECT * FROM sessions
            WHERE DATE(started_at) = ?
        `);
        const sessions = sessionsStmt.all(date);
        
        const totalStandingMinutes = sessions
            .filter(s => s.type === 'standing')
            .reduce((sum, s) => sum + s.duration_minutes, 0);
        
        const response = {
            goal: goal || { target_minutes: 30, achieved_minutes: 0, is_achieved: 0 },
            sessions,
            totalStandingMinutes
        };
        
        res.json({ success: true, data: response });
    } catch (err) {
        console.error('Error fetching daily stats:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch daily stats' });
    }
});

// GET /api/stats/weekly - get weekly statistics
app.get('/api/stats/weekly', (req, res) => {
    try {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1);
        
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            days.push(d.toISOString().split('T')[0]);
        }
        
        const goalsStmt = db.prepare(`
            SELECT * FROM daily_goals
            WHERE date IN (${days.map(() => '?').join(',')})
        `);
        const goals = goalsStmt.all(...days);
        
        const sessionsStmt = db.prepare(`
            SELECT * FROM sessions
            WHERE DATE(started_at) IN (${days.map(() => '?').join(',')})
        `);
        const sessions = sessionsStmt.all(...days);
        
        const weeklyData = days.map(date => {
            const dayGoal = goals.find(g => g.date === date);
            const daySessions = sessions.filter(s => s.started_at.startsWith(date));
            const standingMinutes = daySessions
                .filter(s => s.type === 'standing')
                .reduce((sum, s) => sum + s.duration_minutes, 0);
            
            return {
                date,
                targetMinutes: dayGoal?.target_minutes || 30,
                achievedMinutes: dayGoal?.achieved_minutes || 0,
                standingMinutes,
                isAchieved: dayGoal?.is_achieved || 0,
                sessions: daySessions.length
            };
        });
        
        const totalStandingMinutes = weeklyData.reduce((sum, d) => sum + d.standingMinutes, 0);
        const totalSessions = weeklyData.reduce((sum, d) => sum + d.sessions, 0);
        const daysAchieved = weeklyData.filter(d => d.isAchieved).length;
        
        res.json({
            success: true,
            data: {
                weeklyData,
                totalStandingMinutes,
                totalSessions,
                daysAchieved,
                averageStanding: Math.round(totalStandingMinutes / 7)
            }
        });
    } catch (err) {
        console.error('Error fetching weekly stats:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch weekly stats' });
    }
});

// GET /api/streaks - get current streak with motivational message
app.get('/api/streaks', (req, res) => {
    try {
        const streak = calculateStreak();
        
        const messages = {
            0: "Start your journey today! Every stand counts.",
            1: "Great start! Keep the momentum going.",
            3: "Three days strong! You're building a healthy habit.",
            7: "A full week! Amazing dedication to your health.",
            14: "Two weeks of consistency! You're unstoppable!",
            30: "A whole month! Your body thanks you.",
            default: `${streak} days of standing strong! Keep it up!`
        };
        
        const message = messages[streak] || messages.default;
        
        res.json({
            success: true,
            data: {
                currentStreak: streak,
                message
            }
        });
    } catch (err) {
        console.error('Error fetching streaks:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch streaks' });
    }
});

// GET /api/settings - get all settings
app.get('/api/settings', (req, res) => {
    try {
        const stmt = db.prepare('SELECT key, value FROM settings');
        const rows = stmt.all();
        
        const settings = {};
        rows.forEach(row => {
            settings[row.key] = row.value;
        });
        
        res.json({ success: true, data: settings });
    } catch (err) {
        console.error('Error fetching settings:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch settings' });
    }
});

// PUT /api/settings - update settings
app.put('/api/settings', (req, res) => {
    try {
        const settings = req.body;
        
        if (!settings || Object.keys(settings).length === 0) {
            return res.status(400).json({ success: false, error: 'No settings provided' });
        }
        
        const now = new Date().toISOString();
        const updateStmt = db.prepare(`
            INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?
        `);
        
        const updateTransaction = db.transaction((s) => {
            for (const [key, value] of Object.entries(s)) {
                updateStmt.run(key, String(value), now, String(value), now);
            }
        });
        
        updateTransaction(settings);
        
        res.json({ success: true, data: { updated: Object.keys(settings) } });
    } catch (err) {
        console.error('Error updating settings:', err);
        res.status(500).json({ success: false, error: 'Failed to update settings' });
    }
});

// GET /api/exercises/random - get random micro-exercise
app.get('/api/exercises/random', (req, res) => {
    try {
        const countStmt = db.prepare('SELECT COUNT(*) as count FROM exercises');
        const { count } = countStmt.get();
        
        if (count === 0) {
            return res.json({ success: true, data: null });
        }
        
        const randomOffset = Math.floor(Math.random() * count);
        const stmt = db.prepare('SELECT * FROM exercises LIMIT 1 OFFSET ?');
        const exercise = stmt.get(randomOffset);
        
        res.json({ success: true, data: exercise });
    } catch (err) {
        console.error('Error fetching random exercise:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch exercise' });
    }
});

// 404 fallback
app.use((req, res) => {
    res.status(404).json({ success: false, error: 'Not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`StandUp server running on port ${PORT}`);
});