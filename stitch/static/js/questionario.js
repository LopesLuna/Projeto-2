// SVG Icons
const SVG_ICONS = {
  supplier: `<svg viewBox="0 0 24 24"><path d="M16 16l3-8 3 8H16z"/><path d="M2 16l3-8 3 8H2z"/><path d="M7 21h10"/><path d="M12 3v18"/></svg>`,
  workload: `<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  waste: `<svg viewBox="0 0 24 24"><path d="M7 19a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7z"/><path d="M12 9v6"/><path d="M9 12h6"/></svg>`,
  investor: `<svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  privacy: `<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  diversity: `<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/></svg>`,
  energy: `<svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 10 12 10 13 2"/></svg>`,
  warning: `<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
};
// ============================================================
// Constantes, perfil e perguntas do diagnóstico ESG
// ============================================================

const VERSAO=1; // aumente quando mudar perguntas ou faixas
const NAMES={ambiente:"Meio ambiente",social:"Social",governanca:"Governança",lucro:"Lucro"};
const DESC={ambiente:"Ecoeficiência, redução de pegada e capital natural.",social:"Produtividade, retenção, clima e direitos humanos.",governanca:"Conformidade, transparência e controle de riscos.",lucro:"Saúde financeira e capacidade de investimento."};
const STATES=[{max:24,label:"Crítico",color:"#c6534d"},{max:44,label:"Preocupante",color:"#d28a42"},{max:74,label:"Estável",color:"#497eb0"},{max:100,label:"Excelente",color:"#3b785b"}];

// Construtores de pergunta
const N=(c,p,tm,t,u,f,o={})=>({c,p,tm,t,k:"n",u,f,peso:1,...o});
const E=(c,p,tm,t,op,aj="",peso=1)=>({c,p,tm,t,k:"e",op,aj,peso});
const SN=(c,p,tm,t,aj)=>E(c,p,tm,t,[["Sim",100],["Não",0]],aj);

// Perfil da empresa
const PERFIL=[
{c:"empresa",k:"t",t:"Qual é o nome da empresa?"},
{c:"ano",k:"n",u:"ano",t:"Qual o ano de referência dos dados?",aj:"Responda tudo com dados deste mesmo ano (ex.: 2025). Isso permite comparar períodos depois."},
{c:"setor",k:"c",t:"Qual o setor principal?",op:["Confecção Têxtil","Indústria Têxtil","Moda Feminina","Moda Masculina","Moda Infantil","Moda Plus Size","Outro"].map(x=>[x,null])},
{c:"funcionarios",k:"n",u:"pessoas",t:"Qual o número médio de funcionários no ano?",aj:"Usado para ajustar as faixas de consumo e de resíduos ao tamanho da empresa."},
{c:"faturamento",k:"n",u:"R$ mil",t:"Qual o faturamento bruto mensal (de 1 em 1 mês)?",aj:"Em milhares reais. Ex.: R$ 2,5 mil = 2,5"}];

// Perguntas por pilar
const Q=[
// --- Meio ambiente ---
N("agua_consumo","ambiente","Água","Quanto a empresa consumiu de água no ano (todas as unidades)?","m³/ano",[[15,100],[40,75],[100,45],[null,15]],{por:"funcionarios",aj:"Some as contas de água e a captação própria (poço). 1 m³ = 1.000 litros."}),
N("agua_reuso","ambiente","Água","Que percentual da água usada vem de reuso, captação de chuva ou reaproveitamento?","%",[[0,0],[10,30],[30,60],[null,100]]),
N("energia_consumo","ambiente","Energia","Qual foi o consumo total de energia elétrica no ano?","kWh/ano",[[2000,100],[5000,75],[15000,45],[null,15]],{por:"funcionarios",aj:"Some as faturas de energia de todas as unidades."}),
N("energia_renovavel","ambiente","Energia","Que percentual da energia consumida vem de fontes renováveis (solar própria, mercado livre incentivado etc.)?","%",[[0,0],[20,35],[50,65],[null,100]]),
E("emissoes_inventario","ambiente","Emissões","A empresa mede suas emissões de gases de efeito estufa?",[["Não medimos",0],["Fazemos apenas estimativas simples",30],["Inventário dos escopos 1 e 2",70],["Inventário dos escopos 1, 2 e 3 com verificação externa",100]],"Escopo 1: queima direta (frota, caldeiras). Escopo 2: energia comprada. Escopo 3: cadeia de valor (fornecedores, transporte)."),
N("emissoes_total","ambiente","Emissões","Qual o total de emissões do último inventário?","tCO₂e/ano",[[10,100],[50,75],[200,45],[null,15]],{por:"faturamento",ns:1,aj:"Se a empresa não tem inventário, marque Não sei."}),
N("residuos_gerados","ambiente","Resíduos","Quantos resíduos a empresa gerou no ano (todos os tipos)?","toneladas/ano",[[0.1,100],[0.5,75],[2,45],[null,15]],{por:"funcionarios"}),
N("residuos_reciclados","ambiente","Resíduos","Que percentual dos resíduos foi reciclado, compostado ou reaproveitado?","%",[[10,15],[30,40],[60,70],[null,100]]),
E("residuos_perigosos","ambiente","Resíduos","Os resíduos perigosos (óleos, químicos, baterias, lâmpadas) vão para empresas licenciadas, com comprovante de destinação?",[["Sim, sempre",100],["Às vezes",40],["Não",0],["Não geramos resíduos perigosos",null]],"",2),
E("licenca_ambiental","ambiente","Conformidade","Qual a situação das licenças e autorizações ambientais exigidas?",[["Todas em dia",100],["Em renovação ou com pendências menores",50],["Há licenças vencidas ou ausentes",0],["Não se aplica à nossa atividade",null]],"",2),
N("multas_ambientais","ambiente","Conformidade","Quantas multas ou autuações ambientais a empresa recebeu nos últimos 3 anos?","nº",[[0,100],[1,50],[null,0]],{peso:2}),
N("fornecedores_ambiental","ambiente","Cadeia de fornecedores","Que percentual dos fornecedores críticos é avaliado com critérios ambientais?","%",[[0,0],[25,35],[60,70],[null,100]]),
SN("metas_ambientais","ambiente","Gestão","Existem metas formais, com prazo, para reduzir consumo de água, energia ou emissões?"),

// --- Social ---
N("rotatividade","social","Pessoas","Qual foi a taxa de rotatividade (turnover) de funcionários no ano?","%",[[5,100],[10,80],[20,50],[null,15]],{aj:"Desligamentos ÷ média de funcionários × 100."}),
N("absenteismo","social","Pessoas","Qual foi a taxa de absenteísmo (faltas e afastamentos) no ano?","%",[[2,100],[4,70],[8,40],[null,10]]),
N("acidentes","social","Saúde e segurança","Quantos acidentes de trabalho com afastamento ocorreram no ano?","nº",[[0,100],[1,70],[3,40],[null,10]],{por:"funcionarios",esc:100,peso:2}),
N("treinamento","social","Desenvolvimento","Qual a média de horas de treinamento por funcionário no ano?","horas",[[4,15],[12,45],[30,75],[null,100]]),
N("mulheres_lideranca","social","Diversidade","Qual o percentual de mulheres em cargos de liderança (coordenação ou acima)?","%",[[10,20],[25,50],[40,80],[null,100]]),
N("pcd","social","Diversidade","Qual o percentual de pessoas com deficiência no quadro?","%",[[0,0],[1.9,40],[null,100]],{aj:"A Lei de Cotas (Lei 8.213/91) exige de 2% a 5% para empresas com 100 ou mais empregados."}),
N("equidade_salarial","social","Diversidade","O salário médio das mulheres equivale a quantos % do salário médio dos homens na mesma função?","%",[[80,20],[90,50],[95,80],[null,100]]),
E("clima","social","Pessoas","A empresa faz pesquisa de clima organizacional?",[["Nunca fizemos",0],["Fazemos esporadicamente",40],["Anualmente, com plano de ação",100]]),
N("beneficios","social","Pessoas","Que percentual dos funcionários tem acesso a benefícios (saúde, alimentação, transporte)?","%",[[50,20],[80,55],[99,80],[null,100]]),
N("investimento_social","social","Comunidade","Quanto a empresa investiu em projetos sociais e na comunidade, em relação ao faturamento?","% do faturamento",[[0,0],[0.1,40],[0.5,70],[null,100]]),
E("direitos_humanos_cadeia","social","Cadeia de fornecedores","Os fornecedores são verificados contra trabalho infantil e trabalho análogo ao escravo?",[["Não verificamos",0],["Há cláusula contratual, sem verificação",40],["Cláusula contratual e verificação periódica",100]],"",2),

// --- Governança ---
E("codigo_conduta","governanca","Ética","A empresa tem código de conduta?",[["Não temos",0],["Existe, mas não é divulgado nem treinado",40],["Divulgado e com treinamento anual",100]]),
E("canal_denuncia","governanca","Ética","A empresa tem canal de denúncias?",[["Não temos",0],["Canal interno simples (e-mail, caixa de sugestões)",50],["Canal independente e anônimo, com apuração dos casos",100]],"",2),
E("estrutura_decisao","governanca","Estrutura","Como são tomadas as decisões estratégicas?",[["Concentradas no dono ou em poucos sócios",10],["Há conselho consultivo",60],["Há conselho com membros independentes",100]]),
SN("auditoria_externa","governanca","Transparência","As demonstrações financeiras são auditadas por auditoria externa?"),
E("lgpd","governanca","Dados e privacidade","Qual a situação da adequação à LGPD (proteção de dados)?",[["Não iniciada",0],["Em andamento",50],["Encarregado (DPO) nomeado e políticas em vigor",100]]),
E("anticorrupcao","governanca","Integridade","A empresa tem política anticorrupção e avalia terceiros?",[["Não temos",0],["Temos política, sem avaliação de terceiros",50],["Política e avaliação de terceiros",100]],"Relacionada à Lei Anticorrupção (Lei 12.846/2013)."),
E("gestao_riscos","governanca","Riscos","Como a empresa gerencia seus riscos (financeiros, legais, ambientais, de reputação)?",[["Não há gestão estruturada",0],["De forma informal",40],["Matriz de riscos formal, revisada todo ano",100]]),
E("relatorio_sustentabilidade","governanca","Transparência","A empresa divulga um relatório de sustentabilidade?",[["Não divulgamos",0],["Apenas uso interno",40],["Divulgamos seguindo padrão reconhecido (GRI, SASB, IFRS S1/S2)",100]]),
N("processos_trabalhistas","governanca","Conformidade","Quantos processos trabalhistas novos a empresa recebeu no ano?","nº",[[1,100],[5,70],[15,40],[null,10]],{por:"funcionarios",esc:100}),
N("treinamento_compliance","governanca","Integridade","Que percentual dos funcionários foi treinado em ética e compliance no ano?","%",[[0,0],[30,35],[70,70],[null,100]]),
N("fornecedores_compliance","governanca","Cadeia de fornecedores","Que percentual dos fornecedores críticos passa por avaliação de integridade (compliance) antes da contratação?","%",[[0,0],[25,35],[60,70],[null,100]]),

// --- Lucro ---
N("margem_liquida","lucro","Resultado","Qual foi a margem líquida da empresa no ano?","%",[[0,10],[5,45],[10,70],[null,100]],{aj:"Lucro líquido ÷ receita líquida × 100. Prejuízo = valor negativo."}),
N("crescimento_receita","lucro","Resultado","Qual foi o crescimento da receita em relação ao ano anterior?","%",[[0,20],[3,50],[10,80],[null,100]]),
N("liquidez_corrente","lucro","Solidez","Qual a liquidez corrente da empresa?","índice",[[0.8,10],[1.0,40],[1.5,75],[null,100]],{aj:"Ativo circulante ÷ passivo circulante."}),
N("divida_ebitda","lucro","Solidez","Qual a relação entre dívida líquida e EBITDA?","vezes",[[1,100],[2.5,75],[4,40],[null,10]],{aj:"Se a empresa tem mais caixa que dívida, informe 0."}),
N("investimento_esg","lucro","Retorno ESG","Quanto a empresa investiu em iniciativas ESG, em relação ao faturamento?","% do faturamento",[[0,0],[0.5,40],[2,75],[null,100]]),
N("receita_sustentavel","lucro","Retorno ESG","Que percentual da receita vem de produtos ou serviços com atributo sustentável?","%",[[0,10],[10,40],[30,70],[null,100]]),
N("economia_eficiencia","lucro","Retorno ESG","Quanto a empresa economizou no ano com eficiência (água, energia, resíduos), em relação ao faturamento?","% do faturamento",[[0,0],[0.2,40],[1,75],[null,100]])
];

// Lista completa de etapas (perfil + perguntas)
const S=[...PERFIL,...Q], NP=PERFIL.length;

// Utilitários e estado
// ------------------------------------------------------------
const $=id=>document.getElementById(id);
const fmt=n=>n.toLocaleString("pt-BR",{maximumFractionDigits:2});
const stateOf=v=>STATES.find(s=>v<=s.max)||STATES[3];
let ans=[],i=0;
const prof=()=>({funcionarios:ans[3],faturamento:ans[4]});
 
// ------------------------------------------------------------
// Faixas de resposta (ajustadas ao porte da empresa)
// ------------------------------------------------------------
function opts(q){
  if(q.k!=="n")return q.op;
  const P=prof(),m=q.por?P[q.por]/(q.esc||1):1,nat=q.u==="nº";
  const u2=q.u.startsWith("%")?q.u:nat?"":" "+q.u,f=n=>fmt(n)+u2,r=[];
  let prev=null;
  q.f.forEach(([t,s])=>{
    if(t===null){r.push(["Mais de "+(nat?prev:f(prev)),s]);return}
    let b=t*m;b=nat?Math.floor(b+1e-9):b>=10?Math.round(b):Math.round(b*100)/100;
    let l;
    if(prev===null)l=b===0?(nat?"Nenhum (0)":"Até 0"+u2):"Até "+(nat?b:f(b));
    else if(nat){const lo=prev+1;if(b<lo)return;l=lo===b?""+b:lo+" a "+b}
    else l="Mais de "+f(prev)+" até "+f(b);
    r.push([l,s]);prev=b;
  });
  if(q.ns)r.push(["Não sei",null]);
  return r;
}
 
// ------------------------------------------------------------
// Tela de pergunta
// ------------------------------------------------------------
function show(){
  const q=S[i],P=prof();
  $("count").textContent=`Etapa ${i+1} de ${S.length}`;
  $("pct").textContent=Math.round(i/S.length*100)+"% concluído";
  $("fill").style.width=(i/S.length*100)+"%";
  $("pillar").textContent=q.p?`${NAMES[q.p]}: ${q.tm}`:"Perfil da empresa";
  $("qtext").textContent=q.t;
  const adj=q.por?` Faixas ajustadas para ${fmt(P[q.por])} ${q.por==="funcionarios"?"funcionários":"milhões de reais de faturamento"}.`:"";
  $("qhint").textContent=((q.aj||"")+adj).trim();
  const box=$("input");box.innerHTML="";
  const ok=()=>{const v=ans[i];$("next").disabled=v===undefined||(q.k==="t"?!String(v).trim():q.k==="n"&&!q.p?(isNaN(v)||(i>=3&&v<=0)):false)};
  if(q.p||q.k==="c"){
    opts(q).forEach((o,k)=>{
      const b=document.createElement("button");
      b.className="opt";b.textContent=o[0];
      b.setAttribute("aria-pressed",ans[i]===k);
      b.onclick=()=>{ans[i]=k;show()};
      box.append(b);
    });
  }else{
    const w=document.createElement("div");w.className="num";
    const inp=document.createElement("input");
    inp.type=q.k==="t"?"text":"number";inp.step="any";inp.setAttribute("aria-label",q.t);
    if(q.k==="t")inp.style.width="100%";
    if(ans[i]!==undefined)inp.value=ans[i];
    inp.oninput=()=>{ans[i]=q.k==="t"?inp.value:inp.value===""?undefined:parseFloat(inp.value);if(i===3||i===4)ans.length=5;ok()};
    w.append(inp);
    if(q.u){const u=document.createElement("span");u.className="unit";u.textContent=q.u;w.append(u)}
    box.append(w);
  }
  $("back").disabled=i===0;
  $("next").textContent=i===S.length-1?"Ver resultado":"Próxima";
  ok();
}
 
// ------------------------------------------------------------
// Relatório final
// ------------------------------------------------------------
function finish(){
  $("quiz").classList.add("hidden");$("report").classList.remove("hidden");
  const sum={},w={},items=[];
  Q.forEach((q,k)=>{
    const o=opts(q)[ans[NP+k]],s=o[1];
    if(s===null)return;
    sum[q.p]=(sum[q.p]||0)+s*q.peso;w[q.p]=(w[q.p]||0)+q.peso;
    items.push({q,s,a:o[0]});
  });
  const res={};for(const p in NAMES)res[p]=w[p]?Math.round(sum[p]/w[p]):0;
  $("rtitle").textContent="Diagnóstico ESG: "+ans[0];
  $("rintro").textContent=`Ano de referência ${ans[1]}. Questionário versão ${VERSAO}. `+(Math.min(...Object.values(res))<=24?"Há pelo menos um pilar em situação crítica e ele deve ser a prioridade da gestão.":"Veja como cada pilar se saiu e onde há mais espaço para melhorar.");
  const bars=$("rbars");bars.innerHTML="";
  for(const p in NAMES){
    const v=res[p],s=stateOf(v),d=document.createElement("div");d.className="ri";
    d.innerHTML=`<div class="rh"><span>${NAMES[p]}</span><span style="color:${s.color}">${s.label} (${v}%)</span></div><div class="bar" style="height:8px"><i style="width:${v}%;background:${s.color}"></i></div><p class="tip">${DESC[p]}</p>`;
    bars.append(d);
  }
  const tips=$("tips");tips.innerHTML="";
  const weak=items.filter(x=>x.s<=45).sort((a,b)=>a.s-b.s||b.q.peso-a.q.peso);
  if(!weak.length)tips.innerHTML='<p class="tip">Nenhuma resposta ficou em nível de atenção. Continue acompanhando os indicadores todo ano.</p>';
  weak.forEach(x=>{
    const d=document.createElement("div");d.className="ri";
    d.innerHTML=`<div class="rh"><span>${NAMES[x.q.p]}: ${x.q.tm}</span><span>${x.s}/100</span></div><p style="margin:0">${x.q.t}</p><p class="tip">Sua resposta: ${x.a}</p>`;
    tips.append(d);
  });
}
 
// ------------------------------------------------------------
// Navegação e inicialização
// ------------------------------------------------------------
$("next").onclick=()=>{if(i<S.length-1){i++;show()}else finish()};
$("back").onclick=()=>{if(i>0){i--;show()}};
$("restart").onclick=()=>{ans=[];i=0;$("report").classList.add("hidden");$("quiz").classList.remove("hidden");show()};
show();
 
