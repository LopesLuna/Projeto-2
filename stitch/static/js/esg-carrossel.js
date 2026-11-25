/* Carrossel de tópicos ESG (home): cards lado a lado, 3 por vez, rolagem infinita.

   A faixa (#ec-trilho) rola de verdade, então funciona com dois dedos no touchpad,
   com o dedo no celular e com o teclado. Também dá para arrastar com o mouse,
   usar as setas e as bolinhas.

   Infinito: os 6 cards são copiados antes e depois (3 blocos iguais). A faixa começa
   no bloco do meio; quando a rolagem para num bloco das pontas, ela pula, sem
   animação, para o mesmo card no bloco do meio. Quem olha não percebe o pulo. */
(function () {
    var trilho = document.getElementById('ec-trilho');
    var dotsEl = document.getElementById('ec-dots');
    if (!trilho || !dotsEl) return;

    var originais = Array.prototype.slice.call(trilho.querySelectorAll('.ec-card'));
    var n = originais.length;
    if (!n) return;

    // cópias: escondidas de leitor de tela e fora da ordem do Tab
    function copia(card) {
        var c = card.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        c.setAttribute('tabindex', '-1');
        c.classList.add('ec-copia');
        return c;
    }
    originais.slice().reverse().forEach(function (card) { trilho.insertBefore(copia(card), trilho.firstChild); });
    originais.forEach(function (card) { trilho.appendChild(copia(card)); });

    var cards = Array.prototype.slice.call(trilho.querySelectorAll('.ec-card'));

    function passo() {   // largura de um card + o espaço entre eles
        return cards[1].offsetLeft - cards[0].offsetLeft;
    }
    function bloco() { return passo() * n; }

    function semAnimacao(fn) {
        var antes = trilho.style.scrollBehavior;
        trilho.style.scrollBehavior = 'auto';
        fn();
        trilho.style.scrollBehavior = antes;
    }

    // começa no primeiro card do bloco do meio
    semAnimacao(function () { trilho.scrollLeft = bloco(); });

    // bolinhas
    var dots = originais.map(function (_, i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'ec-dot';
        dot.setAttribute('aria-label', 'Ir para o tópico ' + (i + 1));
        dot.addEventListener('click', function () {
            trilho.scrollTo({ left: bloco() + i * passo(), behavior: 'smooth' });
        });
        dotsEl.appendChild(dot);
        return dot;
    });

    var indice = 0;          // card que está na frente (0 a n-1)
    var redimensionando = false;
    function atual() {
        return ((Math.round(trilho.scrollLeft / passo()) % n) + n) % n;
    }
    function marcarBolinha() {
        if (!redimensionando) indice = atual();
        dots.forEach(function (d, i) { d.classList.toggle('active', i === indice); });
    }

    // quando a rolagem termina num bloco das pontas, volta para o do meio
    function reposicionar() {
        var b = bloco();
        if (trilho.scrollLeft < b * 0.5) {
            semAnimacao(function () { trilho.scrollLeft += b; });
        } else if (trilho.scrollLeft >= b * 1.5) {
            semAnimacao(function () { trilho.scrollLeft -= b; });
        }
        marcarBolinha();
    }
    var parou;
    trilho.addEventListener('scroll', function () {
        marcarBolinha();
        clearTimeout(parou);
        parou = setTimeout(reposicionar, 140);   // reserva para navegador sem "scrollend"
    }, { passive: true });
    trilho.addEventListener('scrollend', function () { clearTimeout(parou); reposicionar(); });

    // setas: um card por vez
    var prev = document.querySelector('.ec-arrow.prev');
    var next = document.querySelector('.ec-arrow.next');
    if (prev) prev.addEventListener('click', function () { trilho.scrollBy({ left: -passo(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { trilho.scrollBy({ left: passo(), behavior: 'smooth' }); });

    // teclado (com a faixa focada)
    trilho.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); if (next) next.click(); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); if (prev) prev.click(); }
    });

    // arrastar com o mouse (touchpad e dedo já rolam sozinhos)
    var arrastando = false, moveu = false, x0 = 0, s0 = 0;
    trilho.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        arrastando = true; moveu = false;
        x0 = e.clientX; s0 = trilho.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
        if (!arrastando) return;
        var dx = e.clientX - x0;
        if (!moveu && Math.abs(dx) > 6) { moveu = true; trilho.classList.add('arrastando'); }
        if (moveu) trilho.scrollLeft = s0 - dx;
    });
    window.addEventListener('pointerup', function () {
        if (!arrastando) return;
        arrastando = false;
        if (!moveu) return;
        trilho.classList.remove('arrastando');
        // encaixa no card mais próximo
        var p = passo();
        trilho.scrollTo({ left: Math.round(trilho.scrollLeft / p) * p, behavior: 'smooth' });
    });
    // o navegador não começa o "arrastar link/imagem" dele (senão o arraste do carrossel trava)
    trilho.addEventListener('dragstart', function (e) { e.preventDefault(); });
    // depois de arrastar, soltar o mouse em cima de um card não abre o link
    trilho.addEventListener('click', function (e) {
        if (moveu) { e.preventDefault(); moveu = false; }
    }, true);

    // ao mudar o tamanho da tela, mantém o mesmo card na frente
    var tela;
    window.addEventListener('resize', function () {
        redimensionando = true;
        clearTimeout(tela);
        tela = setTimeout(function () {
            semAnimacao(function () { trilho.scrollLeft = bloco() + indice * passo(); });
            redimensionando = false;
            marcarBolinha();
        }, 120);
    });

    marcarBolinha();
})();
