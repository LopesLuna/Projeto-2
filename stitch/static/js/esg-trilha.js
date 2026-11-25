(function () {
    var secoes = Array.prototype.slice.call(document.querySelectorAll('.ec-topico, .ec-fontes'));
    if (!secoes.length) return;

    var visitados = {};
    var linksIndice = Array.prototype.slice.call(document.querySelectorAll('.ec-indice a'));

    // ao abrir a página, o primeiro item do índice já aparece marcado
    if (linksIndice.length && !location.hash) linksIndice[0].classList.add('ativo');

    function marcar(i) {
        if (i < 0) return;
        visitados[i] = true;
        secoes.forEach(function (s, k) {
            s.classList.toggle('ativo', k === i);
            s.classList.toggle('visitado', !!visitados[k]);
        });
        var id = secoes[i].id;
        linksIndice.forEach(function (a) {
            var atual = a.getAttribute('href') === '#' + id;
            a.classList.toggle('ativo', atual);
            if (atual) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
    }

    function centralizar(el) {
        // os tópicos viraram cards altos: rola até o começo do card (o espaço vem do scroll-margin-top)
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function irPara(id) {
        var idx = secoes.findIndex(function (s) { return s.id === id; });
        if (idx < 0) return;
        marcar(idx);
        requestAnimationFrame(function () { centralizar(secoes[idx]); });
    }

    // a seção mais perto do centro da tela é a atual
    if ('IntersectionObserver' in window) {
        var obs = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (e) {
                if (e.isIntersecting) marcar(secoes.indexOf(e.target));
            });
        }, { rootMargin: '-45% 0px -45% 0px' });
        secoes.forEach(function (s) { obs.observe(s); });
    }

    // vindo de um card da home, ou clicando num link com #
    window.addEventListener('hashchange', function () { irPara(location.hash.slice(1)); });
    if (location.hash) {
        window.addEventListener('load', function () { irPara(location.hash.slice(1)); });
    }
})();
