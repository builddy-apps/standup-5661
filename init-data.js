import Database from 'better-sqlite3';
import fs from 'fs';
import crypto from 'crypto';

// Create data directory if it doesn't exist
fs.mkdirSync('data', { recursive: true });

const db = new Database('./data/app.db');
db.pragma('journal_mode = WAL');

// Check if data already seeded
const count = db.prepare('SELECT COUNT(*) as count FROM sessions').get();
if (count.count > 0) {
    console.log('Data already seeded, skipping...');
    process.exit(0);
}

// Helper function to generate dates
const daysAgo = (days) => {
    const date = new Date(Date.now() - days * 86400000);
    return date.toISOString();
};

const formatDate = (days) => {
    const date = new Date(Date.now() - days * 86400000);
    return date.toISOString().split('T')[0];
};

// Insert all seed data in a transaction
const insertAll = db.transaction(() => {
    // Insert additional exercises beyond the defaults
    const insertExercise = db.prepare('INSERT INTO exercises (name, description, category, created_at) VALUES (?, ?, ?, ?)');
    
    const additionalExercises = [
        ['Side Neck Stretch', 'Gently tilt your head to one side, bringing ear toward shoulder. Hold for 15 seconds each side.', 'Neck', daysAgo(25)],
        ['Chest Opener', 'Clasp hands behind your back and lift arms slightly while opening your chest.', 'Upper Body', daysAgo(23)],
        ['Calf Raises', 'Rise onto your toes, hold for 2 seconds, then slowly lower back down. Repeat 10 times.', 'Legs', daysAgo(21)],
        ['Hip Circles', 'Place hands on hips and make slow circles with your hips, 10 times each direction.', 'Core', daysAgo(19)],
        ['Finger Stretches', 'Spread fingers wide, then make a fist. Repeat 10 times to relieve typing tension.', 'Arms', daysAgo(17)],
        ['Standing Cat-Cow', 'Alternate between arching and rounding your back while standing.', 'Back', daysAgo(15)],
        ['Quad Stretch', 'Stand on one leg, pull the other foot toward your glutes. Hold 15 seconds each side.', 'Legs', daysAgo(13)],
        ['Arm Circles', 'Extend arms to sides and make small circles, gradually increasing size. 20 rotations each direction.', 'Arms', daysAgo(11)],
        ['Ankle Rolls', 'Lift one foot and rotate ankle in circles, 10 times each direction each foot.', 'Legs', daysAgo(9)],
        ['Spinal Extension', 'Stand with hands on lower back, gently lean backwards. Hold for 10 seconds.', 'Back', daysAgo(7)]
    ];
    
    for (const exercise of additionalExercises) {
        insertExercise.run(exercise);
    }
    
    // Insert sessions - realistic standing intervals over 30 days
    const insertSession = db.prepare('INSERT INTO sessions (type, duration_minutes, started_at, created_at) VALUES (?, ?, ?, ?)');
    
    const sessions = [
        // Day 30 (oldest)
        { type: 'standing', duration: 5, day: 30, hour: 9 },
        { type: 'standing', duration: 7, day: 30, hour: 14 },
        { type: 'standing', duration: 4, day: 30, hour: 16 },
        
        // Day 29
        { type: 'standing', duration: 6, day: 29, hour: 10 },
        { type: 'standing', duration: 8, day: 29, hour: 13 },
        { type: 'standing', duration: 5, day: 29, hour: 15 },
        { type: 'standing', duration: 3, day: 29, hour: 17 },
        
        // Day 28
        { type: 'standing', duration: 10, day: 28, hour: 9 },
        { type: 'standing', duration: 7, day: 28, hour: 11 },
        { type: 'standing', duration: 8, day: 28, hour: 15 },
        
        // Day 27
        { type: 'standing', duration: 5, day: 27, hour: 10 },
        { type: 'standing', duration: 6, day: 27, hour: 14 },
        
        // Day 26
        { type: 'standing', duration: 8, day: 26, hour: 9 },
        { type: 'standing', duration: 7, day: 26, hour: 12 },
        { type: 'standing', duration: 9, day: 26, hour: 16 },
        
        // Day 25
        { type: 'standing', duration: 5, day: 25, hour: 10 },
        { type: 'standing', duration: 6, day: 25, hour: 14 },
        { type: 'standing', duration: 4, day: 25, hour: 16 },
        
        // Day 24
        { type: 'standing', duration: 7, day: 24, hour: 9 },
        { type: 'standing', duration: 8, day: 24, hour: 13 },
        { type: 'standing', duration: 6, day: 24, hour: 15 },
        
        // Day 23
        { type: 'standing', duration: 5, day: 23, hour: 10 },
        { type: 'standing', duration: 4, day: 23, hour: 14 },
        
        // Day 22
        { type: 'standing', duration: 10, day: 22, hour: 9 },
        { type: 'standing', duration: 8, day: 22, hour: 11 },
        { type: 'standing', duration: 7, day: 22, hour: 14 },
        { type: 'standing', duration: 6, day: 22, hour: 16 },
        
        // Day 21
        { type: 'standing', duration: 6, day: 21, hour: 10 },
        { type: 'standing', duration: 5, day: 21, hour: 13 },
        { type: 'standing', duration: 7, day: 21, hour: 15 },
        
        // Day 20
        { type: 'standing', duration: 4, day: 20, hour: 11 },
        
        // Day 19
        { type: 'standing', duration: 8, day: 19, hour: 9 },
        { type: 'standing', duration: 7, day: 19, hour: 12 },
        { type: 'standing', duration: 6, day: 19, hour: 15 },
        { type: 'standing', duration: 9, day: 19, hour: 17 },
        
        // Day 18
        { type: 'standing', duration: 5, day: 18, hour: 10 },
        { type: 'standing', duration: 6, day: 18, hour: 14 },
        { type: 'standing', duration: 7, day: 18, hour: 16 },
        
        // Day 17
        { type: 'standing', duration: 3, day: 17, hour: 15 },
        
        // Day 16
        { type: 'standing', duration: 6, day: 16, hour: 9 },
        { type: 'standing', duration: 8, day: 16, hour: 11 },
        { type: 'standing', duration: 5, day: 16, hour: 14 },
        
        // Day 15
        { type: 'standing', duration: 7, day: 15, hour: 10 },
        { type: 'standing', duration: 9, day: 15, hour: 13 },
        { type: 'standing', duration: 6, day: 15, hour: 16 },
        
        // Day 14
        { type: 'standing', duration: 5, day: 14, hour: 9 },
        { type: 'standing', duration: 8, day: 14, hour: 12 },
        { type: 'standing', duration: 7, day: 14, hour: 15 },
        { type: 'standing', duration: 6, day: 14, hour: 17 },
        
        // Day 13
        { type: 'standing', duration: 4, day: 13, hour: 10 },
        { type: 'standing', duration: 5, day: 13, hour: 14 },
        
        // Day 12
        { type: 'standing', duration: 8, day: 12, hour: 9 },
        { type: 'standing', duration: 7, day: 12, hour: 11 },
        { type: 'standing', duration: 9, day: 12, hour: 14 },
        { type: 'standing', duration: 6, day: 12, hour: 16 },
        
        // Day 11
        { type: 'standing', duration: 6, day: 11, hour: 10 },
        { type: 'standing', duration: 7, day: 11, hour: 13 },
        { type: 'standing', duration: 5, day: 11, hour: 16 },
        
        // Day 10
        { type: 'standing', duration: 5, day: 10, hour: 14 },
        
        // Day 9
        { type: 'standing', duration: 7, day: 9, hour: 9 },
        { type: 'standing', duration: 8, day: 9, hour: 12 },
        { type: 'standing', duration: 6, day: 9, hour: 15 },
        
        // Day 8
        { type: 'standing', duration: 6, day: 8, hour: 10 },
        { type: 'standing', duration: 5, day: 8, hour: 13 },
        { type: 'standing', duration: 7, day: 8, hour: 16 },
        
        // Day 7
        { type: 'standing', duration: 8, day: 7, hour: 9 },
        { type: 'standing', duration: 7, day: 7, hour: 11 },
        { type: 'standing', duration: 9, day: 7, hour: 14 },
        { type: 'standing', duration: 6, day: 7, hour: 17 },
        
        // Day 6
        { type: 'standing', duration: 5, day: 6, hour: 10 },
        { type: 'standing', duration: 6, day: 6, hour: 14 },
        { type: 'standing', duration: 4, day: 6, hour: 16 },
        
        // Day 5
        { type: 'standing', duration: 7, day: 5, hour: 9 },
        { type: 'standing', duration: 8, day: 5, hour: 12 },
        { type: 'standing', duration: 9, day: 5, hour: 15 },
        
        // Day 4
        { type: 'standing', duration: 6, day: 4, hour: 10 },
        { type: 'standing', duration: 7, day: 4, hour: 13 },
        { type: 'standing', duration: 5, day: 4, hour: 16 },
        
        // Day 3
        { type: 'standing', duration: 8, day: 3, hour: 9 },
        { type: 'standing', duration: 9, day: 3, hour: 11 },
        { type: 'standing', duration: 7, day: 3, hour: 14 },
        { type: 'standing', duration: 6, day: 3, hour: 17 },
        
        // Day 2
        { type: 'standing', duration: 5, day: 2, hour: 10 },
        { type: 'standing', duration: 7, day: 2, hour: 13 },
        { type: 'standing', duration: 6, day: 2, hour: 15 },
        
        // Day 1 (yesterday)
        { type: 'standing', duration: 8, day: 1, hour: 9 },
        { type: 'standing', duration: 7, day: 1, hour: 11 },
        { type: 'standing', duration: 9, day: 1, hour: 14 },
        { type: 'standing', duration: 6, day: 1, hour: 16 },
        
        // Day 0 (today)
        { type: 'standing', duration: 5, day: 0, hour: 8 },
        { type: 'standing', duration: 6, day: 0, hour: 10 },
        { type: 'standing', duration: 7, day: 0, hour: 13 }
    ];
    
    for (const session of sessions) {
        const startedAt = new Date(Date.now() - session.day * 86400000);
        startedAt.setHours(session.hour, Math.floor(Math.random() * 30), Math.floor(Math.random() * 60));
        const createdAt = new Date(startedAt.getTime() + session.duration * 60000);
        
        insertSession.run(
            session.type,
            session.duration,
            startedAt.toISOString(),
            createdAt.toISOString()
        );
    }
    
    // Insert daily goals for the last 30 days
    const insertDailyGoal = db.prepare('INSERT INTO daily_goals (date, target_minutes, achieved_minutes, is_achieved, updated_at) VALUES (?, ?, ?, ?, ?)');
    
    const dailyGoals = [
        // Day 30 - 26 (first 5 days, lower activity, some missed goals)
        { day: 30, target: 30, achieved: 16, achieved_flag: 0 },
        { day: 29, target: 30, achieved: 22, achieved_flag: 0 },
        { day: 28, target: 30, achieved: 25, achieved_flag: 0 },
        { day: 27, target: 30, achieved: 11, achieved_flag: 0 },
        { day: 26, target: 30, achieved: 24, achieved_flag: 0 },
        
        // Day 25 - 21 (getting better)
        { day: 25, target: 30, achieved: 15, achieved_flag: 0 },
        { day: 24, target: 30, achieved: 21, achieved_flag: 0 },
        { day: 23, target: 30, achieved: 9, achieved_flag: 0 },
        { day: 22, target: 30, achieved: 31, achieved_flag: 1 },
        { day: 21, target: 30, achieved: 18, achieved_flag: 0 },
        
        // Day 20 - 16 (mixed)
        { day: 20, target: 30, achieved: 4, achieved_flag: 0 },
        { day: 19, target: 30, achieved: 30, achieved_flag: 1 },
        { day: 18, target: 30, achieved: 18, achieved_flag: 0 },
        { day: 17, target: 30, achieved: 3, achieved_flag: 0 },
        { day: 16, target: 30, achieved: 19, achieved_flag: 0 },
        
        // Day 15 - 11 (streak starts building)
        { day: 15, target: 30, achieved: 22, achieved_flag: 0 },
        { day: 14, target: 30, achieved: 26, achieved_flag: 0 },
        { day: 13, target: 30, achieved: 9, achieved_flag: 0 },
        { day: 12, target: 30, achieved: 30, achieved_flag: 1 },
        { day: 11, target: 30, achieved: 18, achieved_flag: 0 },
        
        // Day 10 - 6 (current streak area)
        { day: 10, target: 30, achieved: 5, achieved_flag: 0 },
        { day: 9, target: 30, achieved: 21, achieved_flag: 0 },
        { day: 8, target: 30, achieved: 18, achieved_flag: 0 },
        { day: 7, target: 30, achieved: 30, achieved_flag: 1 },
        { day: 6, target: 30, achieved: 15, achieved_flag: 0 },
        
        // Day 5 - 1 (recent, good streak)
        { day: 5, target: 30, achieved: 24, achieved_flag: 0 },
        { day: 4, target: 30, achieved: 18, achieved_flag: 0 },
        { day: 3, target: 30, achieved: 30, achieved_flag: 1 },
        { day: 2, target: 30, achieved: 18, achieved_flag: 0 },
        { day: 1, target: 30, achieved: 30, achieved_flag: 1 },
        
        // Day 0 (today, in progress)
        { day: 0, target: 30, achieved: 18, achieved_flag: 0 }
    ];
    
    for (const goal of dailyGoals) {
        const dateStr = formatDate(goal.day);
        const updatedAt = new Date(Date.now() - goal.day * 86400000 + Math.random() * 43200000);
        
        insertDailyGoal.run(
            dateStr,
            goal.target,
            goal.achieved,
            goal.achieved_flag,
            updatedAt.toISOString()
        );
    }
    
    // Update settings with some customizations
    const updateSetting = db.prepare('UPDATE settings SET value = ?, updated_at = ? WHERE key = ?');
    
    const settingsUpdates = [
        { key: 'interval_minutes', value: '45', updated_at: daysAgo(10) },
        { key: 'sound_type', value: 'singing_bowl', updated_at: daysAgo(15) },
        { key: 'daily_goal_minutes', value: '30', updated_at: daysAgo(20) },
        { key: 'theme', value: 'dark', updated_at: daysAgo(5) }
    ];
    
    for (const setting of settingsUpdates) {
        updateSetting.run(setting.value, setting.updated_at, setting.key);
    }
    
    // Add some additional settings
    const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES (?, ?, ?)');
    
    const additionalSettings = [
        { key: 'notification_enabled', value: 'true', updated_at: daysAgo(25) },
        { key: 'snooze_duration', value: '5', updated_at: daysAgo(20) },
        { key: 'auto_start', value: 'true', updated_at: daysAgo(12) }
    ];
    
    for (const setting of additionalSettings) {
        insertSetting.run(setting.key, setting.value, setting.updated_at);
    }
});

insertAll();

// Get counts for summary
const sessionCount = db.prepare('SELECT COUNT(*) as count FROM sessions').get().count;
const goalCount = db.prepare('SELECT COUNT(*) as count FROM daily_goals').get().count;
const exerciseCount = db.prepare('SELECT COUNT(*) as count FROM exercises').get().count;
const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get().count;

db.close();

console.log('StandUp app seeded successfully!');
console.log(`Seeded: ${sessionCount} sessions, ${goalCount} daily goals, ${exerciseCount} exercises, ${settingsCount} settings`);
console.log('');
console.log('The app now shows 30 days of realistic standing activity.');
console.log('Current streak: 2 days (yesterday and day 3 were achieved)');
console.log('Theme set to: dark mode');
console.log('Interval set to: 45 minutes');