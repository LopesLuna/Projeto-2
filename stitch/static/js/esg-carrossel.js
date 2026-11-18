/* Carrossel 3D de tópicos ESG (home).
   Setas e bolinhas trocam o card em destaque.
   Clicar num card que não está em destaque só o traz pro centro;
   clicar no card já em destaque segue o link para o tópico na Entenda ESG. */
(function () {
    var stage = document.getElementById('ec-stage');
    var dotsEl = document.getElementById('ec-dots');
    if (!stage || !dotsEl) return;

    var cards = Array.prototype.slice.call(stage.querySelectorAll('.ec-card'));
    var prevBtn = document.querySelector('.ec-arrow.prev');
    var nextBtn = document.querySelector('.ec-arrow.next');
    var n = cards.length;
    var active = 0, prev = 0, moved = false;

    var dots = cards.map(function (_, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'ec-dot';
        dot.setAttribute('aria-label', 'Tópico ' + (i + 1));
        dot.addEventListener('click', function () { active = i; update(); });
        dotsEl.appendChild(dot);
        return dot;
    });

    function update() {
        active = (active + n) % n;
        cards.forEach(function (el, i) {
            var offset = i - active;
            if (offset > n / 2) offset -= n;
            if (offset < -n / 2) offset += n;
            var abs = Math.abs(offset);
            var tx = offset * 220 + (offset ? Math.sign(offset) * 30 : 0);
            var tz = -abs * 200;
            var ry = offset * -20;
            el.style.transform = 'translateX(-50%) translate3d(' + tx + 'px, 0, ' + tz + 'px) rotateY(' + ry + 'deg)';
            el.style.zIndex = 20 - abs;
            el.style.opacity = abs > 2 ? 0 : abs === 2 ? 0.15 : abs === 1 ? 0.6 : 1;
            el.classList.toggle('active', i === active);
        });
        dots.forEach(function (dot, i) {
            dot.classList.toggle('active', i === active);
            if (i === active && active !== prev) {
                dot.classList.remove('stretch');
                void dot.offsetWidth;
                dot.classList.add('stretch');
            }
        });
        prev = active;
    }

    prevBtn.addEventListener('click', function () { active--; update(); });
    nextBtn.addEventListener('click', function () { active++; update(); });

    cards.forEach(function (el, i) {
        el.addEventListener('click', function (e) {
            if (moved) { e.preventDefault(); return; }
            if (i !== active) { e.preventDefault(); active = i; update(); }
        });
    });

    var startX = 0, currentX = 0, dragging = false;
    function getX(e) { return e.touches ? e.touches[0].clientX : e.clientX; }
    function dragStart(e) {
        dragging = true;
        moved = false;
        startX = getX(e);
        currentX = startX;
        stage.classList.add('dragging');
    }
    function dragMove(e) {
        if (!dragging) return;
        currentX = getX(e);
        if (Math.abs(currentX - startX) > 8) moved = true;
    }
    function dragEnd() {
        if (!dragging) return;
        dragging = false;
        stage.classList.remove('dragging');
        var diff = currentX - startX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) active--; else active++;
            update();
        }
        setTimeout(function () { moved = false; }, 0);
    }
    stage.addEventListener('mousedown', dragStart);
    window.addEventListener('mousemove', dragMove);
    window.addEventListener('mouseup', dragEnd);
    stage.addEventListener('touchstart', dragStart, { passive: true });
    window.addEventListener('touchmove', dragMove, { passive: true });
    window.addEventListener('touchend', dragEnd);

    update();
})();
