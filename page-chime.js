(function () {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    const audioContext = AudioCtor ? new AudioCtor() : null;

    function playNavigationChime() {
        if (!audioContext) return;

        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const now = audioContext.currentTime;
        const notes = [783.99, 1046.5, 1318.51];

        notes.forEach(function (frequency, index) {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(frequency, now);

            const noteStart = now + index * 0.05;
            const noteEnd = noteStart + 0.18;

            gain.gain.setValueAtTime(0.0001, noteStart);
            gain.gain.exponentialRampToValueAtTime(0.08, noteStart + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

            osc.connect(gain);
            gain.connect(audioContext.destination);

            osc.start(noteStart);
            osc.stop(noteEnd + 0.01);
        });
    }

    function isInternalHtmlLink(link) {
        if (!link) return false;
        if (link.target === '_blank') return false;
        if (link.hasAttribute('download')) return false;

        const href = link.getAttribute('href') || '';
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            return false;
        }

        try {
            const url = new URL(link.href, window.location.href);
            const isSameOrigin = url.origin === window.location.origin;
            const isHtmlPage = url.pathname.endsWith('.html');
            return isSameOrigin && isHtmlPage;
        } catch (_error) {
            return false;
        }
    }

    document.addEventListener('click', function (event) {
        const link = event.target.closest('a');
        if (!isInternalHtmlLink(link)) return;

        if (event.defaultPrevented || event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        const destination = link.href;
        event.preventDefault();
        playNavigationChime();

        window.setTimeout(function () {
            window.location.href = destination;
        }, 150);
    });
})();
