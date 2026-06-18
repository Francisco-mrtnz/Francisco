(function () {
    const gameArea = document.getElementById('targetArea');
    const scoreValue = document.getElementById('scoreValue');
    const timeValue = document.getElementById('timeValue');
    const highScoreValue = document.getElementById('highScoreValue');
    const restartRoundBtn = document.getElementById('restartRoundBtn');
    const ball = document.getElementById('physicsBall');

    if (!gameArea || !scoreValue || !timeValue || !highScoreValue || !restartRoundBtn || !ball) return;

    const ROUND_DURATION_MS = 2 * 60 * 1000;
    const HIGH_SCORE_KEY = 'secretCarnivalHighScore';

    function loadHighScore() {
        try {
            return Number(window.localStorage.getItem(HIGH_SCORE_KEY)) || 0;
        } catch (_err) {
            return 0;
        }
    }

    const state = {
        score: 0,
        highScore: loadHighScore(),
        targets: [],
        nextSpawnAt: performance.now() + 500,
        ballRadius: ball.offsetWidth / 2 || 22,
        roundStartAt: performance.now(),
        roundActive: true,
        lastCountdownSecond: null,
        audioCtx: null,
        celebratedRound: false
    };

    function ensureAudioContext() {
        if (!window.AudioContext && !window.webkitAudioContext) return null;

        if (!state.audioCtx) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            state.audioCtx = new Ctx();
        }

        if (state.audioCtx.state === 'suspended') {
            state.audioCtx.resume().catch(function () {
                return null;
            });
        }

        return state.audioCtx;
    }

    function playCountdownBeep() {
        const ctx = ensureAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.value = 740;
        gain.gain.value = 0.0001;

        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

        osc.start(now);
        osc.stop(now + 0.14);
    }

    function launchHighScoreConfetti() {
        const colors = ['#facc15', '#fb7185', '#fdba74', '#fef08a', '#f97316'];
        const count = 80;

        for (let i = 0; i < count; i += 1) {
            const piece = document.createElement('span');
            const size = 6 + Math.random() * 8;
            const left = Math.random() * 100;
            const drift = -80 + Math.random() * 160;
            const delay = Math.random() * 0.25;
            const duration = 1.4 + Math.random() * 1.3;

            piece.className = 'confetti-piece';
            piece.style.left = left + 'vw';
            piece.style.width = size + 'px';
            piece.style.height = (size * 1.5) + 'px';
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = delay + 's';
            piece.style.animationDuration = duration + 's';
            piece.style.setProperty('--confetti-drift', drift + 'px');

            document.body.appendChild(piece);
            window.setTimeout(function () {
                piece.remove();
            }, (delay + duration + 0.2) * 1000);
        }
    }

    function updateScore() {
        scoreValue.textContent = String(state.score);
    }

    function updateHighScore() {
        highScoreValue.textContent = String(state.highScore);
    }

    function formatTimeLeft(ms) {
        const safeMs = Math.max(0, ms);
        const totalSeconds = Math.ceil(safeMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
    }

    function updateTimer(now) {
        const elapsed = now - state.roundStartAt;
        const remaining = ROUND_DURATION_MS - elapsed;
        timeValue.textContent = formatTimeLeft(remaining);

        const remainingSeconds = Math.ceil(Math.max(0, remaining) / 1000);
        if (state.roundActive && remainingSeconds <= 10 && remainingSeconds > 0 && remainingSeconds !== state.lastCountdownSecond) {
            playCountdownBeep();
        }
        state.lastCountdownSecond = remainingSeconds;

        if (remaining <= 0 && state.roundActive) {
            endRound();
        }
    }

    function clearTargets() {
        state.targets.forEach(function (targetLife) {
            targetLife.node.remove();
        });
        state.targets = [];
    }

    function endRound() {
        state.roundActive = false;
        clearTargets();
        gameArea.classList.add('round-over');

        if (state.score > state.highScore) {
            state.highScore = state.score;
            try {
                window.localStorage.setItem(HIGH_SCORE_KEY, String(state.highScore));
            } catch (_err) {
                // Ignore write failures in restricted browsing contexts.
            }
            updateHighScore();

            if (!state.celebratedRound) {
                launchHighScoreConfetti();
                state.celebratedRound = true;
            }
        }

        restartRoundBtn.hidden = false;
    }

    function startRound() {
        state.score = 0;
        state.roundStartAt = performance.now();
        state.roundActive = true;
        state.nextSpawnAt = state.roundStartAt + 500;
        state.lastCountdownSecond = null;
        state.celebratedRound = false;

        updateScore();
        timeValue.textContent = formatTimeLeft(ROUND_DURATION_MS);
        restartRoundBtn.hidden = true;
        gameArea.classList.remove('round-over');
        clearTargets();
    }

    function getSpawnBounds(size) {
        const pad = 12;
        const headerHeight = document.querySelector('header')?.offsetHeight || 0;
        const footerHeight = document.querySelector('footer')?.offsetHeight || 0;

        return {
            minX: pad,
            maxX: Math.max(pad + 1, window.innerWidth - size - pad),
            minY: headerHeight + 24,
            maxY: Math.max(headerHeight + 25, window.innerHeight - footerHeight - size - 24)
        };
    }

    function randomInRange(min, max) {
        return min + Math.random() * (max - min);
    }

    function createTarget() {
        const size = 48 + Math.random() * 42;
        const bounds = getSpawnBounds(size);
        const target = document.createElement('div');

        target.className = 'carnival-target';
        target.style.width = size + 'px';
        target.style.height = size + 'px';
        target.style.left = randomInRange(bounds.minX, bounds.maxX) + 'px';
        target.style.top = randomInRange(bounds.minY, bounds.maxY) + 'px';

        document.body.appendChild(target);

        const life = {
            node: target,
            expiresAt: performance.now() + (2200 + Math.random() * 2000)
        };

        state.targets.push(life);
    }

    function removeTarget(targetLife) {
        targetLife.node.remove();
        state.targets = state.targets.filter(function (t) {
            return t !== targetLife;
        });
    }

    function checkHit(targetLife, ballRect) {
        const rect = targetLife.node.getBoundingClientRect();
        return !(
            ballRect.right < rect.left ||
            ballRect.left > rect.right ||
            ballRect.bottom < rect.top ||
            ballRect.top > rect.bottom
        );
    }

    function processTargets(now) {
        const ballRect = {
            left: ball.offsetLeft,
            top: ball.offsetTop,
            right: ball.offsetLeft + state.ballRadius * 2,
            bottom: ball.offsetTop + state.ballRadius * 2
        };

        state.targets.slice().forEach(function (targetLife) {
            if (now > targetLife.expiresAt) {
                removeTarget(targetLife);
                return;
            }

            if (checkHit(targetLife, ballRect)) {
                targetLife.node.classList.add('hit');
                state.score += 1;
                updateScore();
                window.setTimeout(function () {
                    removeTarget(targetLife);
                }, 180);
            }
        });
    }

    function gameLoop(now) {
        updateTimer(now);

        if (state.roundActive && state.targets.length < 4 && now >= state.nextSpawnAt) {
            createTarget();
            state.nextSpawnAt = now + (700 + Math.random() * 1200);
        }

        if (state.roundActive) {
            processTargets(now);
        }

        requestAnimationFrame(gameLoop);
    }

    window.addEventListener('resize', function () {
        state.ballRadius = ball.offsetWidth / 2 || 22;
    });

    window.addEventListener('pointerdown', ensureAudioContext, { passive: true });
    window.addEventListener('keydown', ensureAudioContext);

    restartRoundBtn.addEventListener('click', function () {
        ensureAudioContext();
        startRound();
    });

    updateScore();
    updateHighScore();
    timeValue.textContent = formatTimeLeft(ROUND_DURATION_MS);
    requestAnimationFrame(gameLoop);
})();
