// Dark Mode Management
const DarkMode = {
    init() {
        const saved = localStorage.getItem('theme') || 'light';
        if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        }
    },

    toggle() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        return isDark;
    }
};

// Toast Notification System
const Toast = {
    container: null,
    init() {
        this.container = document.createElement('div');
        this.container.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none';
        document.body.appendChild(this.container);
    },

    show(message, type = 'info') {
        if (!this.container) this.init();
        
        const toast = document.createElement('div');
        const colors = {
            success: 'bg-emerald-500',
            error: 'bg-red-500',
            info: 'bg-primary-500'
        };
        const icons = {
            success: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>',
            error: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>',
            info: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>'
        };

        toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white ${colors[type]} animate-slide-up transform transition-all duration-300`;
        toast.innerHTML = `
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">${icons[type]}</svg>
            <span class="text-sm font-medium">${message}</span>
        `;

        this.container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// API Helper
const API = {
    baseUrl: '/api',

    async request(endpoint, options = {}) {
        try {
            const res = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: { 'Content-Type': 'application/json', ...options.headers }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (err) {
            Toast.show(err.message || 'Request failed', 'error');
            throw err;
        }
    },

    get(url) { return this.request(url); },
    post(url, data) { return this.request(url, { method: 'POST', body: JSON.stringify(data) }); },
    put(url, data) { return this.request(url, { method: 'PUT', body: JSON.stringify(data) }); }
};

// Sound Manager using Web Audio API
const SoundManager = {
    ctx: null,
    sounds: {
        chime: null,
        bowl: null,
        birdsong: null
    },

    init() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.generateSounds();
    },

    generateSounds() {
        const createOscillatorSound = (freqs, duration, type = 'sine') => {
            return () => {
                if (!this.ctx) this.init();
                const now = this.ctx.currentTime;
                freqs.forEach((f, i) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = type;
                    osc.frequency.value = f;
                    gain.gain.setValueAtTime(0, now);
                    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + i * 0.1);
                    osc.stop(now + duration + i * 0.1);
                });
            };
        };

        this.sounds.chime = createOscillatorSound([880, 1108.73, 1318.51], 2);
        this.sounds.bowl = createOscillatorSound([256, 384, 512], 4, 'triangle');
        this.sounds.birdsong = () => {
            if (!this.ctx) this.init();
            const now = this.ctx.currentTime;
            for (let i = 0; i < 3; i++) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1200 + i * 200, now + i * 0.15);
                osc.frequency.exponentialRampToValueAtTime(1800 + i * 200, now + i * 0.15 + 0.1);
                gain.gain.setValueAtTime(0, now + i * 0.15);
                gain.gain.linearRampToValueAtTime(0.15, now + i * 0.15 + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.3);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + i * 0.15);
                osc.stop(now + i * 0.15 + 0.3);
            }
        };
    },

    play(type = 'chime') {
        if (!this.ctx) this.init();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        if (this.sounds[type]) this.sounds[type]();
    }
};

// Global Timer State
const TimerState = {
    isRunning: false,
    remainingSeconds: 1800,
    totalSeconds: 1800,
    intervalMinutes: 30,
    listeners: [],

    setState(newState) {
        Object.assign(this, newState);
        this.save();
        this.notify();
    },

    subscribe(fn) {
        this.listeners.push(fn);
        return () => this.listeners = this.listeners.filter(l => l !== fn);
    },

    notify() {
        this.listeners.forEach(fn => fn(this));
    },

    save() {
        localStorage.setItem('timerState', JSON.stringify({
            remainingSeconds: this.remainingSeconds,
            totalSeconds: this.totalSeconds,
            intervalMinutes: this.intervalMinutes
        }));
    },

    load() {
        const saved = localStorage.getItem('timerState');
        if (saved) {
            const data = JSON.parse(saved);
            Object.assign(this, data);
        }
    }
};

// Navigation
const Navigation = {
    currentPage: 'timer',

    init() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                if (page) this.navigate(page);
            });
        });

        window.addEventListener('popstate', (e) => {
            if (e.state?.page) this.navigate(e.state.page, false);
        });

        const hashPage = window.location.hash.slice(1);
        if (hashPage) this.navigate(hashPage, false);
    },

    navigate(page, updateHistory = true) {
        this.currentPage = page;
        
        document.querySelectorAll('.nav-btn').forEach(btn => {
            const isActive = btn.dataset.page === page;
            btn.classList.toggle('bg-white', isActive);
            btn.classList.toggle('dark:bg-slate-700', isActive);
            btn.classList.toggle('shadow-sm', isActive);
            btn.classList.toggle('text-primary-600', isActive);
            btn.classList.toggle('dark:text-primary-400', isActive);
        });

        if (updateHistory) {
            history.pushState({ page }, '', `#${page}`);
        }

        window.dispatchEvent(new CustomEvent('pageChange', { detail: { page } }));
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    DarkMode.init();
    TimerState.load();
    Toast.init();
    Navigation.init();

    // Dark mode toggle handler
    const darkModeBtn = document.getElementById('darkModeToggle');
    if (darkModeBtn) {
        darkModeBtn.addEventListener('click', () => {
            const isDark = DarkMode.toggle();
            const icon = darkModeBtn.querySelector('svg');
            if (isDark) {
                icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>';
            } else {
                icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>';
            }
        });
    }
});