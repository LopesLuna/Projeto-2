/* ==========================================================================
   Página Simuladores — controle dos cards (Simule / Veja) + quiz
 
   Precisa do script.js (o jogo) carregado antes: usamos a função global
   newGame() para dar o "play" no Simule.
 
   Regras do leiaute:
   - clicar num card recolhido abre ele (modo "teatro");
   - se o jogo/quiz AINDA NÃO começou, clicar fora (ou Esc) volta ao neutro;
   - depois de começar, clicar fora NÃO muda nada (ninguém perde progresso);
   - o botão "Voltar" sempre volta ao neutro, e o progresso fica guardado:
     ao reabrir o card, o jogo/quiz continua de onde parou.
   ========================================================================== */
(function () {
  'use strict';
 
  const stage = document.getElementById('simStage');
  if (!stage) return;
 
  /* ------------------------------------------------------------------
     1. Estado do leiaute
     ------------------------------------------------------------------ */
  const cards = {
    simule: document.getElementById('cardSimule'),
    veja: document.getElementById('cardVeja'),
  };
  const jaComecou = { simule: false, veja: false };
  let estado = 'neutral'; // 'neutral' | 'simule' | 'veja'
 
  function render() {
    stage.dataset.state = estado;
    Object.keys(cards).forEach(function (nome) {
      cards[nome].dataset.role =
        estado === 'neutral' ? 'idle' : estado === nome ? 'active' : 'min';
      cards[nome].dataset.started = String(jaComecou[nome]);
    });
    ajustarAltura();
  }
 
  /* ------------------------------------------------------------------
     Altura do palco acompanha o conteúdo do card ativo (depois que o
     jogo/quiz começou). Assim o jogo aparece inteiro e a PÁGINA rola,
     em vez de aparecer uma barra de rolagem dentro do card.
     Antes de começar, vale a altura padrão do CSS (--h-active).
     ------------------------------------------------------------------ */
  const ALTURA_MINIMA = 560;
  const mqMovel = window.matchMedia('(max-width: 720px)');
 
  function alturaDoConteudo(nome) {
    const corpo = cards[nome].querySelector('.duo-body');
    const miolo = corpo.firstElementChild;
    if (!miolo || corpo.offsetParent === null) return 0; // corpo escondido
    const css = getComputedStyle(corpo);
    return (
      miolo.offsetHeight +
      parseFloat(css.paddingTop) +
      parseFloat(css.paddingBottom)
    );
  }
 
  function ajustarAltura() {
    if (estado === 'neutral' || !jaComecou[estado]) {
      stage.style.removeProperty('--h-active');
      return;
    }
    const conteudo = alturaDoConteudo(estado);
    if (!conteudo) return;
 
    const css = getComputedStyle(stage);
    const faixa = parseFloat(css.getPropertyValue('--strip')) + parseFloat(css.getPropertyValue('--gap'));
    // Simule: o Veja vira faixa embaixo. Veja no celular: o Simule vira faixa em cima.
    // Veja no desktop: o Simule é uma coluna ao lado, não soma altura.
    const total = estado === 'simule' || mqMovel.matches ? conteudo + faixa : conteudo;
    stage.style.setProperty('--h-active', Math.max(Math.ceil(total), ALTURA_MINIMA) + 'px');
  }
 
  if ('ResizeObserver' in window) {
    const olho = new ResizeObserver(ajustarAltura);
    Object.keys(cards).forEach(function (nome) {
      const miolo = cards[nome].querySelector('.duo-body').firstElementChild;
      if (miolo) olho.observe(miolo);
    });
  }
  window.addEventListener('resize', ajustarAltura);
 
  // Duração da animação do CSS (--sim-dur), em milissegundos.
  function duracaoAnimacao() {
    const v = getComputedStyle(stage).getPropertyValue('--sim-dur').trim();
    const n = parseFloat(v);
    if (isNaN(n)) return 600;
    return v.endsWith('ms') ? n : n * 1000;
  }
 
  let temporizadorMovimento;
 
  // Troca o leiaute. Durante a animação o conteúdo dos cards fica escondido
  // (data-moving) e volta quando o card termina de se mexer.
  function irPara(novoEstado) {
    estado = novoEstado;
    stage.dataset.moving = 'true';
    render();
    clearTimeout(temporizadorMovimento);
    temporizadorMovimento = setTimeout(function () {
      delete stage.dataset.moving;
      ajustarAltura();
    }, duracaoAnimacao() + 50);
  }
 
  function jogar(nome) {
    jaComecou[nome] = true;
 
    if (nome === 'simule') {
      if (typeof newGame === 'function') newGame(); // do script.js
    } else {
      quizIniciar();
    }
 
    render();
 
    const alvo =
      nome === 'simule'
        ? document.getElementById('decisionCard')
        : stage.querySelector('#quizChoices .quiz-choice');
    if (alvo) alvo.focus({ preventScroll: true });
  }
 
  // Cliques dentro do palco: abrir / jogar / voltar
  stage.addEventListener('click', function (e) {
    const botao = e.target.closest('[data-action]');
    if (!botao) return;
 
    const nome = botao.closest('.duo-card').dataset.card;
 
    if (botao.dataset.action === 'open') {
      irPara(nome);
    } else if (botao.dataset.action === 'play') {
      jogar(nome);
    } else if (botao.dataset.action === 'back') {
      irPara('neutral');
      cards[nome].querySelector('.duo-open').focus({ preventScroll: true });
    }
  });
 
  // Clique fora: só recolhe se o card aberto ainda não foi iniciado.
  // (composedPath é calculado na hora do clique, então continua certo mesmo
  //  que o botão clicado seja removido da página pelo quiz logo depois.)
  const IGNORAR_CLIQUE =
    '#simStage, #simCta, .st-hero, .st-footer, .st-modal, .header, .footer, .modal';
 
  document.addEventListener('click', function (e) {
    if (estado === 'neutral' || jaComecou[estado]) return;
 
    const dentro = e.composedPath().some(function (no) {
      return no.matches && no.matches(IGNORAR_CLIQUE);
    });
    if (!dentro) irPara('neutral');
  });
 
  // Esc = Voltar (seguro, porque o progresso fica guardado)
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || estado === 'neutral') return;
 
    const modalLogin = document.getElementById('modal-login');
    if (modalLogin && modalLogin.classList.contains('aberto')) return; // Esc fecha o modal
 
    irPara('neutral');
  });
 
  // "simule com seus dados reais!" é um link comum para a página do diagnóstico
  // (ver o href no simuladores.html). Se o diagnóstico passar a exigir login,
  // é o Django (login_required) que redireciona; não precisa de JS aqui.
 
  /* ------------------------------------------------------------------
     2. Quiz do card "Veja"
 
     TODO (equipe): os dados abaixo vêm de fontes públicas, mas confira e
     troque pelas fontes oficiais do projeto antes de publicar. Números de
     pegada hídrica variam bastante entre estudos.
     `correta` é o índice (começando em 0) da opção certa.
     ------------------------------------------------------------------ */
  const QUIZ_PERGUNTAS = [
    {
      pergunta: 'Qual destes produtos consome mais água para ser produzido (média global)?',
      opcoes: ['Um hambúrguer', 'Uma xícara de café', 'Uma camiseta de algodão', 'Uma taça de vinho'],
      correta: 2,
      explicacao:
        'Pelas médias globais de pegada hídrica, uma camiseta de algodão leva cerca de 2.700 litros, ' +
        'contra cerca de 2.400 do hambúrguer, 140 da xícara de café e 120 da taça de vinho. ' +
        'Os valores variam conforme a metodologia, mas o algodão é sempre intensivo em água.',
      fonte: 'Arjen Hoekstra / Water Footprint Network, médias divulgadas pelo WWF-Brasil (2011).',
    },
    {
      pergunta: 'Que parcela do material usado para fazer roupas é reciclada e vira roupa nova?',
      opcoes: ['Cerca de 40%', 'Cerca de 15%', 'Cerca de 70%', 'Menos de 1%'],
      correta: 3,
      explicacao:
        'Menos de 1% do material usado na produção de roupas volta a ser roupa. ' +
        'O relatório estima uma perda de mais de US$ 100 bilhões por ano em materiais.',
      fonte: 'Ellen MacArthur Foundation, "A New Textiles Economy" (2017).',
    },
    {
      pergunta: 'A cada segundo, o equivalente a quê em roupas e tecidos vai para aterro ou é queimado?',
      opcoes: ['Uma camiseta', 'Um caminhão de lixo cheio', 'Um contêiner de navio', 'Um ônibus lotado'],
      correta: 1,
      explicacao: 'O equivalente a um caminhão de lixo cheio de têxteis, a cada segundo.',
      fonte: 'Ellen MacArthur Foundation, "A New Textiles Economy" (2017).',
    },
    {
      pergunta: 'Meio milhão de toneladas de microfibras saem das roupas para os oceanos todo ano. Isso equivale a quantas garrafas plásticas?',
      opcoes: ['Mais de 50 bilhões', 'Cerca de 5 bilhões', 'Cerca de 500 milhões', 'Cerca de 5 milhões'],
      correta: 0,
      explicacao:
        'São mais de 50 bilhões de garrafas plásticas por ano, em microfibras liberadas principalmente ' +
        'nas lavagens, e elas podem entrar na cadeia alimentar.',
      fonte: 'Ellen MacArthur Foundation, "A New Textiles Economy" (2017).',
    },
  ];
 
  // ----------------------------------------------------------------
  // Perguntas do quiz de perfil ESG (substitui QUIZ_PERGUNTAS no passo 4).
  // Fonte dos pesos e dos dados: doc "Quiz do card Veja".
  // pontos: [E, S, G] que a resposta soma.
  // vai: id da próxima pergunta. Se a opção não tiver "vai", usa "proxima".
  // ----------------------------------------------------------------
  const QUIZ_ESG = [
    {
      id: 'q1',
      proxima: 'q2',
      pergunta: 'O que acontece com os retalhos de tecido que sobram?',
      opcoes: [
        { texto: 'Vão para o lixo comum', pontos: [0, 0, 0] },
        { texto: 'Ficam guardados, sem destino definido', pontos: [0, 0, 0] },
        { texto: 'Vendo ou doo (artesãos, reciclagem, upcycling)', pontos: [2, 1, 0] },
        { texto: 'Reaproveito na própria produção', pontos: [2, 0, 0] },
        { texto: 'Não sei', pontos: [0, 0, 0] },
      ],
      dado: 'Em MG, cerca de 70% dos pequenos negócios reciclam ou reaproveitam materiais; no Brasil, só 31% das micro e pequenas empresas usam material reciclável na produção.',
      fonte: 'Sebrae Minas 2026 (MG, todos os setores); Sebrae nacional 2024 (micro e pequenas, todos os setores)',
    },
    {
      id: 'q2',
      proxima: 'q3',
      pergunta: 'Como você decide quanto produzir de cada peça?',
      opcoes: [
        { texto: 'Lotes grandes, vendo depois', pontos: [0, 0, 0] },
        { texto: 'Lotes médios, repondo conforme vende', pontos: [1, 0, 0] },
        { texto: 'Pré-venda ou lotes pequenos', pontos: [2, 0, 1] },
        { texto: 'Só sob encomenda', pontos: [2, 0, 1] },
      ],
      dado: 'A produção de roupas dobrou entre 2000 e 2015, e as margens das maiores varejistas de vestuário do mundo caíram 40% em média entre 2016 e 2019, em parte por excesso de estoque, falta de estoque e devoluções.',
      fonte: 'Ellen MacArthur Foundation, Circular business models (2021): escopo mundial, grandes varejistas',
    },
    {
      id: 'q3',
      pergunta: 'Parte da costura é feita por oficinas terceirizadas?',
      opcoes: [
        { texto: 'Não, a costura é toda interna', pontos: [0, 1, 0], vai: 'q4' },
        { texto: 'Sim, parte da costura', pontos: [0, 0, 0], vai: 'q3b' },
        { texto: 'Sim, quase toda a costura', pontos: [0, 0, 0], vai: 'q3b' },
      ],
      dado: 'Desde 2010, o Programa Abvtex monitora fornecedores e subcontratados das grandes redes de varejo de moda: são 3.433 empresas aprovadas e 67.846 auditorias, e o selo dá acesso a negócios com as maiores redes.',
      fonte: 'Programa Abvtex, Sobre o programa: varejo de moda do Brasil',
    },
    {
      id: 'q3b',
      proxima: 'q4',
      pergunta: 'Você tem cadastro das oficinas (quem são, onde ficam, condições)?',
      opcoes: [
        { texto: 'Não tenho cadastro', pontos: [0, 0, 0] },
        { texto: 'Só os contatos no celular', pontos: [0, 0, 1] },
        { texto: 'Cadastro com dados básicos (planilha)', pontos: [0, 1, 2] },
        { texto: 'Cadastro e visita ou verificação das condições', pontos: [0, 2, 2] },
      ],
      dado: '87% dos 1,3 milhão de profissionais de costura no Brasil são mulheres, maioria também no mercado informal do setor.',
      fonte: 'ONU Mulheres, Mulheres na Confecção (2022), citando a Abravest',
    },
    {
      id: 'q4',
      proxima: 'q5',
      pergunta: 'Se um cliente pedisse, você conseguiria comprovar de onde veio o tecido?',
      opcoes: [
        { texto: 'Não, compro sem nota detalhada', pontos: [0, 0, 0] },
        { texto: 'Sei o fornecedor, mas sem registro', pontos: [0, 0, 1] },
        { texto: 'Tenho nota e fornecedor registrados', pontos: [0, 0, 2] },
        { texto: 'Tenho certificado ou rastreio (selo, QR code)', pontos: [1, 0, 2] },
      ],
      dado: 'A UE deve definir em 2027 as regras do Passaporte Digital de Produto e, a partir de 2030, ele será obrigatório para todos os têxteis e roupas vendidos na União Europeia.',
      fonte: 'GS1 in Europe (2023): vale para quem vende na UE; prazos podem mudar',
    },
    {
      id: 'q5',
      proxima: 'q6',
      pergunta: 'Você acompanha o consumo de energia e água da produção?',
      opcoes: [
        { texto: 'Só pago a conta', pontos: [0, 0, 0] },
        { texto: 'Olho quando a conta sobe', pontos: [1, 0, 0] },
        { texto: 'Acompanho todo mês', pontos: [2, 0, 1] },
        { texto: 'Acompanho e tenho meta ou ação para reduzir', pontos: [2, 0, 2] },
      ],
      dado: '70% das micro e pequenas empresas controlam o consumo de energia e 64% o de água; em MG, só 10% têm práticas planejadas com acompanhamento de custos e resultados, e 53% dos donos apontam queda de custos operacionais como vantagem.',
      fonte: 'Sebrae nacional 2024; Sebrae Minas 2026 (a matéria não detalha a base dos 53%)',
    },
    {
      id: 'q6',
      proxima: 'resultado',
      pergunta: 'Você comunica ações sustentáveis ou sociais da marca (e-commerce, etiqueta, redes)?',
      opcoes: [
        { texto: 'Não comunico', pontos: [0, 0, 0] },
        { texto: 'Comunico, mas sem dados nem prova', pontos: [0, 0, 0] },
        { texto: 'Comunico só o que consigo provar', pontos: [0, 0, 2] },
        { texto: 'Comunico com dados, relatório ou QR code', pontos: [0, 1, 2] },
      ],
      dado: 'Em MG, 57% dos donos apontam melhora da imagem perante clientes e a comunidade, mas menos de 4% têm ações estruturadas e comunicam essas iniciativas.',
      fonte: 'Sebrae Minas 2026',
    },
  ];
 
  const q = {
    etapaPergunta: document.getElementById('quizQuestionStage'),
    etapaResultado: document.getElementById('quizResultStage'),
    progresso: document.getElementById('quizProgress'),
    pergunta: document.getElementById('quizQuestion'),
    opcoes: document.getElementById('quizChoices'),
    feedback: document.getElementById('quizFeedback'),
    feedbackTitulo: document.getElementById('quizFeedbackTitle'),
    feedbackTexto: document.getElementById('quizFeedbackText'),
    fonte: document.getElementById('quizSource'),
    proxima: document.getElementById('quizNext'),
    placar: document.getElementById('resultScore'),
    percentual: document.getElementById('resultPercentage'),
    mensagem: document.getElementById('resultMessage'),
    refazer: document.getElementById('quizRestart'),
  };
 
  let indice = 0;
  let acertos = 0;
 
  function quizIniciar() {
    indice = 0;
    acertos = 0;
    q.etapaResultado.hidden = true;
    q.etapaPergunta.hidden = false;
    quizMostrarPergunta();
  }
 
  function quizMostrarPergunta() {
    const item = QUIZ_PERGUNTAS[indice];
 
    q.progresso.textContent = 'Pergunta ' + (indice + 1) + ' de ' + QUIZ_PERGUNTAS.length;
    q.pergunta.textContent = item.pergunta;
    q.feedback.hidden = true;
    q.opcoes.innerHTML = '';
 
    item.opcoes.forEach(function (texto, i) {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'quiz-choice';
      botao.textContent = texto;
      botao.dataset.index = String(i);
      q.opcoes.appendChild(botao);
    });
  }
 
  function quizResponder(escolhida) {
    const item = QUIZ_PERGUNTAS[indice];
    const acertou = escolhida === item.correta;
    if (acertou) acertos++;
 
    Array.prototype.forEach.call(q.opcoes.children, function (botao, i) {
      botao.disabled = true;
      if (i === item.correta) botao.classList.add('is-correct');
      else if (i === escolhida) botao.classList.add('is-wrong');
    });
 
    q.feedback.classList.toggle('is-wrong', !acertou);
    q.feedbackTitulo.textContent = acertou ? 'Isso mesmo!' : 'Quase! A resposta certa está marcada.';
    q.feedbackTexto.textContent = item.explicacao;
    q.fonte.textContent = 'Fonte: ' + item.fonte;
    q.proxima.textContent =
      indice === QUIZ_PERGUNTAS.length - 1 ? 'Ver resultado' : 'Próxima pergunta';
    q.feedback.hidden = false;
    q.proxima.focus({ preventScroll: true });
    q.proxima.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
 
  function quizProxima() {
    if (indice < QUIZ_PERGUNTAS.length - 1) {
      indice++;
      quizMostrarPergunta();
      const primeira = q.opcoes.querySelector('.quiz-choice');
      if (primeira) primeira.focus({ preventScroll: true });
    } else {
      quizResultado();
    }
  }
 
  function quizResultado() {
    const total = QUIZ_PERGUNTAS.length;
    const pct = Math.round((acertos / total) * 100);
 
    q.placar.textContent = acertos + ' de ' + total;
    q.percentual.textContent = pct + '%';
    q.mensagem.textContent =
      pct >= 75
        ? 'Você conhece bem o impacto da cadeia têxtil. Que tal ver como as decisões de uma empresa mudam esse cenário?'
        : 'O impacto da cadeia têxtil é maior do que muita gente imagina. No simulador você vê como decisões de gestão mudam esse cenário.';
 
    q.etapaPergunta.hidden = true;
    q.etapaResultado.hidden = false;
    q.refazer.focus({ preventScroll: true });
  }
 
  q.opcoes.addEventListener('click', function (e) {
    const botao = e.target.closest('.quiz-choice');
    if (botao && !botao.disabled) quizResponder(Number(botao.dataset.index));
  });
  q.proxima.addEventListener('click', quizProxima);
  q.refazer.addEventListener('click', function () {
    quizIniciar();
    const primeira = q.opcoes.querySelector('.quiz-choice');
    if (primeira) primeira.focus({ preventScroll: true });
  });
 
  render();
})();
 