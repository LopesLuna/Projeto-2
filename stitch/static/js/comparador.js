// ============================================================
// Comparador de relatórios ESG (PDFs gerados pelo questionario.js)
// Lê os dados embutidos em cada PDF (pdf.js) e compara os dois.
// Tudo acontece no navegador: os arquivos não são enviados a nenhum servidor.
// ============================================================
(function () {
  'use strict';
 
  const NAMES = { ambiente: "Meio ambiente", social: "Social", governanca: "Governança", lucro: "Lucro" };
  const STATES = [
    { max: 24, label: "Crítico", color: "#c6534d" },
    { max: 44, label: "Preocupante", color: "#d28a42" },
    { max: 74, label: "Estável", color: "#497eb0" },
    { max: 100, label: "Excelente", color: "#3b785b" }
  ];
  const stateOf = v => STATES.find(s => v <= s.max) || STATES[3];
 
  const $ = id => document.getElementById(id);
  // Os dados vêm de um arquivo enviado pela pessoa: só usamos textContent (nunca innerHTML).
  const el = (tag, cls, txt) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  };
 
  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
 
  /* ---------- leitura dos dados embutidos no PDF ---------- */
  async function ler(arquivo) {
    if (!window.pdfjsLib) throw new Error('Não foi possível carregar o leitor de PDF. Verifique a conexão com a internet.');
    const buffer = await arquivo.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const meta = await pdf.getMetadata();
    const palavras = (meta.info && meta.info.Keywords) || '';
    if (!palavras.startsWith('ESGDATA:')) {
      throw new Error(`“${arquivo.name}” não foi gerado pelo botão “Baixar relatório em PDF” do diagnóstico ESG. ` +
        'PDFs criados por “imprimir em PDF” perdem os dados.');
    }
    let dados;
    try {
      const bin = atob(palavras.slice(8));
      dados = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))));
    } catch (e) {
      throw new Error(`Os dados de “${arquivo.name}” estão corrompidos.`);
    }
    return validar(dados, arquivo.name);
  }
 
  function validar(d, nome) {
    const ok = d && typeof d === 'object' && d.pilares && Array.isArray(d.itens) &&
      Object.keys(NAMES).every(p => Number.isFinite(d.pilares[p]));
    if (!ok) throw new Error(`Os dados de “${nome}” estão incompletos ou foram alterados.`);
    d.itens = d.itens.filter(x => x && typeof x.c === 'string' && Number.isFinite(x.s));
    return d;
  }
 
  /* ---------- apresentação ---------- */
  function delta(n) {
    const sinal = n > 0 ? '+' : '';
    const cls = n > 0 ? 'sobe' : n < 0 ? 'desce' : 'igual';
    const simbolo = n > 0 ? '▲ ' : n < 0 ? '▼ ' : '= ';
    return el('span', cls, simbolo + sinal + n);
  }
 
  function aviso(msg) { $('cmp-avisos').append(el('p', 'cmp-aviso', msg)); }
 
  function cartao(titulo, valor, rodape) {
    const c = el('div', 'cmp-card');
    c.append(el('small', '', titulo), el('strong', '', valor));
    if (rodape) c.append(rodape);
    return c;
  }
 
  function linhaMudanca(m) {
    const card = el('div', 'ri');
    const cab = el('div', 'rh');
    cab.append(el('span', '', `${NAMES[m.p] || ''}: ${m.tm || ''}`), delta(m.d));
    card.append(cab, el('p', '', m.t || ''));
    card.append(el('p', 'tip', `Antes: ${m.de} (${m.sa}/100)`));
    card.append(el('p', 'tip', `Agora: ${m.para} (${m.sb}/100)`));
    return card;
  }
 
  function lista(destino, itens, vazio) {
    destino.replaceChildren();
    if (!itens.length) destino.append(el('p', 'tip', vazio));
    itens.forEach(m => destino.append(linhaMudanca(m)));
  }
 
  function mostrar(a, b) {
    // A = mais antigo, B = mais recente
    $('cmp-avisos').replaceChildren();
    if (a.v !== b.v) {
      aviso(`Os relatórios usam versões diferentes do questionário (${a.v} e ${b.v}). ` +
        'Compare as notas com cautela: perguntas e faixas podem ter mudado. ' +
        'Só as perguntas presentes nos dois são comparadas.');
    }
    if ((a.empresa || '').trim().toLowerCase() !== (b.empresa || '').trim().toLowerCase()) {
      aviso(`Os relatórios são de empresas diferentes (“${a.empresa}” e “${b.empresa}”).`);
    }
    if (a.ano === b.ano && a.gerado === b.gerado) {
      aviso('Os dois arquivos parecem ser o mesmo relatório.');
    }
 
    $('cmp-titulo').textContent = `${b.empresa}: ${a.ano} → ${b.ano}`;
 
    // resumo
    const resumo = $('cmp-resumo');
    resumo.replaceChildren();
    resumo.append(
      cartao(`Nota geral (${a.ano})`, `${a.geral}/100`),
      cartao(`Nota geral (${b.ano})`, `${b.geral}/100`),
      cartao('Variação', '', delta(b.geral - a.geral))
    );
    resumo.children[2].querySelector('strong').remove();
 
    // tabela por pilar
    const tabela = el('table', 'cmp-tabela');
    const cab = el('tr');
    ['Pilar', String(a.ano), String(b.ano), 'Variação'].forEach(t => cab.append(el('th', '', t)));
    tabela.append(cab);
    Object.keys(NAMES).forEach(p => {
      const va = a.pilares[p], vb = b.pilares[p];
      const tr = el('tr');
      tr.append(el('td', '', NAMES[p]));
      const ta = el('td', '', `${stateOf(va).label} (${va}%)`);
      const tb = el('td', '', `${stateOf(vb).label} (${vb}%)`);
      const td = el('td'); td.append(delta(vb - va));
      tr.append(ta, tb, td);
      tabela.append(tr);
    });
    $('cmp-pilares').replaceChildren(tabela);
 
    // mudanças pergunta a pergunta (pelo código da pergunta)
    const antes = new Map(a.itens.map(x => [x.c, x]));
    const mudancas = [];
    let iguais = 0;
    b.itens.forEach(xb => {
      const xa = antes.get(xb.c);
      if (!xa) return;
      if (xa.s === xb.s) { iguais++; return; }
      mudancas.push({ p: xb.p, tm: xb.tm, t: xb.t, de: String(xa.a), para: String(xb.a), sa: xa.s, sb: xb.s, d: xb.s - xa.s });
    });
    lista($('cmp-melhoras'), mudancas.filter(m => m.d > 0).sort((x, y) => y.d - x.d), 'Nenhuma pergunta melhorou.');
    lista($('cmp-pioras'), mudancas.filter(m => m.d < 0).sort((x, y) => x.d - y.d), 'Nenhuma pergunta piorou.');
    $('cmp-iguais').textContent = `${iguais} pergunta(s) ficaram com a mesma pontuação.`;
 
    $('cmp-resultado').hidden = false;
    $('cmp-resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
 
  /* ---------- ação do botão ---------- */
  function erro(msg) {
    const p = $('cmp-erro');
    p.textContent = msg;
    p.hidden = !msg;
  }
 
  $('comparar').addEventListener('click', async () => {
    erro('');
    $('cmp-resultado').hidden = true;
    const fa = $('pdfA').files[0], fb = $('pdfB').files[0];
    if (!fa || !fb) { erro('Selecione os dois relatórios em PDF.'); return; }
 
    const botao = $('comparar');
    botao.disabled = true;
    botao.textContent = 'Lendo os PDFs…';
    try {
      const [x, y] = await Promise.all([ler(fa), ler(fb)]);
      // ordena do mais antigo para o mais recente (ano; depois data de geração)
      const [a, b] = [x, y].sort((m, n) => (m.ano - n.ano) || String(m.gerado).localeCompare(String(n.gerado)));
      mostrar(a, b);
    } catch (e) {
      erro(e.message || 'Não foi possível ler os PDFs.');
    } finally {
      botao.disabled = false;
      botao.textContent = 'Comparar';
    }
  });
})();