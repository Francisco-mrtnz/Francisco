(function () {
    const buttons = document.querySelectorAll('.sound-btn');
    if (!buttons.length) return;

    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    const audioContext = AudioCtor ? new AudioCtor() : null;

    function playRandomNoise() {
        if (!audioContext) return;

        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const now = audioContext.currentTime;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const types = ['sine', 'square', 'sawtooth', 'triangle'];

        osc.type = types[Math.floor(Math.random() * types.length)];
        osc.frequency.setValueAtTime(Math.random() * 900 + 180, now);
        osc.frequency.exponentialRampToValueAtTime(Math.random() * 900 + 180, now + 0.25);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(Math.random() * 0.05 + 0.02, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.start(now);
        osc.stop(now + 0.35);
    }

    buttons.forEach(function (button) {
        button.addEventListener('click', playRandomNoise);
    });
})();
