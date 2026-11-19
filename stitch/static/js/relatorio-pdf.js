/* ==========================================================================
   Relatórios ESG em PDF (Diagnóstico, biblioteca de Minha conta e Comparador)

   Precisa do jsPDF carregado antes:
   <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

   window.StitchPDF.gerar(dados)                 -> PDF do diagnóstico
   window.StitchPDF.gerarComparacao(a, b, cmp)   -> PDF da comparação (o "PDF 3")
   window.StitchGraficos.onda(pontos)            -> curva suave usada no site e nos PDFs

   No PDF do diagnóstico os dados vão embutidos (metadado "Keywords" =
   "ESGDATA:" + JSON em base64). É isso que o comparador lê depois.

   Formato dos dados:
     { v, empresa, ano, gerado, geral,
       pilares: { ambiente, social, governanca, lucro }   (0 a 100 ou null)
       itens: [ { c: código, p: pilar, tm: tema, t: pergunta, a: resposta, s: nota } ] }
   ========================================================================== */
(function () {
  'use strict';

  const PILARES = [
    ['ambiente', 'Meio ambiente', 'Ecoeficiência, redução de pegada e capital natural.'],
    ['social', 'Social', 'Produtividade, retenção, clima e direitos humanos.'],
    ['governanca', 'Governança', 'Conformidade, transparência e controle de riscos.'],
    ['lucro', 'Lucro', 'Saúde financeira e capacidade de investimento.'],
  ];
  const NOMES = Object.fromEntries(PILARES.map(p => [p[0], p[1]]));
  // mesmas faixas e cores do diagnóstico
  const FAIXAS = [
    { max: 24, label: 'Crítico', cor: [198, 83, 77] },
    { max: 44, label: 'Preocupante', cor: [210, 138, 66] },
    { max: 74, label: 'Estável', cor: [59, 120, 91] },
    { max: 100, label: 'Excelente', cor: [59, 120, 91] },
  ];
  const faixa = v => FAIXAS.find(f => v <= f.max) || FAIXAS[3];
  const temNota = v => Number.isFinite(v);

  const VERDE_ESCURO = [25, 64, 31];
  const VERDE = [105, 158, 47];
  const CREME = [235, 235, 215];
  const TINTA = [30, 51, 34];
  const CINZA = [74, 90, 75];
  const TRILHO = [227, 230, 214];
  const SOBE = [47, 97, 71];
  const DESCE = [135, 58, 53];
  // as duas ondas: verde-claro e verde-médio da logo (validadas para daltonismo)
  const COR_ANTES = [105, 158, 47];
  const COR_DEPOIS = [47, 95, 39];

  const L = 210, A = 297, M = 18;   // página A4 em mm: largura, altura e margem
  const UTIL = L - 2 * M;

  /* ---------- texto ---------- */
  // as fontes padrão do PDF só têm o alfabeto latino básico: troca o que não cabe
  function latin1(texto) {
    return String(texto == null ? '' : texto)
      .replace(/₂/g, '2').replace(/[–—]/g, '-').replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
      .replace(/…/g, '...').replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/÷/g, '/')
      .replace(/→/g, '->').replace(/[^\x00-\xFF]/g, '');
  }

  function base64Utf8(texto) {
    const bytes = new TextEncoder().encode(texto);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(bin);
  }

  const slug = t => latin1(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  function nomeDoArquivo(dados) {
    return `diagnostico-esg-${slug(dados.empresa) || 'empresa'}${dados.ano ? '-' + dados.ano : ''}.pdf`;
  }

  function dataBr(iso) {
    const d = iso ? new Date(iso) : new Date();
    return isNaN(d) ? '' : d.toLocaleDateString('pt-BR');
  }

  /* ---------- curva suave (monotônica: não "passa" de 0 nem de 100 entre os pontos) ---------- */
  // pontos: [{x, y}] em ordem de x. Devolve os trechos em Bézier cúbica:
  // [{ c1: [x, y], c2: [x, y], p: [x, y] }] a partir do primeiro ponto.
  function onda(pontos) {
    const n = pontos.length;
    if (n < 2) return [];
    const dx = [], m = [], t = new Array(n);
    for (let i = 0; i < n - 1; i++) {
      dx[i] = pontos[i + 1].x - pontos[i].x;
      m[i] = (pontos[i + 1].y - pontos[i].y) / dx[i];
    }
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
      const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
      if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
    }
    return pontos.slice(1).map((p, i) => {
      const h = dx[i] / 3, p0 = pontos[i];
      return { c1: [p0.x + h, p0.y + t[i] * h], c2: [p.x - h, p.y - t[i + 1] * h], p: [p.x, p.y] };
    });
  }

  // separa os valores em trechos sem buraco (pilar sem dados quebra a onda)
  function trechos(valores) {
    const lista = [];
    let atual = [];
    valores.forEach((v, i) => {
      if (temNota(v)) atual.push(i);
      else if (atual.length) { lista.push(atual); atual = []; }
    });
    if (atual.length) lista.push(atual);
    return lista;
  }

  /* ---------- peças comuns dos PDFs ---------- */
  function carregarImagem(url) {
    return new Promise(resolve => {
      if (!url) return resolve(null);
      const img = new Image();
      img.onload = () => {
        // reduz o logo antes de pôr no PDF (o arquivo fica bem menor)
        const h = Math.min(img.naturalHeight, 96);
        const w = Math.round(img.naturalWidth * h / img.naturalHeight);
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve({ data: c.toDataURL('image/png'), w, h });
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  function novoDoc() {
    if (!window.jspdf || !window.jspdf.jsPDF) throw new Error('O gerador de PDF não carregou.');
    const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
    const ctx = { doc, y: 0 };
    ctx.texto = (t, x, yy, o) => doc.text(latin1(t), x, yy, o);
    ctx.quebra = (t, largura) => doc.splitTextToSize(latin1(t), largura);
    ctx.espaco = altura => { if (ctx.y + altura > A - 20) { doc.addPage(); ctx.y = 22; } };
    ctx.titulo = t => {
      ctx.espaco(16);
      doc.setTextColor(...VERDE_ESCURO); doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
      ctx.texto(t, M, ctx.y);
      ctx.y += 8;
    };
    return ctx;
  }

  async function cabecalho(ctx, etiqueta, titulo, logoUrl) {
    const { doc } = ctx;
    doc.setFillColor(...VERDE_ESCURO);
    doc.rect(0, 0, L, 38, 'F');
    const logo = await carregarImagem(logoUrl);
    let x = M;
    if (logo) {
      const h = 14, w = h * logo.w / logo.h;
      doc.addImage(logo.data, 'PNG', M, 12, w, h, undefined, 'FAST');
      x = M + w + 6;
    }
    doc.setTextColor(...CREME);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    ctx.texto(etiqueta, x, 16);
    doc.setFontSize(18);
    ctx.texto(ctx.quebra(titulo, L - x - M)[0], x, 26);
    ctx.y = 50;
  }

  function rodape(ctx, texto) {
    const { doc } = ctx;
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setDrawColor(...VERDE); doc.setLineWidth(0.4);
      doc.line(M, A - 14, L - M, A - 14);
      doc.setTextColor(...CINZA); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
      ctx.texto(texto, M, A - 9);
      ctx.texto(`Página ${i} de ${total}`, L - M, A - 9, { align: 'right' });
    }
  }

  /* ==========================================================================
     PDF do diagnóstico
     ========================================================================== */
  async function gerar(dados, opcoes) {
    opcoes = opcoes || {};
    const ctx = novoDoc();
    const { doc } = ctx;

    doc.setProperties({
      title: latin1(`Diagnóstico ESG - ${dados.empresa}`),
      subject: 'Diagnóstico ESG gerado pelo Stitch',
      author: 'Stitch',
      creator: 'Stitch',
      keywords: 'ESGDATA:' + base64Utf8(JSON.stringify(dados)),
    });

    await cabecalho(ctx, 'STITCH · DIAGNÓSTICO ESG', dados.empresa || 'Sua empresa', opcoes.logoUrl);

    doc.setTextColor(...CINZA);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    ctx.texto([
      dados.ano ? `Ano de referência: ${dados.ano}` : 'Sem ano de referência',
      `Gerado em ${dataBr(dados.gerado)}`,
      `Questionário versão ${dados.v || 1}`,
    ].join('   ·   '), M, ctx.y);

    /* nota geral */
    ctx.y += 12;
    doc.setFillColor(244, 244, 230);
    doc.setDrawColor(...TRILHO);
    doc.roundedRect(M, ctx.y, UTIL, 24, 3, 3, 'FD');
    doc.setTextColor(...TINTA);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    ctx.texto('Nota geral', M + 8, ctx.y + 9);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
    if (!temNota(dados.geral)) {
      ctx.texto('Sem dados', M + 8, ctx.y + 19);
    } else {
      const f = faixa(dados.geral);
      ctx.texto(`${dados.geral}/100`, M + 8, ctx.y + 19);
      doc.setFontSize(12); doc.setTextColor(...f.cor);
      ctx.texto(f.label, M + 48, ctx.y + 19);
    }
    ctx.y += 34;

    /* pilares */
    ctx.titulo('Resultado por pilar');
    PILARES.forEach(([chave, nome, desc]) => {
      ctx.espaco(22);
      const v = dados.pilares ? dados.pilares[chave] : null;
      doc.setTextColor(...TINTA);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
      ctx.texto(nome, M, ctx.y);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      ctx.texto(temNota(v) ? `${faixa(v).label} (${v}%)` : 'Sem dados', M + UTIL, ctx.y, { align: 'right' });
      ctx.y += 3;
      doc.setFillColor(...TRILHO);
      doc.roundedRect(M, ctx.y, UTIL, 3.4, 1.7, 1.7, 'F');
      if (v) {
        doc.setFillColor(...faixa(v).cor);
        doc.roundedRect(M, ctx.y, Math.max(UTIL * v / 100, 3.4), 3.4, 1.7, 1.7, 'F');
      }
      ctx.y += 8;
      doc.setTextColor(...CINZA); doc.setFontSize(9);
      ctx.texto(desc, M, ctx.y);
      ctx.y += 9;
    });

    /* pontos de atenção */
    const fracos = (dados.itens || []).filter(x => x.s <= 45).sort((a, b) => a.s - b.s);
    ctx.y += 2;
    ctx.titulo('Pontos de atenção');
    if (!fracos.length) {
      doc.setTextColor(...CINZA); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      ctx.texto((dados.itens || []).length
        ? 'Nenhuma resposta ficou em nível de atenção. Continue acompanhando os indicadores todo ano.'
        : 'Nenhuma pergunta respondida.', M, ctx.y);
      ctx.y += 8;
    }
    fracos.forEach(x => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      const pergunta = ctx.quebra(x.t, UTIL - 10);
      const resposta = ctx.quebra(`Sua resposta: ${x.a}`, UTIL - 10);
      const altura = 9 + pergunta.length * 4.6 + resposta.length * 4.4 + 5;
      ctx.espaco(altura);
      doc.setFillColor(...faixa(x.s).cor);
      doc.rect(M, ctx.y - 4, 1.2, altura - 4, 'F');
      doc.setTextColor(...TINTA); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      ctx.texto(`${NOMES[x.p] || ''}: ${x.tm || ''}`, M + 5, ctx.y);
      ctx.texto(`${x.s}/100`, M + UTIL, ctx.y, { align: 'right' });
      ctx.y += 5;
      doc.setFont('helvetica', 'normal');
      doc.text(pergunta, M + 5, ctx.y);
      ctx.y += pergunta.length * 4.6;
      doc.setTextColor(...CINZA); doc.setFontSize(9.5);
      doc.text(resposta, M + 5, ctx.y);
      ctx.y += resposta.length * 4.4 + 6;
    });

    rodape(ctx, 'Stitch · Diagnóstico ESG para o setor têxtil');
    doc.save(nomeDoArquivo(dados));
    return doc;
  }

  /* ==========================================================================
     PDF da comparação (o "terceiro PDF" do comparador)
     cmp = { avisos: [texto], mudancas: [{p, tm, t, de, para, sa, sb, d}], iguais }
     ========================================================================== */
  function desenharOnda(ctx, a, b, rotA, rotB) {
    const { doc } = ctx;
    const x0 = M + 10, largura = UTIL - 16, altura = 58, topo = ctx.y + 10;
    const base = topo + altura;
    const xs = PILARES.map((_, i) => x0 + 8 + i * (largura - 16) / (PILARES.length - 1));
    const yDe = v => base - altura * v / 100;

    // legenda
    [[COR_ANTES, `Antes (${rotA})`], [COR_DEPOIS, `Depois (${rotB})`]].forEach(([cor, nome], i) => {
      const x = M + i * 48;
      doc.setFillColor(...cor);
      doc.roundedRect(x, ctx.y, 3.5, 3.5, 1, 1, 'F');
      doc.setTextColor(...TINTA); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      ctx.texto(nome, x + 5.5, ctx.y + 3);
    });

    // grade bem leve e escala 0 / 50 / 100
    doc.setDrawColor(...TRILHO); doc.setLineWidth(0.25);
    [0, 50, 100].forEach(v => {
      doc.line(x0, yDe(v), x0 + largura, yDe(v));
      doc.setTextColor(...CINZA); doc.setFontSize(7.5);
      ctx.texto(String(v), x0 - 2, yDe(v) + 1, { align: 'right' });
    });

    // ondas: área translúcida + linha + pontos
    [[a, COR_ANTES], [b, COR_DEPOIS]].forEach(([r, cor]) => {
      const valores = PILARES.map(([chave]) => r.pilares ? r.pilares[chave] : null);
      trechos(valores).forEach(indices => {
        const pts = indices.map(i => ({ x: xs[i], y: yDe(valores[i]) }));
        if (pts.length > 1) {
          const segs = onda(pts);
          const rel = [];
          let px = pts[0].x, py = pts[0].y;
          segs.forEach(s => {
            rel.push([s.c1[0] - px, s.c1[1] - py, s.c2[0] - px, s.c2[1] - py, s.p[0] - px, s.p[1] - py]);
            px = s.p[0]; py = s.p[1];
          });
          // área: desce até a base, volta pela base e fecha
          const area = [[0, pts[0].y - base]].concat(rel, [[0, base - py], [pts[0].x - px, 0]]);
          doc.saveGraphicsState();
          doc.setGState(new doc.GState({ opacity: 0.16 }));
          doc.setFillColor(...cor);
          doc.lines(area, pts[0].x, base, [1, 1], 'F', true);
          doc.restoreGraphicsState();
          doc.setDrawColor(...cor); doc.setLineWidth(0.7);
          doc.lines(rel, pts[0].x, pts[0].y, [1, 1], 'S', false);
        }
        pts.forEach(p => {
          doc.setFillColor(...cor); doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.6);
          doc.circle(p.x, p.y, 1.3, 'FD');
        });
      });
    });

    // pilar sem dados nos dois relatórios: avisa no lugar da onda
    PILARES.forEach(([chave], i) => {
      if (!temNota(a.pilares[chave]) && !temNota(b.pilares[chave])) {
        doc.setTextColor(...CINZA); doc.setFont('helvetica', 'italic'); doc.setFontSize(8.5);
        ctx.texto('sem dados', xs[i], yDe(50), { align: 'center' });
      }
    });

    // nomes dos pilares embaixo
    doc.setTextColor(...TINTA); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    PILARES.forEach(([, nome], i) => ctx.texto(nome, xs[i], base + 6, { align: 'center' }));
    ctx.y = base + 14;
  }

  async function gerarComparacao(a, b, cmp, opcoes) {
    opcoes = opcoes || {};
    const ctx = novoDoc();
    const { doc } = ctx;
    const rotA = a.ano ? String(a.ano) : dataBr(a.gerado);
    const rotB = b.ano ? String(b.ano) : dataBr(b.gerado);
    const empresa = b.empresa || a.empresa || 'Sua empresa';

    doc.setProperties({
      title: latin1(`Comparação ESG - ${empresa}`),
      subject: 'Comparação de diagnósticos ESG gerada pelo Stitch',
      author: 'Stitch', creator: 'Stitch',
    });

    await cabecalho(ctx, 'STITCH · COMPARAÇÃO ESG', empresa, opcoes.logoUrl);
    doc.setTextColor(...CINZA); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    ctx.texto(`${rotA}  ->  ${rotB}   ·   Gerado em ${dataBr()}`, M, ctx.y);
    ctx.y += 8;

    /* avisos (versões diferentes, empresas diferentes...) */
    (cmp.avisos || []).forEach(aviso => {
      doc.setFontSize(9.5);
      const linhas = ctx.quebra(aviso, UTIL - 10);
      const h = linhas.length * 4.4 + 6;
      ctx.espaco(h + 3);
      doc.setFillColor(243, 228, 209); doc.setDrawColor(232, 201, 162);
      doc.roundedRect(M, ctx.y, UTIL, h, 2, 2, 'FD');
      doc.setTextColor(117, 71, 20);
      doc.text(linhas, M + 5, ctx.y + 5);
      ctx.y += h + 3;
    });

    /* nota geral: antes, depois e variação */
    ctx.y += 2;
    const caixa = (UTIL - 8) / 3;
    const cartoes = [
      [`Nota geral (${rotA})`, temNota(a.geral) ? `${a.geral}/100` : 'Sem dados', TINTA],
      [`Nota geral (${rotB})`, temNota(b.geral) ? `${b.geral}/100` : 'Sem dados', TINTA],
    ];
    if (temNota(a.geral) && temNota(b.geral)) {
      const d = b.geral - a.geral;
      cartoes.push(['Variação', d > 0 ? `+${d}` : String(d), d > 0 ? SOBE : d < 0 ? DESCE : CINZA]);
    } else {
      cartoes.push(['Variação', '-', CINZA]);
    }
    cartoes.forEach(([rot, valor, cor], i) => {
      const x = M + i * (caixa + 4);
      doc.setFillColor(244, 244, 230); doc.setDrawColor(...TRILHO);
      doc.roundedRect(x, ctx.y, caixa, 20, 3, 3, 'FD');
      doc.setTextColor(...CINZA); doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
      ctx.texto(rot, x + 5, ctx.y + 7);
      doc.setTextColor(...cor); doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
      ctx.texto(valor, x + 5, ctx.y + 15.5);
    });
    ctx.y += 30;

    /* onda por pilar */
    ctx.titulo('Por pilar');
    ctx.espaco(90);
    desenharOnda(ctx, a, b, rotA, rotB);

    /* tabela por pilar */
    const colunas = [M, M + 62, M + 104, M + 146];
    doc.setTextColor(...CINZA); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
    ['PILAR', rotA, rotB, 'VARIAÇÃO'].forEach((t, i) => ctx.texto(t, colunas[i], ctx.y));
    ctx.y += 3;
    PILARES.forEach(([chave, nome]) => {
      const va = a.pilares[chave], vb = b.pilares[chave];
      doc.setDrawColor(...TRILHO); doc.setLineWidth(0.25);
      doc.line(M, ctx.y, M + UTIL, ctx.y);
      ctx.y += 6;
      doc.setTextColor(...TINTA); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      ctx.texto(nome, colunas[0], ctx.y);
      doc.setFont('helvetica', 'normal');
      ctx.texto(temNota(va) ? `${va}% · ${faixa(va).label}` : 'Sem dados', colunas[1], ctx.y);
      ctx.texto(temNota(vb) ? `${vb}% · ${faixa(vb).label}` : 'Sem dados', colunas[2], ctx.y);
      if (temNota(va) && temNota(vb)) {
        const d = vb - va;
        doc.setTextColor(...(d > 0 ? SOBE : d < 0 ? DESCE : CINZA)); doc.setFont('helvetica', 'bold');
        ctx.texto(d > 0 ? `+${d}` : String(d), colunas[3], ctx.y);
      } else {
        ctx.texto('-', colunas[3], ctx.y);
      }
      ctx.y += 3;
    });
    ctx.y += 10;

    /* o que melhorou / o que piorou */
    const lista = (titulo, itens, vazio, cor) => {
      ctx.titulo(titulo);
      if (!itens.length) {
        doc.setTextColor(...CINZA); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        ctx.texto(vazio, M, ctx.y);
        ctx.y += 10;
        return;
      }
      itens.forEach(m => {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
        const pergunta = ctx.quebra(m.t, UTIL - 10);
        doc.setFontSize(9.5);
        const de = ctx.quebra(`Antes: ${m.de} (${m.sa}/100)`, UTIL - 10);
        const para = ctx.quebra(`Agora: ${m.para} (${m.sb}/100)`, UTIL - 10);
        const altura = 9 + pergunta.length * 4.6 + (de.length + para.length) * 4.4 + 5;
        ctx.espaco(altura);
        doc.setFillColor(...cor);
        doc.rect(M, ctx.y - 4, 1.2, altura - 4, 'F');
        doc.setTextColor(...TINTA); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
        ctx.texto(`${NOMES[m.p] || ''}: ${m.tm || ''}`, M + 5, ctx.y);
        doc.setTextColor(...cor);
        ctx.texto(m.d > 0 ? `+${m.d}` : String(m.d), M + UTIL, ctx.y, { align: 'right' });
        ctx.y += 5;
        doc.setTextColor(...TINTA); doc.setFont('helvetica', 'normal');
        doc.text(pergunta, M + 5, ctx.y);
        ctx.y += pergunta.length * 4.6;
        doc.setTextColor(...CINZA); doc.setFontSize(9.5);
        doc.text(de, M + 5, ctx.y); ctx.y += de.length * 4.4;
        doc.text(para, M + 5, ctx.y); ctx.y += para.length * 4.4 + 6;
      });
      ctx.y += 2;
    };
    const mudancas = cmp.mudancas || [];
    lista('O que melhorou', mudancas.filter(m => m.d > 0).sort((x, y) => y.d - x.d), 'Nenhuma pergunta melhorou.', SOBE);
    lista('O que piorou', mudancas.filter(m => m.d < 0).sort((x, y) => x.d - y.d), 'Nenhuma pergunta piorou.', DESCE);

    ctx.espaco(10);
    doc.setTextColor(...CINZA); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    ctx.texto(`${cmp.iguais || 0} pergunta(s) ficaram com a mesma pontuação.`, M, ctx.y);

    rodape(ctx, 'Stitch · Comparação de diagnósticos ESG');
    doc.save(`comparacao-esg-${slug(empresa) || 'empresa'}-${slug(rotA)}-${slug(rotB)}.pdf`);
    return doc;
  }

  window.StitchPDF = { gerar, gerarComparacao, nomeDoArquivo };
  window.StitchGraficos = { onda, trechos, PILARES: PILARES.map(p => [p[0], p[1]]) };
})();
