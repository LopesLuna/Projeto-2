// ============================================================
// Comparador de relatórios ESG (PDFs gerados pelo diagnóstico)
// Lê os dados embutidos em cada PDF (pdf.js), compara os dois e
// gera um terceiro PDF com a comparação (relatorio-pdf.js).
// Tudo acontece no navegador: os arquivos não são enviados a nenhum servidor.
// ============================================================
(function () {
  'use strict';

  const NAMES = { ambiente: "Meio ambiente", social: "Social", governanca: "Governança", lucro: "Lucro" };
  const $ = id => document.getElementById(id);
  const raiz = $('comparador-esg');
  if (!raiz) return;

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
      throw new Error(`“${arquivo.name}” não é um relatório do diagnóstico do Stitch.`);
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
    // pilar sem nenhuma pergunta respondida vem como null
    const ok = d && typeof d === 'object' && d.pilares && Array.isArray(d.itens) &&
      Object.keys(NAMES).every(p => d.pilares[p] === null || Number.isFinite(d.pilares[p]));
    if (!ok) throw new Error(`Os dados de “${nome}” estão incompletos ou foram alterados.`);
    d.itens = d.itens.filter(x => x && typeof x.c === 'string' && Number.isFinite(x.s));
    return d;
  }

  /* ---------- comparação (vai para o PDF) ---------- */
  function comparar(a, b) {
    // a = mais antigo, b = mais recente
    const avisos = [];
    if (a.v !== b.v) {
      avisos.push(`Os relatórios usam versões diferentes do questionário (${a.v} e ${b.v}). ` +
        'Só as perguntas presentes nos dois foram comparadas.');
    }
    if ((a.empresa || '').trim().toLowerCase() !== (b.empresa || '').trim().toLowerCase()) {
      avisos.push(`Os relatórios são de empresas diferentes (“${a.empresa}” e “${b.empresa}”).`);
    }
    if (a.ano === b.ano && a.gerado === b.gerado) {
      avisos.push('Os dois arquivos parecem ser o mesmo relatório.');
    }

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
    return { avisos, mudancas, iguais };
  }

  /* ---------- áreas de arrastar/escolher o PDF ---------- */
  document.querySelectorAll('.cmp-zona').forEach(zona => {
    const input = zona.querySelector('input');
    const nome = zona.querySelector('.cmp-zona-nome');
    const padrao = nome.textContent;
    input.addEventListener('change', () => {
      const arquivo = input.files[0];
      nome.textContent = arquivo ? arquivo.name : padrao;
      zona.classList.toggle('tem-arquivo', !!arquivo);
      mensagem('', '');
    });
    // o input cobre a área inteira, então soltar o arquivo em cima já funciona;
    // aqui só destacamos a área enquanto o arquivo está por cima
    zona.addEventListener('dragenter', () => zona.classList.add('arrastando'));
    zona.addEventListener('dragleave', () => zona.classList.remove('arrastando'));
    zona.addEventListener('drop', () => zona.classList.remove('arrastando'));
  });

  function mensagem(erro, ok) {
    $('cmp-erro').textContent = erro; $('cmp-erro').hidden = !erro;
    $('cmp-ok').textContent = ok; $('cmp-ok').hidden = !ok;
  }

  /* ---------- botão Comparar ---------- */
  $('comparar').addEventListener('click', async () => {
    mensagem('', '');
    const fa = $('pdfA').files[0], fb = $('pdfB').files[0];
    if (!fa || !fb) { mensagem('Escolha os dois relatórios em PDF.', ''); return; }
    if (!window.StitchPDF) { mensagem('O gerador de PDF não carregou. Verifique a conexão com a internet.', ''); return; }

    const botao = $('comparar');
    botao.disabled = true;
    botao.textContent = 'Comparando…';
    try {
      const [x, y] = await Promise.all([ler(fa), ler(fb)]);
      // ordena do mais antigo para o mais recente (ano; depois data de geração)
      const [a, b] = [x, y].sort((m, n) => ((m.ano || 0) - (n.ano || 0)) || String(m.gerado).localeCompare(String(n.gerado)));
      await window.StitchPDF.gerarComparacao(a, b, comparar(a, b), { logoUrl: raiz.dataset.logo });
      mensagem('', 'Pronto! A comparação foi baixada em PDF.');
    } catch (e) {
      mensagem(e.message || 'Não foi possível ler os PDFs.', '');
    } finally {
      botao.disabled = false;
      botao.textContent = 'Comparar';
    }
  });
})();
