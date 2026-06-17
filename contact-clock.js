(function () {
    const clockEl = document.getElementById('officeClock');
    if (!clockEl) return;

    function formatClock(now) {
        return now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    }

    function updateClock() {
        const now = new Date();
        clockEl.textContent = formatClock(now);
        clockEl.setAttribute('datetime', now.toISOString());
    }

    updateClock();
    setInterval(updateClock, 1000);
})();
