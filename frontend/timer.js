// Timer Controller
const Timer = {
    intervalId: null,
    circumference: 282.7,
    elements: {},

    init() {
        this.elements = {
            ring: document.getElementById('timer-ring'),
            display: document.getElementById('timer-display'),
            label: document.getElementById('timer-label'),
            statusIndicator: document.getElementById('status-indicator'),
            statusText: document.getElementById('status-text'),
            toggleBtn: document.getElementById('btn-toggle'),
            toggleText: document.getElementById('btn-toggle-text'),
            playIcon: document.getElementById('icon-play'),
            pauseIcon: document.getElementById('icon-pause'),
            resetBtn: document.getElementById('btn-reset'),
            intervalChips: document.querySelectorAll('.interval-chip')
        };

        this.setupEventListeners();
        this.render();
        
        TimerState.subscribe(() => this.render());
        
        if (TimerState.isRunning) {
            this.start();
        }
    },

    setupEventListeners() {
        const { toggleBtn, resetBtn, intervalChips } = this.elements;

        toggleBtn.addEventListener('click', () => this.toggle());
        resetBtn.addEventListener('click', () => this.reset());

        intervalChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const minutes = parseInt(chip.dataset.minutes);
                this.setInterval(minutes);
            });
        });

        setInterval(() => this.updateTitle(), 1000);
    },

    toggle() {
        if (TimerState.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    },

    start() {
        if (this.intervalId) return;

        TimerState.setState({ isRunning: true });
        
        this.intervalId = setInterval(() => {
            if (TimerState.remainingSeconds > 0) {
                TimerState.setState({ remainingSeconds: TimerState.remainingSeconds - 1 });
            } else {
                this.onComplete();
            }
        }, 1000);

        this.updateStatus('Running', 'text-primary-500');
    },

    pause() {
        if (!this.intervalId) return;

        clearInterval(this.intervalId);
        this.intervalId = null;
        
        TimerState.setState({ isRunning: false });
        this.updateStatus('Paused', 'text-amber-500');
    },

    reset() {
        this.pause();
        TimerState.setState({ remainingSeconds: TimerState.totalSeconds });
        this.updateStatus('Ready to start', 'text-slate-500');
    },

    setInterval(minutes) {
        this.pause();
        const totalSeconds = minutes * 60;
        
        TimerState.setState({ 
            intervalMinutes: minutes,
            totalSeconds: totalSeconds,
            remainingSeconds: totalSeconds
        });

        this.elements.intervalChips.forEach(chip => {
            const isActive = parseInt(chip.dataset.minutes) === minutes;
            chip.classList.toggle('active', isActive);
            chip.classList.toggle('border-primary-500', isActive);
            chip.classList.toggle('bg-primary-50', isActive);
            chip.classList.toggle('dark:bg-primary-900/30', isActive);
            chip.classList.toggle('text-primary-600', isActive);
            chip.classList.toggle('dark:text-primary-400', isActive);
            chip.classList.toggle('border-transparent', !isActive);
            chip.classList.toggle('shadow-sm', isActive);
        });

        this.updateStatus('Ready to start', 'text-slate-500');
    },

    render() {
        const { remainingSeconds, totalSeconds } = TimerState;
        
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        this.elements.display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const totalMinutes = totalSeconds / 60;
        this.elements.label.textContent = totalMinutes >= 60 ? 'hours' : 'minutes';

        const progress = remainingSeconds / totalSeconds;
        const offset = this.circumference - (progress * this.circumference);
        this.elements.ring.style.strokeDashoffset = offset;

        const { isRunning } = TimerState;
        this.elements.toggleText.textContent = isRunning ? 'Pause' : 'Start';
        this.elements.playIcon.classList.toggle('hidden', isRunning);
        this.elements.pauseIcon.classList.toggle('hidden', !isRunning);
        
        if (isRunning) {
            this.elements.toggleBtn.classList.add('from-amber-500', 'to-orange-500');
            this.elements.toggleBtn.classList.remove('from-primary-500', 'to-accent-500');
        } else {
            this.elements.toggleBtn.classList.remove('from-amber-500', 'to-orange-500');
            this.elements.toggleBtn.classList.add('from-primary-500', 'to-accent-500');
        }
    },

    updateStatus(text, colorClass) {
        this.elements.statusText.textContent = text;
        this.elements.statusIndicator.className = `flex items-center gap-2 text-sm font-medium ${colorClass}`;
        
        const ping = this.elements.statusIndicator.querySelector('.animate-ping');
        const dot = this.elements.statusIndicator.querySelector('.relative');
        
        if (TimerState.isRunning) {
            ping.classList.remove('hidden');
            dot.className = 'relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-500';
        } else {
            ping.classList.add('hidden');
            dot.className = 'relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-500';
        }
    },

    updateTitle() {
        const { remainingSeconds } = TimerState;
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        document.title = TimerState.isRunning 
            ? `${minutes}:${seconds.toString().padStart(2, '0')} - StandUp`
            : 'StandUp - Move More, Feel Better';
    },

    async onComplete() {
        this.pause();
        SoundManager.play();
        
        window.dispatchEvent(new CustomEvent('timerComplete', {
            detail: { durationMinutes: TimerState.intervalMinutes }
        }));
    },

    async recordSession() {
        try {
            const startedAt = new Date(Date.now() - (TimerState.totalSeconds - TimerState.remainingSeconds) * 1000);
            
            await API.post('/api/sessions', {
                type: 'standing',
                duration_minutes: TimerState.intervalMinutes,
                started_at: startedAt.toISOString()
            });
            
            Toast.show('Session recorded!', 'success');
        } catch (err) {
            Toast.show('Failed to record session', 'error');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => Timer.init());

window.addEventListener('sessionConfirmed', () => {
    Timer.recordSession();
    Timer.reset();
});