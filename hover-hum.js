(function () {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    const audioContext = AudioCtor ? new AudioCtor() : null;
    const interactiveSelector = 'a, button, [role="button"]';

    let humGain = null;
    let humOscA = null;
    let humOscB = null;
    let activeTarget = null;

    function ensureHumNodes() {
        if (!audioContext) return false;
        if (humGain && humOscA && humOscB) return true;

        humGain = audioContext.createGain();
        humGain.gain.setValueAtTime(0.0001, audioContext.currentTime);

        humOscA = audioContext.createOscillator();
        humOscA.type = 'sine';
        humOscA.frequency.setValueAtTime(82.41, audioContext.currentTime);

        humOscB = audioContext.createOscillator();
        humOscB.type = 'triangle';
        humOscB.frequency.setValueAtTime(123.47, audioContext.currentTime);

        humOscA.connect(humGain);
        humOscB.connect(humGain);
        humGain.connect(audioContext.destination);

        humOscA.start();
        humOscB.start();

        return true;
    }

    function unlockAudioContext() {
        if (!audioContext) return;
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }

    function startHum(target) {
        if (!audioContext || !target) return;
        unlockAudioContext();
        if (!ensureHumNodes()) return;

        const now = audioContext.currentTime;
        humGain.gain.cancelScheduledValues(now);
        humGain.gain.setValueAtTime(Math.max(humGain.gain.value, 0.0001), now);
        humGain.gain.exponentialRampToValueAtTime(0.018, now + 0.06);
        activeTarget = target;
    }

    function stopHum(target) {
        if (!audioContext || !humGain) return;
        if (target && activeTarget && target !== activeTarget) return;

        const now = audioContext.currentTime;
        humGain.gain.cancelScheduledValues(now);
        humGain.gain.setValueAtTime(Math.max(humGain.gain.value, 0.0001), now);
        humGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
        activeTarget = null;
    }

    function getInteractiveTarget(node) {
        if (!(node instanceof Element)) return null;
        const target = node.closest(interactiveSelector);
        if (!target) return null;
        if (target instanceof HTMLButtonElement && target.disabled) return null;
        return target;
    }

    document.addEventListener('pointerdown', unlockAudioContext, { passive: true });
    document.addEventListener('keydown', unlockAudioContext, { passive: true });

    document.addEventListener('mouseover', function (event) {
        const target = getInteractiveTarget(event.target);
        if (!target) return;
        startHum(target);
    });

    document.addEventListener('mouseout', function (event) {
        const target = getInteractiveTarget(event.target);
        if (!target) return;

        const related = event.relatedTarget;
        if (related instanceof Element && target.contains(related)) return;
        stopHum(target);
    });

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            stopHum(activeTarget);
        }
    });

    window.addEventListener('blur', function () {
        stopHum(activeTarget);
    });
})();
