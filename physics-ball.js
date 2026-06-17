(function () {
    const radius = 22;
    const gravity = 1800;
    const bounce = 0.78;
    const airDrag = 0.998;
    const floorFriction = 0.985;

    const ball = document.createElement('div');
    ball.id = 'physicsBall';
    ball.setAttribute('aria-label', 'Interactive physics ball');
    ball.title = 'Drag and throw me';
    document.body.appendChild(ball);

    const state = {
        x: window.innerWidth * 0.72,
        y: 140,
        vx: 0,
        vy: 0,
        dragging: false,
        dragId: null,
        dragHistory: [],
        lastTime: performance.now(),
        throwBoost: 1,
        humElement: null,
        overlapCheckAt: 0
    };

    function clampPosition() {
        const maxX = window.innerWidth - radius;
        const maxY = window.innerHeight - radius;
        state.x = Math.max(radius, Math.min(maxX, state.x));
        state.y = Math.max(radius, Math.min(maxY, state.y));
    }

    function renderBall() {
        ball.style.left = (state.x - radius) + 'px';
        ball.style.top = (state.y - radius) + 'px';
        ball.style.setProperty('--throw-boost', state.throwBoost.toFixed(2));
    }

    function pushDragPoint(clientX, clientY) {
        const now = performance.now();
        state.dragHistory.push({ x: clientX, y: clientY, t: now });
        while (state.dragHistory.length > 12) {
            state.dragHistory.shift();
        }
        while (state.dragHistory.length > 1 && now - state.dragHistory[0].t > 140) {
            state.dragHistory.shift();
        }
    }

    function releaseThrow() {
        if (state.dragHistory.length < 2) {
            state.vx = 0;
            state.vy = 0;
            return;
        }

        const first = state.dragHistory[0];
        const last = state.dragHistory[state.dragHistory.length - 1];
        const dt = Math.max((last.t - first.t) / 1000, 0.016);

        const rawVx = (last.x - first.x) / dt;
        const rawVy = (last.y - first.y) / dt;

        state.throwBoost = Math.min(state.throwBoost + 0.22, 3.2);
        state.vx = rawVx * state.throwBoost;
        state.vy = rawVy * state.throwBoost;
    }

    function onPointerDown(event) {
        event.preventDefault();
        state.dragging = true;
        state.dragId = event.pointerId;
        state.vx = 0;
        state.vy = 0;
        state.dragHistory = [];

        ball.setPointerCapture(event.pointerId);
        state.x = event.clientX;
        state.y = event.clientY;
        pushDragPoint(event.clientX, event.clientY);
        renderBall();

        if (window.__hoverHum && window.__hoverHum.unlock) {
            window.__hoverHum.unlock();
        }
    }

    function onPointerMove(event) {
        if (!state.dragging || event.pointerId !== state.dragId) return;
        state.x = event.clientX;
        state.y = event.clientY;
        clampPosition();
        pushDragPoint(event.clientX, event.clientY);
        renderBall();
    }

    function onPointerUp(event) {
        if (!state.dragging || event.pointerId !== state.dragId) return;
        state.dragging = false;
        ball.releasePointerCapture(event.pointerId);
        releaseThrow();
        state.dragHistory = [];
    }

    function intersects(a, b) {
        return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
    }

    function findOverlapInteractive() {
        const ballRect = {
            left: state.x - radius,
            right: state.x + radius,
            top: state.y - radius,
            bottom: state.y + radius
        };

        const items = document.querySelectorAll('a, button, [role="button"]');
        for (const item of items) {
            const style = window.getComputedStyle(item);
            if (style.display === 'none' || style.visibility === 'hidden' || style.pointerEvents === 'none') {
                continue;
            }

            const rect = item.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            if (intersects(ballRect, rect)) return item;
        }

        return null;
    }

    function syncHumFromBall(now) {
        if (now < state.overlapCheckAt) return;
        state.overlapCheckAt = now + 50;

        const overlap = findOverlapInteractive();
        if (overlap === state.humElement) return;

        if (state.humElement && window.__hoverHum) {
            window.__hoverHum.stopForElement(state.humElement);
        }

        state.humElement = overlap;

        if (state.humElement && window.__hoverHum) {
            window.__hoverHum.startForElement(state.humElement);
        }
    }

    function animate(now) {
        const dt = Math.min((now - state.lastTime) / 1000, 0.032);
        state.lastTime = now;

        if (!state.dragging) {
            state.vy += gravity * dt;
            state.x += state.vx * dt;
            state.y += state.vy * dt;

            const maxX = window.innerWidth - radius;
            const maxY = window.innerHeight - radius;

            if (state.x < radius) {
                state.x = radius;
                state.vx = Math.abs(state.vx) * bounce;
            } else if (state.x > maxX) {
                state.x = maxX;
                state.vx = -Math.abs(state.vx) * bounce;
            }

            if (state.y < radius) {
                state.y = radius;
                state.vy = Math.abs(state.vy) * bounce;
            } else if (state.y > maxY) {
                state.y = maxY;
                state.vy = -Math.abs(state.vy) * bounce;
                state.vx *= floorFriction;
            }

            state.vx *= airDrag;
            state.vy *= airDrag;

            const speed = Math.hypot(state.vx, state.vy);
            if (speed < 45 && state.y >= maxY - 0.5) {
                state.vx *= 0.9;
                state.vy = 0;
                state.throwBoost = Math.max(1, state.throwBoost - 0.25 * dt);
            }
        }

        renderBall();
        syncHumFromBall(now);
        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', function () {
        clampPosition();
        renderBall();
    });

    ball.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    renderBall();
    requestAnimationFrame(function (startTime) {
        state.lastTime = startTime;
        animate(startTime);
    });
})();
