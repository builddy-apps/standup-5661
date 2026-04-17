const Stats = {
    currentWeekOffset: 0,
    circumference: 282.7,

    async init() {
        this.bindEvents();
        await this.loadData();
    },

    bindEvents() {
        window.addEventListener('pageChange', (e) => {
            if (e.detail.page === 'stats') {
                this.loadData();
            }
        });

        window.addEventListener('darkModeToggle', () => {
            const chartContainer = document.getElementById('weekly-chart');
            if (chartContainer && !chartContainer.querySelector('.text-slate-400')) {
                this.renderWeeklyChart(chartContainer.dataset.raw ? JSON.parse(chartContainer.dataset.raw) : []);
            }
        });
    },

    async loadData() {
        const loadingState = document.getElementById('loading-state');
        const errorState = document.getElementById('error-state');
        const contentState = document.getElementById('stats-content');

        try {
            loadingState.classList.remove('hidden');
            errorState.classList.add('hidden');
            contentState.classList.add('hidden');

            const [dailyData, weeklyData, streakData] = await Promise.all([
                this.getDailyStats(),
                this.getWeeklyStats(),
                this.getStreakStats()
            ]);

            this.renderProgressRing(dailyData);
            this.renderStreak(streakData);
            this.renderWeeklyChart(weeklyData);
            this.renderSummaryCards(dailyData, weeklyData, streakData);

            loadingState.classList.add('hidden');
            contentState.classList.remove('hidden');

        } catch (err) {
            console.error('Failed to load stats:', err);
            loadingState.classList.add('hidden');
            errorState.classList.remove('hidden');
        }
    },

    async getDailyStats() {
        const today = new Date().toISOString().split('T')[0];
        const res = await API.get(`/stats/daily/${today}`);
        return res.data || { achieved_minutes: 0, target_minutes: 30, is_achieved: 0 };
    },

    async getWeeklyStats() {
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() + (this.currentWeekOffset * 7));
        const from_date = fromDate.toISOString().split('T')[0];
        const res = await API.get(`/stats/weekly?from_date=${from_date}`);
        return res.data || [];
    },

    async getStreakStats() {
        const res = await API.get('/streaks');
        return res.data || { current: 0, best: 0, message: 'Start your journey today!' };
    },

    renderProgressRing(data) {
        const circle = document.getElementById('progress-ring-circle');
        const percentageEl = document.getElementById('progress-percentage');
        const textEl = document.getElementById('progress-text');

        const { achieved_minutes, target_minutes } = data;
        const percentage = Math.min(100, Math.round((achieved_minutes / target_minutes) * 100));
        const offset = this.circumference - (percentage / 100) * this.circumference;

        const colorClass = percentage < 50 ? 'text-red-500' : percentage < 80 ? 'text-amber-500' : 'text-primary-500';

        circle.classList.remove('text-red-500', 'text-amber-500', 'text-primary-500');
        circle.classList.add(colorClass);

        setTimeout(() => {
            circle.style.strokeDashoffset = offset;
        }, 100);

        percentageEl.textContent = `${percentage}%`;
        textEl.textContent = `${achieved_minutes} / ${target_minutes} min`;
    },

    renderStreak(data) {
        const countEl = document.getElementById('streak-count');
        const messageEl = document.getElementById('streak-message');
        const bestEl = document.getElementById('stat-best');

        countEl.textContent = data.current;
        messageEl.textContent = data.message;
        bestEl.textContent = data.best;
    },

    renderWeeklyChart(data) {
        const chartContainer = document.getElementById('weekly-chart');
        const labelsContainer = document.getElementById('weekly-labels');

        chartContainer.innerHTML = '';
        labelsContainer.innerHTML = '';

        if (!data || data.length === 0) {
            chartContainer.innerHTML = `
                <div class="w-full flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600">
                    <svg class="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    <p class="text-sm">No data yet</p>
                    <p class="text-xs mt-1">Start standing to see your progress!</p>
                </div>
            `;
            return;
        }

        chartContainer.dataset.raw = JSON.stringify(data);
        const maxMinutes = Math.max(...data.map(d => d.achieved_minutes), 60);
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const isDark = document.documentElement.classList.contains('dark');
        const todayStr = new Date().toISOString().split('T')[0];

        data.forEach((dayData, index) => {
            const heightPercent = Math.max(4, (dayData.achieved_minutes / maxMinutes) * 100);
            const date = new Date(dayData.date);
            const dayLabel = days[date.getDay()];
            const isToday = dayData.date === todayStr;

            const bar = document.createElement('div');
            bar.className = 'flex-1 rounded-t-lg transition-all duration-300 hover:scale-105 relative group cursor-pointer';
            bar.style.height = `${heightPercent}%`;

            if (dayData.achieved_minutes > 0) {
                if (dayData.is_achieved) {
                    bar.style.backgroundColor = '#14b8a6';
                } else {
                    bar.style.backgroundColor = isDark ? 'rgba(15, 118, 110, 0.6)' : 'rgba(204, 251, 241, 0.7)';
                    bar.classList.add('hover:bg-primary-400', 'dark:hover:bg-primary-500');
                }
                if (isToday) {
                    bar.style.backgroundColor = '#14b8a6';
                    bar.classList.add('shadow-lg', 'shadow-primary-500/30');
                }
            } else {
                bar.style.backgroundColor = isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(226, 232, 240, 0.5)';
                bar.classList.add('hover:bg-slate-400', 'dark:hover:bg-slate-600');
            }

            const tooltip = document.createElement('div');
            tooltip.className = 'absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg';
            tooltip.innerHTML = `
                <div class="font-semibold">${dayData.achieved_minutes} min</div>
                <div class="text-[10px] opacity-75">${dayData.date}</div>
            `;
            bar.appendChild(tooltip);

            chartContainer.appendChild(bar);

            const label = document.createElement('span');
            label.textContent = dayLabel;
            if (isToday) {
                label.className = 'font-bold text-primary-600 dark:text-primary-400';
            }
            labelsContainer.appendChild(label);
        });
    },

    renderSummaryCards(dailyData, weeklyData, streakData) {
        const todayEl = document.getElementById('stat-today');
        const weeklyAvgEl = document.getElementById('stat-weekly-avg');

        todayEl.textContent = dailyData.achieved_minutes;

        if (weeklyData && weeklyData.length > 0) {
            const totalWeekly = weeklyData.reduce((sum, day) => sum + day.achieved_minutes, 0);
            const avg = Math.round(totalWeekly / weeklyData.length);
            weeklyAvgEl.textContent = avg;
        } else {
            weeklyAvgEl.textContent = '0';
        }
    },

    navigateWeek(direction) {
        this.currentWeekOffset += direction;
        this.loadWeeklyData();
    },

    async loadWeeklyData() {
        try {
            const data = await this.getWeeklyStats();
            this.renderWeeklyChart(data);
        } catch (err) {
            console.error('Failed to load weekly data:', err);
            Toast.show('Failed to load weekly data', 'error');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Stats.init();
});