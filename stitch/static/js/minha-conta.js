/* ==========================================================================
   Minha conta: baixar os PDFs da biblioteca, confirmar exclusões e
   gráfico de evolução (duas ondas por pilar) quando há 2 ou mais relatórios.
   Os dados vêm do <script id="relatorios-dados"> (json_script do Django).
   A curva da onda é a mesma do PDF de comparação (StitchGraficos.onda).
   ========================================================================== */
(function () {
  'use strict';

  const raiz = document.getElementById('minha-conta');
  const fonte = document.getElementById('relatorios-dados');
  if (!raiz || !fonte) return;

  const relatorios = JSON.parse(fonte.textContent);   // mais recente primeiro
  const porId = new Map(relatorios.map(r => [String(r.id), r]));

  /* ---------- baixar o PDF de novo ---------- */
  // (a confirmação antes de excluir é o pop-up do site: stitch-ui.js, form[data-confirmar])
  document.querySelectorAll('.st-rel-baixar').forEach(botao => {
    botao.addEventListener('click', async () => {
      const dados = porId.get(botao.dataset.relatorio);
      if (!dados) return;
      botao.disabled = true;
      try {
        if (!window.StitchPDF) throw new Error('sem gerador de PDF');
        await window.StitchPDF.gerar(dados, { logoUrl: raiz.dataset.logo });
      } catch (e) {
        window.Stitch.aviso('Não foi possível gerar o PDF agora. Confira a internet e tente de novo.', 'erro');
      } finally {
        botao.disabled = false;
      }
    });
  });

  /* ---------- gráfico de evolução ---------- */
  const caixa = document.getElementById('cmp-onda');
  if (!caixa || relatorios.length < 2 || !window.StitchGraficos) return;

  const { onda, trechos, PILARES } = window.StitchGraficos;
  const FAIXAS = [[24, 'Crítico'], [44, 'Preocupante'], [74, 'Estável'], [100, 'Excelente']];
  const faixa = v => (FAIXAS.find(f => v <= f[0]) || FAIXAS[3])[1];
  const temNota = v => Number.isFinite(v);
  const data = iso => new Date(iso).toLocaleDateString('pt-BR');
  const SVG = 'http://www.w3.org/2000/svg';
  const LADOS = [
    { chave: 'antes', nome: 'Antes', cor: '#699e2f' },    // verde-claro da logo
    { chave: 'depois', nome: 'Depois', cor: '#2f5f27' },  // verde-médio da logo
  ];

  const selAntes = document.getElementById('cmp-antes');
  const selDepois = document.getElementById('cmp-depois');
  const geral = document.getElementById('cmp-geral');
  const legenda = document.getElementById('cmp-legenda');
  const dica = document.getElementById('cmp-dica');

  const varias = new Set(relatorios.map(r => (r.empresa || '').toLowerCase())).size > 1;
  const dataCurta = iso => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const nomeOpcao = r => `${varias ? r.empresa + ' · ' : ''}${r.ano || 'Sem ano'} · ${dataCurta(r.criado_em)}`;
  relatorios.forEach(r => {
    selAntes.append(new Option(nomeOpcao(r), r.id));
    selDepois.append(new Option(nomeOpcao(r), r.id));
  });
  selAntes.value = relatorios[1].id;   // padrão: penúltimo → último
  selDepois.value = relatorios[0].id;

  // nome curto de cada lado: o ano, ou a data quando os anos se repetem
  const rotulos = (a, b) => (a.ano && b.ano && a.ano !== b.ano)
    ? [String(a.ano), String(b.ano)] : [data(a.criado_em), data(b.criado_em)];

  const el = (tag, cls, txt) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  };
  const svg = (tag, attrs) => {
    const e = document.createElementNS(SVG, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  };
  const variacao = d => d > 0 ? `▲ +${d}` : d < 0 ? `▼ ${d}` : '= 0';
  const classeVar = d => d > 0 ? 'sobe' : d < 0 ? 'desce' : 'igual';

  function desenhar() {
    const a = porId.get(selAntes.value), b = porId.get(selDepois.value);
    caixa.replaceChildren(); legenda.replaceChildren(); geral.replaceChildren();
    dica.hidden = true;
    if (!a || !b || a.id === b.id) {
      geral.textContent = 'Escolha dois relatórios diferentes.';
      return;
    }
    const [ra, rb] = rotulos(a, b);

    // uma linha só: nota geral antes → depois e a variação
    geral.append(el('span', 'st-cmp-geral-rot', 'Nota geral'));
    if (temNota(a.geral) && temNota(b.geral)) {
      const d = b.geral - a.geral;
      geral.append(el('strong', '', `${a.geral} → ${b.geral}`), el('span', `st-cmp-var ${classeVar(d)}`, variacao(d)));
    } else {
      geral.append(el('strong', '', 'sem dados'));
    }

    LADOS.forEach((lado, i) => {
      const item = el('span', 'st-cmp-leg');
      const amostra = el('i', 'st-cmp-amostra');
      amostra.style.background = lado.cor;
      item.append(amostra, document.createTextNode(`${lado.nome} (${i ? rb : ra})`));
      legenda.append(item);
    });

    // dimensões a partir da largura real (o texto não encolhe no celular)
    const W = Math.max(caixa.clientWidth, 280), H = 230;
    const esq = 30, dir = 12, topo = 12, baixo = 30;
    const largura = W - esq - dir, altura = H - topo - baixo, base = topo + altura;
    const folga = Math.min(48, largura / 8);
    const xs = PILARES.map((_, i) => esq + folga + i * (largura - 2 * folga) / (PILARES.length - 1));
    const yDe = v => base - altura * v / 100;

    const grafico = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img',
      'aria-label': `Notas por pilar: antes (${ra}) e depois (${rb})` });

    // grade leve: 0, 50 e 100
    [0, 50, 100].forEach(v => {
      grafico.append(svg('line', { x1: esq, x2: W - dir, y1: yDe(v), y2: yDe(v), class: 'st-onda-grade' }));
      const t = svg('text', { x: esq - 8, y: yDe(v) + 4, class: 'st-onda-escala', 'text-anchor': 'end' });
      t.textContent = v;
      grafico.append(t);
    });

    // linha vertical que acompanha o mouse
    const mira = svg('line', { y1: topo, y2: base, class: 'st-onda-mira', visibility: 'hidden' });
    grafico.append(mira);

    // as duas ondas: área translúcida + linha + pontos
    [a, b].forEach((r, i) => {
      const cor = LADOS[i].cor;
      const valores = PILARES.map(([chave]) => (r.pilares || {})[chave]);
      trechos(valores).forEach(indices => {
        const pts = indices.map(k => ({ x: xs[k], y: yDe(valores[k]) }));
        if (pts.length > 1) {
          const curva = onda(pts).map(s => `C${s.c1.join(' ')} ${s.c2.join(' ')} ${s.p.join(' ')}`).join(' ');
          const ini = `M${pts[0].x} ${pts[0].y} `;
          const fim = pts[pts.length - 1];
          grafico.append(svg('path', { d: `M${pts[0].x} ${base} L${pts[0].x} ${pts[0].y} ${curva} L${fim.x} ${base} Z`, fill: cor, class: 'st-onda-area' }));
          grafico.append(svg('path', { d: ini + curva, stroke: cor, class: 'st-onda-linha' }));
        }
        pts.forEach(p => grafico.append(svg('circle', { cx: p.x, cy: p.y, r: 4.5, fill: cor, class: 'st-onda-ponto' })));
      });
    });

    // nomes dos pilares e "sem dados" quando nenhum dos dois tem nota
    PILARES.forEach(([chave, nome], k) => {
      const t = svg('text', { x: xs[k], y: H - 8, class: 'st-onda-pilar', 'text-anchor': 'middle' });
      t.textContent = W < 480 && chave === 'ambiente' ? 'Ambiente' : nome;   // celular: nome curto
      grafico.append(t);
      if (!temNota((a.pilares || {})[chave]) && !temNota((b.pilares || {})[chave])) {
        const s = svg('text', { x: xs[k], y: yDe(50), class: 'st-onda-semdados', 'text-anchor': 'middle' });
        s.textContent = 'sem dados';
        grafico.append(s);
      }
    });

    // faixas invisíveis por pilar: passar o mouse (ou o teclado) mostra os dois valores
    const faixaL = (largura - 2 * folga) / (PILARES.length - 1);
    PILARES.forEach(([chave, nome], k) => {
      const va = (a.pilares || {})[chave], vb = (b.pilares || {})[chave];
      const texto = `${nome} · Antes (${ra}): ${temNota(va) ? `${va}% ${faixa(va)}` : 'sem dados'} · ` +
        `Depois (${rb}): ${temNota(vb) ? `${vb}% ${faixa(vb)}` : 'sem dados'}` +
        (temNota(va) && temNota(vb) ? ` · ${variacao(vb - va)}` : '');
      const alvo = svg('rect', { x: xs[k] - faixaL / 2, y: topo, width: faixaL, height: altura,
        class: 'st-onda-alvo', tabindex: 0, role: 'img', 'aria-label': texto });
      alvo.dataset.texto = texto;
      alvo.dataset.x = xs[k];
      grafico.append(alvo);
    });

    caixa.append(grafico);

    const mostrar = alvo => {
      mira.setAttribute('x1', alvo.dataset.x); mira.setAttribute('x2', alvo.dataset.x);
      mira.setAttribute('visibility', 'visible');
      dica.textContent = alvo.dataset.texto;
      dica.hidden = false;
      const r = alvo.getBoundingClientRect(), c = raiz.getBoundingClientRect();
      const larg = dica.offsetWidth;
      dica.style.left = Math.min(Math.max(r.left + r.width / 2 - c.left - larg / 2, 0), c.width - larg) + 'px';
      dica.style.top = (r.top - c.top + 4) + 'px';   // dentro do gráfico, sem cobrir a nota geral
    };
    const esconder = () => { mira.setAttribute('visibility', 'hidden'); dica.hidden = true; };
    grafico.querySelectorAll('.st-onda-alvo').forEach(alvo => {
      alvo.addEventListener('pointerenter', () => mostrar(alvo));
      alvo.addEventListener('focus', () => mostrar(alvo));
      alvo.addEventListener('blur', esconder);
    });
    grafico.addEventListener('pointerleave', esconder);
  }

  selAntes.addEventListener('change', desenhar);
  selDepois.addEventListener('change', desenhar);
  let espera;
  window.addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(desenhar, 150); });
  desenhar();
})();
