const Reminder = {
    overlay: null,
    currentExercise: null,

    init() {
        window.addEventListener('timerComplete', () => this.show());
    },

    async show() {
        if (this.overlay) return;

        try {
            const res = await API.get('/exercises/random');
            this.currentExercise = res.data;
        } catch (err) {
            console.error('Failed to load exercise', err);
            this.currentExercise = { 
                name: 'Take a Break', 
                description: 'Stand up, stretch your arms high, and take a deep breath.' 
            };
        }

        this.createOverlay();
        document.body.appendChild(this.overlay);
        
        requestAnimationFrame(() => {
            this.overlay.classList.remove('opacity-0');
            this.overlay.querySelector('.reminder-card').classList.remove('scale-95', 'opacity-0');
        });
    },

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-amber-50/95 dark:bg-slate-900/95 backdrop-blur-md transition-opacity duration-400 opacity-0';
        
        this.overlay.innerHTML = `
            <div class="reminder-card bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center relative overflow-hidden transition-all duration-400 scale-95 opacity-0">
                
                <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-400 via-accent-400 to-primary-400"></div>

                <div class="mb-6 h-40 flex items-center justify-center">
                    <div class="relative w-32 h-32">
                        <svg viewBox="0 0 100 100" class="w-full h-full drop-shadow-lg">
                            <defs>
                                <linearGradient id="charGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style="stop-color:#2dd4bf;stop-opacity:1" />
                                    <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />
                                </linearGradient>
                            </defs>
                            <!-- Head -->
                            <circle cx="50" cy="18" r="10" fill="url(#charGradient)" class="char-part"/>
                            <!-- Body -->
                            <line x1="50" y1="28" x2="50" y2="60" stroke="url(#charGradient)" stroke-width="4" stroke-linecap="round" class="char-part char-body"/>
                            <!-- Arms -->
                            <line x1="50" y1="35" x2="25" y2="50" stroke="url(#charGradient)" stroke-width="4" stroke-linecap="round" class="char-part char-arm-l"/>
                            <line x1="50" y1="35" x2="75" y2="50" stroke="url(#charGradient)" stroke-width="4" stroke-linecap="round" class="char-part char-arm-r"/>
                            <!-- Legs -->
                            <line x1="50" y1="60" x2="35" y2="85" stroke="url(#charGradient)" stroke-width="4" stroke-linecap="round" class="char-part char-leg-l"/>
                            <line x1="50" y1="60" x2="65" y2="85" stroke="url(#charGradient)" stroke-width="4" stroke-linecap="round" class="char-part char-leg-r"/>
                        </svg>
                    </div>
                </div>

                <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-3 animate-fade-in">${this.currentExercise.name}</h2>
                <p class="text-slate-600 dark:text-slate-300 mb-8 text-sm leading-relaxed animate-fade-in" style="animation-delay: 0.1s;">${this.currentExercise.description}</p>

                <div class="flex flex-col sm:flex-row gap-3 animate-fade-in" style="animation-delay: 0.2s;">
                    <button id="btn-snooze" class="flex-1 px-6 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-400">
                        Snooze (5m)
                    </button>
                    <button id="btn-confirm" class="flex-1 px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:scale-[1.02] transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800">
                        I Stood Up!
                    </button>
                </div>
            </div>

            <style>
                @keyframes stretch-cycle {
                    0%, 100% { transform: scale(1, 1) rotate(0deg); }
                    20% { transform: scale(1.05, 0.95) translateY(2px); }
                    40% { transform: scale(0.95, 1.05) translateY(-2px) rotate(-2deg); }
                    60% { transform: scale(1.08, 1.02) translateY(-4px) rotate(0deg); }
                    80% { transform: scale(1, 1.05) translateY(-2px) rotate(2deg); }
                }
                
                .reminder-card svg {
                    animation: stretch-cycle 2.5s ease-in-out infinite;
                    transform-origin: center bottom;
                }

                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 0.4s ease-out forwards; opacity: 0; }
            </style>
        `;

        this.overlay.querySelector('#btn-snooze').addEventListener('click', () => this.handleSnooze());
        this.overlay.querySelector('#btn-confirm').addEventListener('click', () => this.handleConfirm());
        
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.handleSnooze();
        });

        this.overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.handleSnooze();
        });
    },

    hide() {
        if (!this.overlay) return;
        
        this.overlay.classList.add('opacity-0');
        const card = this.overlay.querySelector('.reminder-card');
        if (card) {
            card.classList.add('scale-95', 'opacity-0');
        }

        setTimeout(() => {
            if (this.overlay) {
                this.overlay.remove();
                this.overlay = null;
            }
        }, 400);
    },

    handleSnooze() {
        this.hide();
        window.dispatchEvent(new CustomEvent('snoozeRequested', { detail: { minutes: 5 } }));
        Toast.show('Snoozed for 5 minutes', 'info');
    },

    handleConfirm() {
        this.hide();
        window.dispatchEvent(new CustomEvent('sessionConfirmed'));
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Reminder.init());
} else {
    Reminder.init();
}