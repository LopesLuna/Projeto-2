// SVG Icons
const SVG_ICONS = {
  supplier: `<svg viewBox="0 0 24 24"><path d="M16 16l3-8 3 8H16z"/><path d="M2 16l3-8 3 8H2z"/><path d="M7 21h10"/><path d="M12 3v18"/></svg>`,
  workload: `<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  waste: `<svg viewBox="0 0 24 24"><path d="M7 19a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7z"/><path d="M12 9v6"/><path d="M9 12h6"/></svg>`,
  investor: `<svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  privacy: `<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  diversity: `<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>`,
  energy: `<svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 10 12 10 13 2"/></svg>`,
  warning: `<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
};

const CARDS_PER_GAME = 5; // Quantidade de cartas sorteadas por partida

const NAMES = { profit: "Lucro", environment: "Meio ambiente", people: "Social", governance: "Governança" };
const STATES = [
  { max: 0, label: "Crítico", color: "#c6534d" },
  { max: 24, label: "Crítico", color: "#c6534d" },
  { max: 44, label: "Preocupante", color: "#d28a42" },
  { max: 74, label: "Estável", color: "#497eb0" },
  { max: 100, label: "Excelente", color: "#3b785b" }
];

const INDICATOR_DESCRIPTIONS = {
  profit: "Saúde financeira e capacidade de investimento.",
  environment: "Ecoeficiência, redução de pegada e capital natural.",
  people: "Produtividade, retenção, clima e direitos humanos.",
  governance: "Conformidade, transparência e controle de riscos."
};

const CRISIS_EVENTS = {
  profit_min: { title: "Falência Financeira", text: "A empresa esgotou a liquidez por decisões inconsequentes. A gestão sustentável exige estabilidade financeira." },
  environment_min: { title: "Interdição Ambiental", text: "Acúmulo de contaminação provocou um desastre ecológico. As autoridades suspenderam a licença da empresa." },
  people_min: { title: "Greve Geral e Fuga de Talentos", text: "A insatisfação e demissões em massa paralisaram a empresa. O pilar social ruiu." },
  governance_min: { title: "Prisão por Fraude e Perda de Licença", text: "Falta de transparência e quebra de regras resultaram em intervenção judicial imediata." }
};

// BANCO DE CARTAS (POOL PRINCIPAL DE EVENTOS ESG)
const RAW_EVENTS = [
  {
    id: "automation",
    title: "Automação Verde na Fábrica",
    pillar: "Ambiental vs Social",
    iconKey: "energy",
    description: "Substituir maquinário antigo por robôs ecoeficientes elimina o desperdício de energia, mas exige demitir metade dos operários.",
    lesson: "A transição ecológica precisa ser socialmente justa para evitar revoltas operacionais.",
    choices: [
      {
        label: "Instalar robôs ecoeficientes",
        effects: { profit: 10, environment: 22, people: -28, governance: 2 },
        passive: { profit: 2 },
        explanation: "Reduziu emissões e custos, mas gerou pânico e revolta no quadro social da fábrica."
      },
      {
        label: "Manter operação fabril manual",
        effects: { profit: -8, environment: -18, people: 16, governance: -2 },
        passive: { profit: -1 },
        explanation: "Preservou empregos locais, mas manteve despesas energéticas e contaminação elevadas."
      }
    ]
  },
  {
    id: "transparency",
    title: "Transparência Salarial Radical",
    pillar: "Governança vs Social",
    iconKey: "privacy",
    description: "Publicar relatórios detalhados expõe disparidades salariais internas de gênero e cargo. Fortalece a governança, mas acende atritos internos.",
    lesson: "A transparência fortalece a governança corporativa, mas exige coragem para corrigir injustiças internas.",
    choices: [
      {
        label: "Publicar relatório completo",
        effects: { profit: -6, governance: 22, people: -20, environment: 0 },
        passive: { governance: 1 },
        explanation: "Ganhou credibilidade no mercado e atraiu investidores, mas expôs graves falhas de igualdade salarial."
      },
      {
        label: "Manter relatório confidencial",
        effects: { profit: 8, governance: -22, people: 8, environment: 0 },
        passive: { governance: -1 },
        explanation: "Evitou tensões imediatas, mas comprometeu a pontuação de integridade da empresa."
      }
    ]
  },
  {
    id: "plant_closing",
    title: "Fechamento de Fábrica Poluente",
    pillar: "Ambiental vs Social",
    iconKey: "waste",
    description: "Uma unidade antiga responde por 40% das emissões. Fechá-la zera o passivo ecológico, mas devasta a economia do município local.",
    lesson: "Descarbonização sem plano comunitário gera colapso social imediato.",
    choices: [
      {
        label: "Fechar a unidade poluente",
        effects: { profit: -14, environment: 25, people: -30, governance: 6 },
        explanation: "Eliminou a maior fonte de contaminação da empresa, mas causou demissões massivas na região.",
        followUp: {
          id: "community_crisis",
          title: "Protestos e Crise Comunitária",
          pillar: "Social vs Governança",
          iconKey: "warning",
          description: "Sindicatos e ex-funcionários exigem um fundo de indenização e requalificação urgente.",
          lesson: "Ignorar impactos sociais de fechamentos gera processos e crises reputacionais devastadoras.",
          choices: [
            {
              label: "Financiar fundo comunitário",
              effects: { profit: -20, people: 24, governance: 10 },
              explanation: "Financiou a transição da comunidade, recuperando o pilar social."
            },
            {
              label: "Recusar apoio e manter corte",
              effects: { profit: 10, people: -25, governance: -20 },
              explanation: "Economizou verba imediata, mas sofreu sanções judiciais e protestos violentos."
            }
          ]
        }
      },
      {
        label: "Manter fábrica com reformas graduais",
        effects: { profit: 10, environment: -22, people: 14, governance: -10 },
        explanation: "Preservou os empregos comunitários, mas expôs a empresa a multas ambientais severas."
      }
    ]
  },
  {
    id: "retention_bonus",
    title: "Aumento Salarial Emergencial",
    pillar: "Social vs Lucro",
    iconKey: "workload",
    description: "A inflação e a concorrência ameaçam uma fuga de talentos técnicos. Um reajuste salarial amplo evita pedidos de demissão, mas compromete a margem do ano.",
    lesson: "Investir na retenção de pessoas é essencial, mas exige controle rigoroso do caixa.",
    choices: [
      {
        label: "Aprovar reajuste para todos",
        effects: { profit: -22, people: 25, governance: -8, environment: 0 },
        explanation: "Estabilizou o clima interno e reteve talentos, mas reduziu drasticamente o lucro líquido."
      },
      {
        label: "Congelar salários este ano",
        effects: { profit: 15, people: -26, governance: 12, environment: 0 },
        explanation: "Preservou a meta de lucro do conselho, mas provocou onda imediata de pedidos de demissão."
      }
    ]
  },
  {
    id: "packaging",
    title: "Substituição de Embalagens",
    pillar: "Ambiental vs Lucro",
    iconKey: "waste",
    description: "Substituir plásticos por embalagens biodegradáveis encarece os custos em 20%, reduzindo significativamente a margem bruta de vendas.",
    lesson: "Inovações em sustentabilidade ambiental afetam diretamente as margens operacionais de curto prazo.",
    choices: [
      {
        label: "Adotar biodegradável caro",
        effects: { profit: -22, environment: 24, governance: 6, people: 2 },
        passive: { environment: 1 },
        explanation: "Corte expressivo de resíduos plásticos, sacrificando a rentabilidade financeira imediata."
      },
      {
        label: "Manter plástico descartável",
        effects: { profit: 16, environment: -25, governance: -10, people: -4 },
        passive: { environment: -1 },
        explanation: "Garantiu lucro alto nas vendas, mas acumulou rejeição de consumidores e risco de novas taxas ecológicas."
      }
    ]
  },
  {
    id: "whistleblower",
    title: "Denúncia de Irregularidade Contábil",
    pillar: "Governança vs Lucro",
    iconKey: "warning",
    description: "Um auditor interno descobriu que diretorias inflaram resultados de trimestres passados. Abrir uma investigação interna destruirá o valor de mercado das ações.",
    lesson: "Controle ético previne escândalos judiciais, mesmo ao custo de desvalorização financeira temporária.",
    choices: [
      {
        label: "Contratar auditoria independente",
        effects: { profit: -25, governance: 28, people: 5, environment: 0 },
        explanation: "O mercado reagiu com queda nas ações, mas a postura firme evitou um processo criminal contra a diretoria."
      },
      {
        label: "Resolver o caso discretamente",
        effects: { profit: 12, governance: -30, people: -10, environment: 0 },
        explanation: "Manteve o valor das ações no curto prazo, mas destruiu a confiança no conselho de administração.",
        followUp: {
          id: "sec_investigation",
          title: "Vazamento e Investigação Federal",
          pillar: "Governança vs Lucro",
          iconKey: "privacy",
          description: "O caso foi vazado para a imprensa. Autoridades iniciaram uma devassa fiscal na sede da empresa.",
          lesson: "Encobrir falhas contábeis transforma problemas internos em colapsos institucionais públicos.",
          choices: [
            {
              label: "Colaborar com as autoridades",
              effects: { profit: -30, governance: 15, people: -10 },
              explanation: "Pagou multas bilionárias e afastou os diretores, iniciando a reconstrução reputacional."
            },
            {
              label: "Contestar na justiça",
              effects: { profit: -15, governance: -25, people: -15 },
              explanation: "Longa batalha judicial paralisou os investimentos da empresa e minou a marca."
            }
          ]
        }
      }
    ]
  },
  {
    id: "child_labor_supplier",
    title: "Trabalho Análogo à Escravidão na Cadeia",
    pillar: "Social vs Lucro",
    iconKey: "supplier",
    description: "Um grande fornecedor de matéria-prima foi flagrado usando trabalho infantil e precarizado. Romper o contrato imediatamente paralisará a produção por 2 meses.",
    lesson: "A responsabilidade ESG estende-se a toda a cadeia de fornecedores, não apenas à matriz.",
    choices: [
      {
        label: "Cancelar contrato imediatamente",
        effects: { profit: -24, people: 22, governance: 18, environment: 0 },
        explanation: "Interrompeu as entregas e reduziu vendas, mas protegeu os direitos humanos e a imagem da empresa."
      },
      {
        label: "Dar prazo de 6 meses para adequação",
        effects: { profit: 14, people: -28, governance: -20, environment: 0 },
        explanation: "Manteve as operações sem prejuízo imediato, mas causou enorme indignação pública ao ser noticiado."
      }
    ]
  },
  {
    id: "carbon_greenwashing",
    title: "Créditos de Carbono Duvidosos",
    pillar: "Ambiental vs Governança",
    iconKey: "energy",
    description: "A equipe de marketing propõe comprar créditos de carbono baratos de uma ONG não auditada para declarar a empresa como 'Zero Carbono' na campanha anual.",
    lesson: "Marketing ambiental sem comprovação sólida (Greenwashing) é um grande risco de governança.",
    choices: [
      {
        label: "Rejeitar e investir em floresta própria",
        effects: { profit: -18, environment: 20, governance: 15, people: 0 },
        passive: { environment: 1 },
        explanation: "Investimento caro e de longo prazo, mas garantiu descarbonização autêntica e auditada."
      },
      {
        label: "Comprar créditos baratos e lançar campanha",
        effects: { profit: 15, environment: 5, governance: -24, people: -5 },
        explanation: "Alavancou vendas imediatas com selo verde, mas ativistas denunciaram o crédito fantasma."
      }
    ]
  },
  {
    id: "toxic_waste_leak",
    title: "Vazamento Químico de Baixa Severidade",
    pillar: "Ambiental vs Lucro",
    iconKey: "waste",
    description: "Um vazamento menor contaminou o solo de um terreno adjacente à fábrica. A contenção voluntária total exige parar a fábrica por semanas.",
    lesson: "Tratar incidentes ambientais com transparência evita desastres ecológicos e sanções graves.",
    choices: [
      {
        label: "Notificar órgão ambiental e fazer descontaminação",
        effects: { profit: -20, environment: 24, governance: 14, people: 2 },
        explanation: "Assumiu os custos operacionais altos, mas neutralizou completamente os danos ao ecossistema."
      },
      {
        label: "Realizar contenção interna sem alarde",
        effects: { profit: 12, environment: -26, governance: -18, people: -6 },
        explanation: "Evitou a paralisação da fábrica, mas o lençol freático local sofreu contaminação acumulada."
      }
    ]
  },
  {
    id: "ai_surveillance",
    title: "Monitoramento Extensivo por IA",
    pillar: "Governança vs Social",
    iconKey: "privacy",
    description: "Para aumentar a produtividade no trabalho remoto, a gestão propõe instalar software de rastreamento por IA que mede cada clique e expressão dos funcionários.",
    lesson: "Inovação e eficiência não podem violar a dignidade e a privacidade dos colaboradores.",
    choices: [
      {
        label: "Bloquear implementação do software",
        effects: { profit: -5, people: 20, governance: 10, environment: 0 },
        explanation: "Manteve a confiança e a autonomia das equipes, preservando um bom clima organizacional."
      },
      {
        label: "Aprovar monitoramento por IA",
        effects: { profit: 16, people: -26, governance: 8, environment: 0 },
        explanation: "Aumentou entregas de curto prazo, mas gerou surto de ansiedade e onda de demissões."
      }
    ]
  },
  {
    id: "diversity_board",
    title: "Metas de Inclusão no Conselho Executivo",
    pillar: "Social vs Governança",
    iconKey: "diversity",
    description: "O conselho é composto 100% por homens seniores. Uma proposta exige criar cotas afirmativas de gênero e raça para as próximas 3 vagas de diretoria.",
    lesson: "Diversidade na liderança amplia perspectivas estratégicas e melhora o poder decisório.",
    choices: [
      {
        label: "Aprovar cotas obrigatórias",
        effects: { profit: -4, governance: 18, people: 22, environment: 0 },
        explanation: "Diversificou a alta gestão, atraindo investidores focados em critérios ESG e aumentando a inovação."
      },
      {
        label: "Manter processo seletivo tradicional",
        effects: { profit: 5, governance: -12, people: -16, environment: 0 },
        explanation: "Manteve a estrutura antiga sem atritos internos, mas recebeu duras críticas de fundos ESG."
      }
    ]
  },
  {
    id: "conflict_minerals",
    title: "Matéria-Prima de Zona de Conflito",
    pillar: "Ambiental vs Lucro",
    iconKey: "supplier",
    description: "Mineral essencial para as baterias da empresa é extraído de uma região de floresta nativa em área de litígio armado. Substituí-lo por sintéticos encarece os produtos em 35%.",
    lesson: "A integridade da oferta exige recusar insumos que financiem destruição ecológica ou violência.",
    choices: [
      {
        label: "Mudar para alternativa sintética limpa",
        effects: { profit: -25, environment: 22, governance: 16, people: 6 },
        passive: { profit: 1 },
        explanation: "Elevou os custos de produção, mas posicionou a marca como referência de ética global."
      },
      {
        label: "Manter fornecimento barato atual",
        effects: { profit: 20, environment: -24, governance: -22, people: -10 },
        explanation: "Gantiu margens de lucro recordes, mas deixou a empresa vulnerável a boicotes internacionais."
      }
    ]
  }
];

const $ = id => document.getElementById(id);

const game = {
  values: { profit: 60, environment: 60, people: 60, governance: 60 },
  passives: { profit: 0, environment: 0, people: 0, governance: 0 },
  totalPassiveProfitGained: 0,
  events: [],
  index: 0,
  history: [],
  snapshots: [],
  gameOver: false
};

let card, leftBtn, rightBtn;
let startX = 0, startY = 0, dragX = 0, dragging = false;

function stateOf(v) {
  return STATES.find(s => v <= s.max) || STATES[STATES.length - 1];
}

function apply(effects = {}) {
  for (const [k, v] of Object.entries(effects)) {
    game.values[k] = Math.max(0, Math.min(100, game.values[k] + v));
  }
  renderBars();
}

function applyPassives() {
  for (const [k, v] of Object.entries(game.passives)) {
    if (v !== 0) {
      game.values[k] = Math.max(0, Math.min(100, game.values[k] + v));
      if (k === 'profit' && v > 0) {
        game.totalPassiveProfitGained += v;
      }
    }
  }
  renderBars();
}

function renderBars() {
  for (const [k, v] of Object.entries(game.values)) {
    const wrap = document.querySelector(`[data-key="${k}"]`);
    if (!wrap) continue;
    const s = stateOf(v);
    const bar = $("bar-" + k);
    if (bar) bar.style.width = v + "%";
    if (bar) bar.style.background = s.color;
    const strong = wrap.querySelector("strong");
    if (strong) {
      strong.textContent = s.label;
      strong.style.color = s.color;
      strong.style.background = s.color + "20";
    }

    const passiveVal = game.passives[k];
    const passEl = $("passive-" + k);
    if (passEl) {
      passEl.textContent = (passiveVal > 0 ? "+" : "") + passiveVal + "/turno";
      passEl.className = "passive-val " + (passiveVal > 0 ? "positive" : passiveVal < 0 ? "negative" : "");
    }
  }
}

function shuffle(array) {
  const a = JSON.parse(JSON.stringify(array));
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function updateUndoBtn() {
  const btn = $("undoButton");
  if (!btn) return;
  const canUndo = game.snapshots && game.snapshots.length > 0;
  btn.disabled = !canUndo;
  btn.classList.toggle("disabled", !canUndo);
}

function undo() {
  if (!game.snapshots || game.snapshots.length === 0) return;
  const prev = game.snapshots.pop();
  game.values = prev.values;
  game.passives = prev.passives;
  game.totalPassiveProfitGained = prev.totalPassiveProfitGained;
  game.events = prev.events;
  game.index = prev.index;
  game.history = prev.history;
  game.gameOver = false;

  $("report").classList.add("hidden");
  $("gameArea").classList.remove("hidden");

  renderBars();
  renderEvent();
  updateUndoBtn();
}

function newGame() {
  game.values = { profit: 60, environment: 60, people: 60, governance: 60 };
  game.passives = { profit: 0, environment: 0, people: 0, governance: 0 };
  game.totalPassiveProfitGained = 0;
  game.history = [];
  game.snapshots = [];
  game.index = 0;
  game.gameOver = false;

  // Sorteia um subconjunto de cartas (CARDS_PER_GAME) do banco completo de cartas
  const pool = shuffle(RAW_EVENTS);
  game.events = pool.slice(0, Math.min(CARDS_PER_GAME, pool.length));

  $("report").classList.add("hidden");
  $("gameArea").classList.remove("hidden");
  renderBars();
  renderEvent();
  updateUndoBtn();
}

function renderEvent() {
  const e = game.events[game.index];
  if (!e) return finishGame(false);

  const swap = Math.random() < 0.5;
  e._renderChoices = swap ? [e.choices[1], e.choices[0]] : [e.choices[0], e.choices[1]];

  const leftChoice = e._renderChoices[0];
  const rightChoice = e._renderChoices[1];

  const totalCards = game.events.length;
  $("roundLabel").textContent = `Partida · ${game.index + 1} de ${totalCards}`;
  $("progressText").textContent = `Decisão ${game.index + 1} de ${totalCards}`;
  $("pillarTag").innerHTML = e.pillar
    .replace("Ambiental", SVG_ICONS.energy)
    .replace("Social", SVG_ICONS.workload)
    .replace("Governança", SVG_ICONS.privacy)
    .replace("Lucro", SVG_ICONS.investor);
  $("caseNumber").textContent = `CASO ${String(game.index + 1).padStart(2, "0")}`;
  $("symbol").innerHTML = SVG_ICONS[e.iconKey] || SVG_ICONS.warning;
  $("eventTitle").textContent = e.title;
  $("eventDescription").textContent = e.description;

  $("leftPreviewText").textContent = leftChoice.label;
  $("rightPreviewText").textContent = rightChoice.label;

  leftBtn.querySelector("span").textContent = leftChoice.label;
  rightBtn.querySelector("span").textContent = rightChoice.label;

  card.style.transition = "none";
  card.style.transform = "translateX(0) rotate(0)";
  card.style.opacity = "1";
  card.classList.remove("drag-left", "drag-right");
  requestAnimationFrame(() => card.style.transition = "");

  clearHighlights();
  updateUndoBtn();
}

function choose(side) {
  if (game.gameOver) return;

  const e = game.events[game.index];
  if (!e || !e._renderChoices) return;

  // Guarda o estado atual no histórico de snapshots para permitir desfazer
  game.snapshots.push(JSON.parse(JSON.stringify({
    values: game.values,
    passives: game.passives,
    totalPassiveProfitGained: game.totalPassiveProfitGained,
    events: game.events,
    index: game.index,
    history: game.history
  })));

  const c = side === "left" ? e._renderChoices[0] : e._renderChoices[1];

  let finalEffects = { ...c.effects };

  game.history.push({
    title: e.title,
    choice: c.label,
    explanation: c.explanation,
    lesson: e.lesson,
    effects: finalEffects,
    passive: c.passive
  });

  apply(finalEffects);

  if (c.passive) {
    for (const [k, v] of Object.entries(c.passive)) {
      game.passives[k] += v;
    }
  }

  applyPassives();

  // Insere desdobramento (followUp) imediatamente após a carta atual, caso exista
  if (c.followUp) {
    const insertAt = game.index + 1;
    game.events.splice(insertAt, 0, c.followUp);
  }

  const crisis = checkGameOver();
  if (crisis) {
    finishGame(true, crisis);
    return;
  }

  game.index++;
  if (game.index >= game.events.length) {
    finishGame(false);
  } else {
    renderEvent();
  }
}

function checkGameOver() {
  for (const [k, v] of Object.entries(game.values)) {
    if (v <= 0 && CRISIS_EVENTS[`${k}_min`]) {
      return CRISIS_EVENTS[`${k}_min`];
    }
  }
  return null;
}

function finishGame(isCrisis = false, crisisData = null) {
  game.gameOver = true;
  $("gameArea").classList.add("hidden");
  $("report").classList.remove("hidden");

  if (isCrisis && crisisData) {
    $("roundLabel").textContent = "Fim de Jogo · Crise";
    $("reportEyebrow").textContent = "CRISE DE GESTÃO";
    $("reportTitle").textContent = crisisData.title;
    $("reportIntro").textContent = crisisData.text;
  } else {
    $("roundLabel").textContent = "Partida Concluída";
    $("reportEyebrow").textContent = "RELATÓRIO DA EMPRESA";
    $("reportTitle").textContent = "Desempenho da Gestão";
    $("reportIntro").textContent = "Análise consolidada do impacto das suas decisões e do equilíbrio entre pilares.";
  }

  $("roiText").innerHTML = `As suas decisões acumularam <strong>+${game.totalPassiveProfitGained} pontos de lucro recorrente</strong>.<br><br>Um desempenho sólido em ESG exige equilibrar pilares concorrentes sem permitir que nenhum indicador chegue a zero.`;

  const bars = $("reportBars");
  bars.innerHTML = "";
  for (const [k, v] of Object.entries(game.values)) {
    const s = stateOf(v);
    const item = document.createElement("div");
    item.className = "report-item";
    item.innerHTML = `
      <div class="report-item-head">
        <span>${NAMES[k]}</span>
        <strong style="color:${s.color}">${s.label} (${v}%)</strong>
      </div>
      <div class="track"><div class="fill" style="width:${v}%;background:${s.color}"></div></div>
      <p>${INDICATOR_DESCRIPTIONS[k]}</p>
    `;
    bars.append(item);
  }

  const list = $("decisionSummary");
  list.innerHTML = "";
  game.history.forEach(h => {
    const item = document.createElement("div");
    item.className = "summary";
    const passiveStr = h.passive && h.passive.profit ? ` · 📈 Impacto Recorrente: +${h.passive.profit}/turno` : "";
    item.innerHTML = `
      <strong>${h.title} — <em>Escolha: ${h.choice}</em></strong>
      <p>${h.explanation}</p>
      <span class="lesson-tag">Lição: ${h.lesson}${passiveStr}</span>
    `;
    list.append(item);
  });

  const lessons = [...new Set(game.history.map(h => h.lesson))];
  $("learningText").textContent = isCrisis
    ? `A gestão colapsou por falta de equilíbrio num dos pilares. Lembre-se: ${lessons.slice(-2).join(" ")}`
    : lessons.join(" ");

  updateUndoBtn();
}

function highlightAffected(side) {
  clearHighlights();
  const e = game.events[game.index];
  if (!e || !e._renderChoices) return;

  const choice = side === "left" ? e._renderChoices[0] : e._renderChoices[1];
  const effects = choice.effects || {};
  const passives = choice.passive || {};

  const keys = new Set([...Object.keys(effects), ...Object.keys(passives)]);
  for (const k of keys) {
    if ((effects[k] && effects[k] !== 0) || (passives[k] && passives[k] !== 0)) {
      const el = document.querySelector(`[data-key="${k}"]`);
      if (el) el.classList.add("highlight");
    }
  }
}

function clearHighlights() {
  document.querySelectorAll(".indicator").forEach(el => el.classList.remove("highlight"));
}

function endDrag(commit) {
  if (!dragging) return;
  dragging = false;
  const side = dragX < -95 ? "left" : dragX > 95 ? "right" : null;
  card.classList.remove("drag-left", "drag-right");
  clearHighlights();

  if (commit && side) {
    choose(side);
  } else {
    card.style.transform = "translateX(0) rotate(0)";
    card.style.opacity = "1";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  card = $("decisionCard");
  leftBtn = $("leftButton");
  rightBtn = $("rightButton");

  card.addEventListener("pointerdown", e => {
    if (e.target.closest(".choice")) return;
    if (game.gameOver || $("gameArea").classList.contains("hidden")) return;
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    dragX = 0;
    card.setPointerCapture(e.pointerId);
    card.style.transition = "none";
  });

  card.addEventListener("pointermove", e => {
    if (!dragging) return;
    dragX = e.clientX - startX;
    const dy = e.clientY - startY;

    if (Math.abs(dy) > Math.abs(dragX) * 1.2 && Math.abs(dragX) < 35) return;

    card.style.transform = `translateX(${dragX}px) rotate(${dragX * .035}deg)`;

    const isLeft = dragX < -25;
    const isRight = dragX > 25;

    card.classList.toggle("drag-left", isLeft);
    card.classList.toggle("drag-right", isRight);

    if (isLeft) highlightAffected("left");
    else if (isRight) highlightAffected("right");
    else clearHighlights();
  });

  card.addEventListener("pointerup", () => { card.style.transition = ""; endDrag(true); });
  card.addEventListener("pointercancel", () => { card.style.transition = ""; endDrag(false); });

  card.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft") choose("left");
    if (e.key === "ArrowRight") choose("right");
  });

  const bindChoiceBtn = (btn, side) => {
    if (!btn) return;
    btn.addEventListener("mouseenter", () => highlightAffected(side));
    btn.addEventListener("mouseleave", clearHighlights);
    btn.addEventListener("pointerdown", e => e.stopPropagation());
    btn.addEventListener("click", e => {
      e.stopPropagation();
      choose(side);
    });
  };

  bindChoiceBtn(leftBtn, "left");
  bindChoiceBtn(rightBtn, "right");

  $("restartButton").addEventListener("click", newGame);

  const undoBtn = $("undoButton");
  if (undoBtn) {
    undoBtn.addEventListener("pointerdown", e => e.stopPropagation());
    undoBtn.addEventListener("click", e => {
      e.stopPropagation();
      undo();
    });
  }

  const reloadPage = e => {
    if (e) e.stopPropagation();
    window.location.reload();
  };

  const brandLogo = $("brandLogo");
  if (brandLogo) {
    brandLogo.addEventListener("click", reloadPage);
  }

  newGame();
});