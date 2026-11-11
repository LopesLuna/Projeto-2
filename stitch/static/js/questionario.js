// ============================================================
// Diagnóstico ESG para micro e pequenas empresas (têxtil e moda)
// Tudo roda no navegador: perguntas, pontuação, relatório e PDF.
// Não carregue o script.js do jogo na mesma página (nomes repetidos).
// O gráfico dos pilares fica em outro arquivo, o grafico-esg.js, que deve ser
// carregado DEPOIS deste no template (veja a chamada no fim do finish()).
// ============================================================

const VERSAO=2; // aumente quando mudar perguntas ou faixas (o comparador avisa sobre versões diferentes)
const NAMES={ambiente:"Meio ambiente",social:"Social",governanca:"Governança",lucro:"Lucro"};
const DESC={ambiente:"Ecoeficiência, redução de pegada e capital natural.",social:"Produtividade, retenção, clima e direitos humanos.",governanca:"Conformidade, transparência e controle de riscos.",lucro:"Saúde financeira e capacidade de investimento."};
const STATES=[{max:24,label:"Crítico",color:"#c6534d",tone:"critical"},{max:44,label:"Preocupante",color:"#d28a42",tone:"warning"},{max:74,label:"Estável",color:"#3b785b",tone:"good"},{max:100,label:"Excelente",color:"#3b785b",tone:"good"}];

// Construtores de pergunta
const N=(c,p,tm,t,u,f,o={})=>({c,p,tm,t,k:"n",u,f,peso:1,...o});
const E=(c,p,tm,t,op,aj="",peso=1)=>({c,p,tm,t,k:"e",op,aj,peso});

// Perfil da empresa (não mude a ORDEM: o código usa as posições 3 e 4)
const PERFIL=[
{c:"empresa",k:"t",t:"Qual é o nome da empresa?"},
{c:"ano",k:"n",u:"ano",t:"Qual o ano de referência dos dados?",aj:"Responda tudo com dados deste mesmo ano (ex.: 2025). Isso permite comparar períodos depois."},
{c:"setor",k:"c",t:"Qual o setor principal?",op:["Confecção Têxtil","Indústria Têxtil","Moda Feminina","Moda Masculina","Moda Infantil","Moda Plus Size","Facção ou ateliê de costura","Lavanderia, tinturaria ou estamparia","Outro"].map(x=>[x,null])},
{c:"funcionarios",k:"n",u:"pessoas",t:"Quantas pessoas trabalham na empresa, contando você e quem recebe por produção?",aj:"Média do ano. Usado para ajustar as faixas ao tamanho da empresa."},
{c:"faturamento",k:"n",u:"R$ mil",t:"Qual o faturamento bruto médio por mês?",aj:"Em milhares de reais. Ex.: R$ 25 mil = 25; R$ 6.500 = 6,5."}];

// Perguntas por pilar
// ATENÇÃO: as faixas numéricas são pontos de partida; calibre com referências do setor.
const Q=[
// --- Meio ambiente (8) ---
N("agua_consumo","ambiente","Água","Quanto a empresa consumiu de água no ano?","m³/ano",[[15,100],[40,75],[100,45],[null,15]],{por:"funcionarios",ns:1,aj:"Some os 12 meses da conta de água (o consumo vem em m³). 1 m³ = 1.000 litros."}),
N("energia_consumo","ambiente","Energia","Quanto a empresa consumiu de energia elétrica no ano?","kWh/ano",[[2000,100],[5000,75],[15000,45],[null,15]],{por:"funcionarios",ns:1,aj:"Some os 12 meses da conta de luz (consumo em kWh)."}),
E("energia_renovavel","ambiente","Energia","Parte da energia vem de fontes renováveis (painel solar, energia por assinatura, geração compartilhada)?",[["Não",0],["Estamos estudando, mas ainda não",20],["Sim, uma parte",65],["Sim, a maior parte ou toda",100]]),
E("sobras_tecido","ambiente","Resíduos","O que a empresa faz com as sobras e retalhos de tecido?",[["Vão para o lixo comum",0],["Às vezes vendemos ou doamos",40],["Reaproveitamos na produção ou enviamos para reciclagem, cooperativas ou doação, com regularidade",100]],"Retalhos são um dos maiores resíduos da moda. Reaproveitar também reduz custo."),
E("residuos_perigosos","ambiente","Resíduos","Tintas, produtos químicos, óleo de máquina, lâmpadas e pilhas têm destino correto (coleta especializada ou devolução ao fornecedor)?",[["Sim, sempre",100],["Às vezes",40],["Não, vão para o lixo comum",0],["Não usamos esses produtos",null]],"",2),
E("efluentes","ambiente","Água","Se a empresa lava, tinge ou estampa, a água usada recebe tratamento antes de ser descartada?",[["Sim, com tratamento e autorização",100],["Só em parte",40],["Não há tratamento",0],["Não fazemos esses processos",null]],"",2),
E("licencas","ambiente","Conformidade","A empresa tem as licenças para funcionar (alvará, vistoria dos bombeiros e licença ambiental, quando exigida)?",[["Todas em dia",100],["Algumas vencidas ou em regularização",40],["Não temos",0]],"",2),
E("materiais","ambiente","Materiais","Que parte dos materiais comprados (tecidos, aviamentos, embalagens) é reciclada, certificada ou de origem sustentável?",[["Nenhuma",0],["Poucos itens",35],["Cerca de metade",70],["A maior parte",100]]),

// --- Social (9) ---
E("formalizacao","social","Trabalho","Como está o registro das pessoas que trabalham na empresa?",[["Todas com carteira assinada ou contrato formal",100],["A maioria é formal, mas há pessoas sem registro",45],["A maioria não tem registro",0]],"Considere também quem trabalha por produção.",2),
E("faccoes","social","Cadeia de fornecedores","As oficinas de costura e outros terceirizados (facções) são formalizados e a empresa acompanha as condições de trabalho?",[["Não sabemos como trabalham",0],["Só contratamos quem tem CNPJ, sem acompanhar as condições",40],["Contratamos formalizados e acompanhamos as condições",100],["Não terceirizamos",null]],"Quem contrata oficinas pode responder por irregularidades nelas, inclusive trabalho em condições análogas à escravidão.",2),
N("rotatividade","social","Pessoas","Qual foi a taxa de rotatividade (saída de funcionários) no ano?","%",[[5,100],[10,80],[20,50],[null,15]],{ns:1,aj:"Pessoas que saíram ÷ média de funcionários × 100."}),
N("acidentes","social","Saúde e segurança","Quantos acidentes de trabalho com afastamento ocorreram no ano?","nº",[[0,100],[1,70],[3,40],[null,10]],{por:"funcionarios",esc:100,peso:2}),
E("condicoes_trabalho","social","Saúde e segurança","As condições de trabalho seguem a lei: jornada e horas extras controladas e pagas, pausas, EPIs e postos de trabalho adequados (ergonomia)?",[["Não",0],["Em parte",50],["Sim",100]],"Costura exige muito esforço repetitivo. Cadeira, bancada e pausas fazem diferença na saúde da equipe.",2),
E("treinamento","social","Desenvolvimento","A equipe recebe treinamento (segurança, qualidade, novas técnicas)?",[["Nunca",0],["Só quando a pessoa entra",40],["Periodicamente",100]]),
E("equidade_salarial","social","Diversidade","Homens e mulheres na mesma função recebem o mesmo?",[["Há diferença e não corrigimos",0],["Nunca comparamos",30],["Comparamos e são equivalentes, ou corrigimos as diferenças",100]]),
E("clima","social","Pessoas","A empresa ouve a equipe (conversas, reuniões, pesquisa) e age sobre o que ouve?",[["Raramente",0],["Conversas informais",40],["Reuniões ou pesquisas periódicas, com ações",100]]),
E("comunidade","social","Comunidade","A empresa apoia a comunidade (doações, ações sociais, compra de produtores e associações locais)?",[["Não",0],["De vez em quando",50],["Com regularidade",100]]),

// --- Governança (8) ---
E("formalizacao_empresa","governanca","Conformidade","A empresa está em dia com impostos e obrigações trabalhistas (FGTS, INSS, DAS)?",[["Sim, tudo em dia",100],["Há pendências, mas parceladas ou em regularização",50],["Há pendências sem regularização",0]],"",2),
E("contabilidade","governanca","Controle","Como é o controle financeiro e a contabilidade?",[["Sem controle formal",0],["Planilha ou caderno próprio",40],["Contador e demonstrativos todo mês",100]]),
E("separacao_contas","governanca","Controle","As contas pessoais e as da empresa são separadas (conta bancária, cartão, despesas)?",[["Não",0],["Em parte",40],["Sim",100]],"Misturar as contas dificulta saber se o negócio realmente dá lucro."),
E("codigo_conduta","governanca","Ética","Existem regras claras de conduta combinadas com a equipe (respeito, assédio, discriminação, presentes de fornecedores)?",[["Não",0],["Combinadas apenas de forma verbal",40],["Escritas e conhecidas por toda a equipe",100]]),
E("canal_denuncia","governanca","Ética","A equipe tem como relatar problemas (assédio, irregularidades) com segurança?",[["Não",0],["Só conversando direto com o dono ou gestor",40],["Existe um canal reservado (caixa, e-mail ou WhatsApp dedicado) e há retorno",100]],"",2),
E("lgpd","governanca","Dados","A empresa cuida dos dados pessoais de clientes e funcionários (cadastros, fotos, documentos)?",[["Ainda não pensamos nisso",0],["Cuidados básicos (senhas, acesso restrito)",50],["Há regras simples, aviso aos titulares e canal para pedidos",100]],"Para pequenas empresas as exigências da LGPD são simplificadas, mas o cuidado com os dados continua valendo."),
E("compras_formais","governanca","Fornecedores","Os fornecedores são formalizados e conferidos (CNPJ, nota fiscal, contrato ou pedido por escrito)?",[["Compramos de forma informal",0],["Parte é formalizada",50],["Todos são formalizados e conferidos",100]]),
E("gestao_riscos","governanca","Riscos","A empresa tem seguro ou plano para imprevistos (incêndio, perda de máquinas, fornecedor que falha)?",[["Não",0],["Temos algum cuidado, sem plano formal",50],["Seguro e/ou plano de contingência",100]]),

// --- Lucro (7) ---
N("margem_liquida","lucro","Resultado","Qual foi a margem líquida da empresa no ano?","%",[[0,10],[5,45],[10,70],[null,100]],{ns:1,aj:"Quanto sobrou depois de todas as despesas ÷ quanto vendeu × 100. Prejuízo = valor negativo."}),
N("crescimento_receita","lucro","Resultado","Quanto as vendas cresceram em relação ao ano anterior?","%",[[0,20],[3,50],[10,80],[null,100]],{ns:1,aj:"Se as vendas caíram, use valor negativo."}),
E("fluxo_caixa","lucro","Solidez","O dinheiro que entra costuma cobrir as despesas do mês?",[["Quase sempre falta",0],["Falta em alguns meses",40],["Cobre e costuma sobrar",100]]),
N("endividamento","lucro","Solidez","As parcelas mensais de dívidas (empréstimos, parcelamentos) representam quanto do faturamento do mês?","%",[[10,100],[20,70],[35,40],[null,10]],{ns:1}),
E("reserva_caixa","lucro","Solidez","A empresa tem reserva de caixa para quantos meses de despesas fixas?",[["Nenhuma",0],["Até 1 mês",35],["De 2 a 3 meses",70],["Mais de 3 meses",100]]),
N("investimento_esg","lucro","Retorno ESG","Quanto a empresa investiu em melhorias ESG (reuso de água, eficiência, segurança, ações sociais) em relação ao faturamento?","% do faturamento",[[0,0],[0.5,40],[2,75],[null,100]],{ns:1}),
E("economia_eficiencia","lucro","Retorno ESG","A empresa já economizou com ações como reduzir desperdício de tecido, água ou energia?",[["Nunca medimos",0],["Percebemos economia, mas sem medir",40],["Medimos a economia",100]])
];

// ------------------------------------------------------------
// Sugestões de melhoria: até 4 textos por pergunta, um para cada nível do relatório
//   [0] Crítico       (nota até 24)    -> começar do zero / corrigir
//   [1] Preocupante   (nota de 25 a 44) -> já existe algo, falta completar
//   [2] Estável       (nota de 45 a 74) -> evoluir, formalizar, medir
//   [3] Excelente     (nota de 75 ou mais) -> manter e ir além (ponto forte)
// null = nenhuma resposta da pergunta cai nesse nível (usa o texto mais próximo)
// Revise os textos com alguém do setor antes de publicar.
// ------------------------------------------------------------
const SUG={
agua_consumo:[
"Faça o levantamento mensal da conta de água e procure vazamentos (torneiras, caixas, descargas). Instale arejadores e redutores de vazão e treine a equipe para evitar desperdício. Se a empresa lava ou tinge peças, avalie o reuso da água de enxágue.",
null,
"O consumo está em nível razoável. Defina uma meta de redução (um pouco a cada ano) e acompanhe a conta todo mês para perceber qualquer aumento fora do normal. Avalie o reuso da água em lavagens e limpeza.",
"O consumo está baixo para o seu porte. Mantenha o acompanhamento mensal, registre o que funciona (manutenção, reaproveitamento) e use essa economia na comunicação com clientes."],
energia_consumo:[
"Troque lâmpadas por LED, desligue máquinas e equipamentos fora do uso e faça manutenção periódica nas máquinas de costura e nos compressores. Aproveite a luz natural no galpão e confira se o contrato de energia está adequado ao seu consumo.",
null,
"Já há um controle razoável. Faça um mapa dos equipamentos que mais gastam (compressores, ferros, ar-condicionado) e programe horários de uso e de manutenção para reduzir o consumo sem perder produtividade.",
"O consumo está baixo para o seu porte. Mantenha a rotina de desligar e fazer manutenção e use o histórico das contas para comprovar a eficiência a clientes e parceiros."],
energia_renovavel:[
"Peça orçamento de energia solar própria ou de assinatura de energia (geração compartilhada) e compare o valor da parcela ou da assinatura com a economia na conta de luz.",
null,
"Parte da energia já vem de fontes renováveis. Avalie ampliar essa parcela (mais placas ou uma assinatura maior) e compare o retorno com a conta de luz atual.",
"A energia já é, em sua maior parte, renovável. Guarde os comprovantes (contratos e faturas) e mostre isso aos clientes e nas redes da empresa."],
sobras_tecido:[
"Separe os retalhos por tipo de tecido e tamanho. Use as sobras em peças pequenas, acessórios ou enchimento, venda ou doe para ateliês, cooperativas e artesãos e envie o restante para reciclagem têxtil. Revise o encaixe dos moldes para reduzir a sobra já na origem.",
"Já há algum reaproveitamento. Torne a rotina regular: defina um local para separar os retalhos, uma pessoa responsável e uma parceria fixa (cooperativa, ateliê ou reciclagem) para que nada volte ao lixo comum.",
null,
"Os retalhos já têm bom destino. Meça quanto é reaproveitado (por mês, em quilos) e, se possível, transforme isso em produto ou em história para os clientes."],
residuos_perigosos:[
"Guarde tintas, produtos químicos, óleos, lâmpadas e pilhas separados, em recipientes fechados e identificados. Combine a devolução com o fornecedor ou contrate uma coleta especializada licenciada e guarde o comprovante de destinação.",
"O descarte está quase correto. Padronize o processo: um local fixo para guardar, uma pessoa responsável e o comprovante de destinação arquivado a cada retirada.",
null,
"Os resíduos perigosos têm destino correto. Mantenha os comprovantes organizados e confira de tempos em tempos se a empresa coletora continua licenciada."],
efluentes:[
"A água do processo que sai com tinta, corante ou produto químico não deve ir direto para a rede ou para o solo. Consulte o órgão ambiental do seu município ou estado e avalie um sistema de tratamento ou a contratação de uma empresa especializada.",
"O tratamento é parcial. Identifique qual etapa do processo ainda gera efluente sem tratamento e peça orientação ao órgão ambiental ou a uma empresa especializada para completar o sistema.",
null,
"A água é tratada com autorização. Faça análises periódicas da água descartada, guarde os laudos e mantenha a autorização em dia."],
licencas:[
"Liste todas as licenças e alvarás exigidos (prefeitura, bombeiros e ambiental, quando for o caso) com a data de vencimento e crie um lembrete com 60 dias de antecedência. Procure o Sebrae ou um contador para regularizar o que estiver pendente.",
"Falta pouco para estar totalmente em dia. Regularize as licenças em renovação ou com pendência e centralize as datas de vencimento em uma única planilha, com lembretes.",
null,
"As licenças estão em dia. Continue controlando os vencimentos e confira se mudanças na empresa (ampliação, novas máquinas, novo endereço) exigem atualizar alguma licença."],
materiais:[
"Comece trocando um item por vez (por exemplo, uma embalagem reciclável ou um tecido com origem comprovada). Peça aos fornecedores certificados ou comprovação de origem e comunique a mudança aos clientes.",
"Poucos itens já têm origem sustentável. Comece pelos materiais de maior volume (o tecido principal e a embalagem) e troque um de cada vez por opções recicladas ou com origem comprovada.",
"Cerca de metade dos materiais já tem origem sustentável. Defina uma meta para ampliar essa parcela aos poucos e peça aos fornecedores certificados ou comprovação de origem.",
"A maior parte dos materiais é sustentável. Guarde as comprovações e comunique isso aos clientes (etiqueta, redes e site), sem exageros e sempre com comprovação."],
formalizacao:[
"Regularize os vínculos: registre em carteira quem trabalha de forma contínua e subordinada ou formalize a prestação de serviço por CNPJ (MEI ou empresa), quando for o caso. Um contador ou o Sebrae pode orientar o melhor modelo e os custos.",
null,
"A maioria já é formal. Defina um plano com prazos para regularizar quem ainda está sem registro, com orientação de um contador sobre custos e sobre o melhor modelo.",
"Todas as pessoas estão formalizadas. Mantenha contratos e registros organizados e revise de tempos em tempos se a forma de contratação continua adequada."],
faccoes:[
"Contrate somente oficinas com CNPJ, firme contrato por escrito e visite as oficinas para ver as condições reais (jornada, segurança, registro dos trabalhadores). Peça documentos e guarde o registro das visitas.",
"Já há alguma exigência com as oficinas. Dê o próximo passo: visitas periódicas, contrato por escrito com regras de jornada e segurança e registro do que foi verificado.",
null,
"As oficinas são formalizadas e acompanhadas. Mantenha as visitas e o registro e, se possível, conte aos clientes como a empresa cuida da cadeia."],
rotatividade:[
"Converse com quem saiu para entender os motivos (salário, jornada, clima, falta de crescimento). Ofereça integração nas primeiras semanas, metas claras e, se possível, um prêmio por produção ou assiduidade.",
null,
"A rotatividade está moderada. Faça entrevista de saída, acompanhe os motivos mais comuns e fortaleça a integração dos novos funcionários.",
"A rotatividade está baixa. Mantenha o que funciona (salário justo, bom ambiente, reconhecimento) e registre essas práticas para repeti-las nas novas contratações."],
acidentes:[
"Faça um levantamento dos riscos de cada posto (agulhas, cortadores, tomadas, postura), forneça os EPIs necessários e registre todos os acidentes e quase-acidentes. Treine a equipe e corrija primeiro as causas que mais se repetem.",
"Houve acidentes acima do esperado. Investigue a causa de cada ocorrência, corrija os postos de maior risco e reforce EPIs e treinamento. Registre também os quase-acidentes para agir antes de alguém se machucar.",
"Houve poucos acidentes. Analise a causa de cada ocorrência, corrija o posto de trabalho e reforce os EPIs e o treinamento para que não se repita.",
"Não houve acidentes no período. Mantenha o registro de quase-acidentes e as revisões periódicas dos postos de trabalho para continuar assim."],
condicoes_trabalho:[
"Controle a jornada e as horas extras e pague conforme a lei. Garanta pausas, cadeiras e bancadas ajustáveis, boa iluminação e EPIs. Pequenos ajustes de postura e de altura reduzem dores e afastamentos.",
null,
"As condições seguem a lei apenas em parte. Liste o que falta (controle de jornada, pausas, EPIs, ergonomia), priorize o que traz mais risco e defina datas para corrigir.",
"As condições de trabalho seguem a lei. Faça revisões periódicas dos postos e pergunte à equipe o que ainda pode melhorar em conforto e segurança."],
treinamento:[
"Defina um calendário simples de treinamentos (segurança, qualidade, novas técnicas), mesmo que curtos e internos. Veja os cursos do Sebrae e do Senai para complementar.",
"Já há treinamento. Organize um calendário periódico e registre quem participou e o que foi ensinado.",
null,
"A equipe é treinada periodicamente. Mantenha o calendário e peça à equipe sugestões de novos temas."],
equidade_salarial:[
"Compare os salários por função, separando homens e mulheres, e registre as diferenças. Se houver diferença sem justificativa de cargo, tempo ou desempenho, defina um prazo para corrigir e documente os critérios de reajuste.",
"A empresa ainda não comparou os salários. Faça a primeira comparação: liste os salários por função, separando homens e mulheres, e identifique as diferenças sem justificativa de cargo, tempo ou desempenho.",
"Já há acompanhamento das diferenças. Defina critérios claros de salário e de reajuste por função e revise-os todo ano.",
"Não há diferença salarial por gênero na mesma função. Mantenha critérios claros e registrados e revise os salários sempre que houver contratação ou reajuste."],
clima:[
"Marque uma conversa curta e regular com a equipe (por exemplo, todo mês ou todo trimestre) e faça uma pesquisa simples e anônima. Escolha uma ou duas melhorias possíveis, aplique e conte à equipe o que mudou.",
"Há conversas com a equipe. Dê o próximo passo: marque encontros regulares, faça uma pesquisa simples e anônima e conte o que foi feito com as sugestões.",
null,
"A empresa ouve a equipe e age. Mantenha a rotina e acompanhe se as melhorias realmente mudaram o dia a dia."],
comunidade:[
"Escolha uma ação possível para o seu tamanho: doar retalhos a uma cooperativa, comprar de produtores locais, oferecer aulas de costura ou apoiar um projeto do bairro. O mais importante é a regularidade.",
null,
"O apoio à comunidade é eventual. Escolha uma ação fixa para o ano (por exemplo, doação mensal de retalhos ou compra de associações locais) para criar regularidade.",
"O apoio à comunidade é regular. Registre o que foi feito e conte à equipe e aos clientes, para fortalecer a relação com o bairro."],
formalizacao_empresa:[
"Levante todas as pendências (impostos, FGTS, INSS, DAS) com o contador e priorize negociar ou parcelar. Evite novas pendências com um calendário de vencimentos e uma pessoa responsável por acompanhá-lo.",
null,
"As pendências estão em regularização. Mantenha o acordo em dia, acompanhe os vencimentos no calendário e confirme com o contador quando tudo estiver quitado.",
"Impostos e obrigações estão em dia. Mantenha o calendário de vencimentos e guarde os comprovantes organizados."],
contabilidade:[
"Contrate um contador ou use um sistema simples de gestão financeira e registre as entradas e saídas todos os dias. Peça relatórios mensais (resultado e fluxo de caixa) e reserve um horário fixo para olhar os números.",
"Já há um controle próprio. Evolua para relatórios mensais de resultado e de fluxo de caixa, de preferência com o apoio de um contador.",
null,
"A contabilidade e o controle financeiro estão organizados. Use os relatórios para decidir (preços, compras, investimentos) e acompanhe a evolução mês a mês."],
separacao_contas:[
"Abra uma conta bancária e, se possível, um cartão só da empresa. Defina um valor de retirada mensal (pró-labore) e pague as despesas pessoais somente com ele.",
"A separação é parcial. Complete: conta e cartão exclusivos da empresa, retirada mensal fixa (pró-labore) e nenhuma despesa pessoal paga pela empresa.",
null,
"As contas estão separadas. Mantenha a retirada mensal definida e revise o valor quando o resultado da empresa mudar."],
codigo_conduta:[
"Escreva em uma ou duas páginas as regras de convivência e de conduta (respeito, assédio, discriminação, presentes e conflitos de interesse). Apresente à equipe, colha a assinatura e retome o assunto na integração de cada novo funcionário.",
"As regras existem só de forma verbal. Escreva-as em uma ou duas páginas, apresente à equipe e inclua o assunto na integração de novos funcionários.",
null,
"As regras estão escritas e são conhecidas. Revise o documento uma vez por ano e use exemplos reais para reforçar o assunto com a equipe."],
canal_denuncia:[
"Crie um meio reservado para relatos, como uma caixa fechada, um e-mail ou um WhatsApp só para isso, com uma pessoa responsável por garantir sigilo e dar retorno. Divulgue à equipe e deixe claro que não haverá retaliação.",
"Hoje o relato depende de conversa direta. Crie um meio reservado (caixa fechada, e-mail ou WhatsApp só para isso) e garanta sigilo e retorno.",
null,
"Existe um canal reservado, com retorno. Divulgue-o periodicamente, registre os casos e as providências e mantenha a regra de não retaliação."],
lgpd:[
"Faça um levantamento dos dados pessoais que a empresa guarda (cadastros, fotos, documentos), restrinja o acesso com senha, apague o que não é mais necessário e tenha um aviso simples de privacidade e um e-mail para pedidos dos titulares.",
null,
"Já há cuidados básicos. Complete com um aviso simples de privacidade, um e-mail para pedidos dos titulares e a regra de apagar dados que não são mais necessários.",
"A proteção de dados está organizada. Revise as regras uma vez por ano e treine os novos funcionários que lidam com dados de clientes."],
compras_formais:[
"Compre sempre com nota fiscal e, nos valores maiores, registre o pedido por escrito. Mantenha uma lista de fornecedores com CNPJ e confira a regularidade antes de contratar.",
null,
"Parte das compras já é formal. Padronize: nota fiscal em todas as compras, pedido por escrito nas maiores e uma lista de fornecedores com CNPJ.",
"Compras e fornecedores estão formalizados. Mantenha a lista atualizada e reavalie de tempos em tempos a regularidade de cada fornecedor."],
gestao_riscos:[
"Liste os cinco imprevistos que mais poderiam parar a empresa (incêndio, quebra de máquina, fornecedor que falha, falta de caixa) e defina uma ação de prevenção para cada um. Peça cotação de seguro empresarial e guarde cópias dos documentos e dos dados importantes.",
null,
"Há cuidados, mas sem plano formal. Escreva os principais imprevistos e a ação para cada um, cote um seguro e guarde cópias dos documentos importantes.",
"Há seguro ou plano de contingência. Revise o plano uma vez por ano e teste na prática (por exemplo, um simulado de evacuação ou de recuperação de dados)."],
margem_liquida:[
"Calcule o custo real de cada produto (tecido, mão de obra, energia, perdas) e revise preços e descontos. Reduza desperdícios, renegocie compras e acompanhe a margem todo mês, não só no fim do ano.",
null,
"A margem é positiva, mas pode melhorar. Compare o custo real de cada produto com o preço de venda e identifique onde estão as maiores perdas (retalhos, retrabalho, tempo parado).",
"A margem está saudável. Proteja-a revisando os preços periodicamente e reinvista uma parte em melhorias que reduzam custos (energia, água, desperdício)."],
crescimento_receita:[
"Veja quais produtos e clientes mais vendem e invista neles. Teste novos canais (venda online, redes sociais, parcerias com lojistas) e produtos de maior valor, como linhas com apelo sustentável.",
null,
"As vendas cresceram pouco. Teste novos canais (venda online, parcerias) e foque nos produtos e nos clientes que mais voltam a comprar.",
"As vendas estão crescendo bem. Cuide para que produção, caixa e equipe acompanhem o crescimento sem perder qualidade nem aumentar o desperdício."],
fluxo_caixa:[
"Monte um fluxo de caixa semanal com a previsão de entradas e saídas. Negocie prazos com fornecedores e clientes para equilibrar recebimentos e pagamentos e evite usar o dinheiro do giro para gastos pessoais.",
"Em alguns meses o caixa fica apertado. Monte uma previsão semanal e negocie prazos para evitar os meses mais difíceis.",
null,
"O caixa cobre as despesas e ainda sobra. Defina o que fazer com a sobra: reserva, investimento em eficiência ou quitação das dívidas mais caras."],
endividamento:[
"Liste todas as dívidas com juros e prazos, priorize quitar ou renegociar as mais caras e evite novas dívidas para cobrir despesas do dia a dia. Pesquise linhas de crédito com juros menores antes de contratar.",
"As dívidas pesam bastante no mês. Liste as parcelas por custo e prazo, priorize quitar ou renegociar as mais caras e evite novos empréstimos para despesas do dia a dia.",
"As dívidas estão num nível administrável. Priorize quitar as mais caras e evite novas dívidas para o dia a dia.",
"O peso das dívidas está baixo. Mantenha o controle e use o crédito apenas para investimentos que se paguem."],
reserva_caixa:[
"Separe todo mês um valor, mesmo pequeno, para a reserva. Uma meta inicial possível é cobrir um mês de despesas fixas, aumentando aos poucos.",
"A reserva cobre cerca de um mês de despesas. Continue separando um valor todo mês até chegar a pelo menos dois ou três meses de despesas fixas.",
"Já existe uma reserva para alguns meses. Continue aumentando aos poucos até cobrir mais de três meses de despesas fixas.",
"A reserva cobre mais de três meses de despesas. Mantenha-a em uma aplicação segura e de fácil resgate e revise o valor quando as despesas mudarem."],
investimento_esg:[
"Defina um valor anual, mesmo pequeno, para melhorias ESG com retorno claro (economia de água e energia, segurança, treinamento). Comece pelas ações mais baratas e registre os resultados para justificar novos investimentos.",
"Já há investimento em melhorias ESG. Defina um valor anual e registre os resultados de cada ação para mostrar o retorno.",
null,
"O investimento em melhorias ESG é consistente. Continue registrando os resultados (economia, menos acidentes, satisfação da equipe) e use-os para decidir os próximos investimentos."],
economia_eficiencia:[
"Registre os números antes e depois de cada ação (por exemplo, consumo de energia e de água ou metros de tecido perdidos) para saber quanto foi economizado. Guarde esses dados: eles ajudam a justificar novos investimentos.",
"Já há percepção de economia. Passe a medir: registre os números antes e depois de cada ação para saber o valor exato.",
null,
"A economia é medida. Use os resultados para decidir novas ações e mostre à equipe quanto foi economizado."]
};
const PESO=Object.fromEntries(Q.map(q=>[q.c,q.peso]));
const PRIO=["alta","média","baixa"],PRIO_CLS=["alta","media","baixa"];
const faixaNota=s=>s<=24?0:s<45?1:s<75?2:3; // mesmos níveis do relatório (Crítico, Preocupante, Estável, Excelente)
// texto do nível; se não houver, usa o mais próximo (primeiro os níveis abaixo, depois os acima)
const escolhe=(t,f)=>{for(let k=f;k>=0;k--)if(t[k])return t[k];for(let k=f+1;k<t.length;k++)if(t[k])return t[k];return ""};
// 0 = alta (nota até 24, ou abaixo de 45 em pergunta de peso 2); 1 = média; 2 = baixa
const prioridade=(s,peso)=>(s<=24||(s<45&&peso>=2))?0:(s<45||peso>=2)?1:2;

// Monta as sugestões a partir dos itens guardados no PDF: {c,p,tm,s,a}.
//   melhorar: notas abaixo de 75, da mais urgente para a menos urgente
//   fortes:   notas de 75 ou mais (como manter)
function plano(itens){
  const lista=itens.map(x=>{
    const t=SUG[x.c]||[];
    return {p:x.p,tm:x.tm,s:x.s,pr:prioridade(x.s,PESO[x.c]),
      txt:(x.a==="Não sei"?"Primeiro, levante esse dado (conta, planilha ou registro). ":"")+escolhe(t,faixaNota(x.s))};
  });
  return {
    melhorar:lista.filter(x=>x.s<75).sort((a,b)=>a.pr-b.pr||a.s-b.s),
    fortes:lista.filter(x=>x.s>=75).sort((a,b)=>b.s-a.s)
  };
}

// Lista completa de etapas (perfil + perguntas)
const S=[...PERFIL,...Q], NP=PERFIL.length;

// ------------------------------------------------------------
// Utilitários e estado
// ------------------------------------------------------------
const $=id=>document.getElementById(id);
const fmt=n=>n.toLocaleString("pt-BR",{maximumFractionDigits:2});
const stateOf=v=>STATES.find(s=>v<=s.max)||STATES[3];
let ans=[],i=0,ultimo=null;
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
  if(q.ns)r.push(["Não sei",0]); // "Não sei" conta 0 ponto e aparece em "Onde melhorar"
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
  const adj=q.por?` Faixas ajustadas para ${fmt(P[q.por])} pessoas.`:"";
  $("qhint").textContent=((q.aj||"")+adj).trim();
  const box=$("input");box.innerHTML="";
  const ok=()=>{const v=ans[i];$("next").disabled=v===undefined||(q.k==="t"?!String(v).trim():q.k==="n"&&!q.p?(isNaN(v)||(i>=3&&v<=0)):false)};
  if(q.p||q.k==="c"){
    opts(q).forEach((o,k)=>{
      const b=document.createElement("button");
      b.className="opt";b.type="button";b.textContent=o[0];
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
// Relatório final (tela)
// ------------------------------------------------------------
// Substitua a função finish() inteira do questionario.js por esta.
// Única diferença em relação à original: o bloco "gráfico" perto do final.
function finish(){
  $("quiz").classList.add("hidden");$("report").classList.remove("hidden");
  const sum={},w={},items=[];
  Q.forEach((q,k)=>{
    const answer=ans[NP+k];
    if(answer===undefined)return;
    const o=opts(q)[answer];
    if(!o||o[1]===null)return; // "não se aplica": fica fora da média
    const s=o[1];
    sum[q.p]=(sum[q.p]||0)+s*q.peso;w[q.p]=(w[q.p]||0)+q.peso;
    items.push({q,s,a:o[0]});
  });
  const res={};for(const p in NAMES)res[p]=w[p]?Math.round(sum[p]/w[p]):null;
  const notas=Object.values(res).filter(v=>v!==null);
  const geral=notas.length?Math.round(notas.reduce((a,b)=>a+b,0)/notas.length):null;
  const empresa=typeof ans[0]==="string"&&ans[0].trim()?ans[0].trim():"Sua empresa";
  const ano=ans[1]===undefined?"":`Ano de referência ${ans[1]}. `;

  // dados que ficam guardados dentro do PDF (usados pelo comparador)
  ultimo=items.length?{
    v:VERSAO,gerado:new Date().toISOString(),empresa,
    ano:ans[1]===undefined?null:ans[1],
    setor:ans[2]===undefined?"":PERFIL[2].op[ans[2]][0],
    funcionarios:ans[3]===undefined?null:ans[3],
    faturamento:ans[4]===undefined?null:ans[4],
    geral,pilares:res,
    itens:items.map(x=>({c:x.q.c,p:x.q.p,tm:x.q.tm,t:x.q.t,s:x.s,a:x.a}))
  }:null;
  $("pdf").disabled=!ultimo; // sem respostas não há o que guardar no PDF

  $("rtitle").textContent="Diagnóstico ESG: "+empresa;
  $("rintro").textContent=`${ano}.`+
    (!items.length?"Este é um resumo prévio. Responda ao questionário para gerar notas e recomendações personalizadas.":
      notas.some(v=>v<=24)?"Há pelo menos um pilar em situação crítica e ele deve ser a prioridade da gestão.":"Veja como cada pilar se saiu e onde há mais espaço para melhorar.");
  const bars=$("rbars");bars.innerHTML="";
  for(const p in NAMES){
    const v=res[p],s=v===null?null:stateOf(v),d=document.createElement("div");d.className="ri";
    const heading=document.createElement("div");heading.className="rh";
    const name=document.createElement("span");name.textContent=NAMES[p];
    const score=document.createElement("span");score.className=s?`qz-score qz-score--${s.tone}`:"qz-score qz-score--empty";
    score.textContent=s?`${s.label} (${v}%)`:"Sem dados";
    heading.append(name,score);
    const track=document.createElement("div");track.className=`bar${s?` qz-bar--${s.tone}`:" qz-bar--empty"}`;
    track.setAttribute("role","img");
    track.setAttribute("aria-label",s?`${NAMES[p]}: ${v}%, ${s.label}`:`${NAMES[p]}: sem dados`);
    const fill=document.createElement("i");fill.className="qz-bar-fill";fill.style.width=`${v||0}%`;
    track.append(fill);
    const description=document.createElement("p");description.className="tip";description.textContent=DESC[p];
    d.append(heading,track,description);
    bars.append(d);
  }
  const tips=$("tips");tips.innerHTML="";
  const weak=items.filter(x=>x.s<45).sort((a,b)=>a.s-b.s||b.q.peso-a.q.peso);
  if(!weak.length)tips.innerHTML=`<p class="tip">${items.length?"Nenhuma resposta ficou em nível de atenção. Continue acompanhando os indicadores todo ano.":"Responda ao questionário para ver recomendações personalizadas."}</p>`;
  weak.forEach(x=>{
    const d=document.createElement("div");d.className="ri";
    d.innerHTML=`<div class="rh"><span>${NAMES[x.q.p]}: ${x.q.tm}</span><span>${x.s}/100</span></div><p style="margin:0">${x.q.t}</p><p class="tip">Sua resposta: ${x.a}</p>`;
    tips.append(d);
  });
  // sugestões (fim do relatório): o texto depende da faixa da nota
  const pl=plano(ultimo?ultimo.itens:[]);
  const area=(id,titulo)=>{
    let el=$(id);
    if(!el){ // se o HTML não tiver a área, cria logo abaixo da anterior
      const h=document.createElement("h3");h.className="qz-subtitulo";h.textContent=titulo;
      el=document.createElement("div");el.id=id;
      (id==="sugs"?tips:$("sugs")).after(h,el);
    }
    el.innerHTML="";
    return el;
  };
  const cartao=(tit,badge,cls,txt)=>{
    const card=document.createElement("div");card.className="ri";
    const cab=document.createElement("div");cab.className="rh";
    const t=document.createElement("span");t.textContent=tit;
    const b=document.createElement("span");b.className=`qz-prio ${cls}`;b.textContent=badge;
    cab.append(t,b);
    const par=document.createElement("p");par.className="qz-sug-txt";par.textContent=txt;
    card.append(cab,par);
    return card;
  };
  const aviso=(el,msg)=>{const t=document.createElement("p");t.className="tip";t.textContent=msg;el.append(t)};

  const sg=area("sugs","Sugestões de melhoria");
  if(!pl.melhorar.length)aviso(sg,items.length?"Todas as respostas ficaram em nível excelente. Mantenha o acompanhamento todo ano e compare os relatórios para acompanhar a evolução da empresa.":"Responda ao questionário para receber sugestões personalizadas.");
  pl.melhorar.forEach((x,k)=>sg.append(cartao(`${k+1}. ${NAMES[x.p]}: ${x.tm}`,`Prioridade ${PRIO[x.pr]}`,`qz-prio--${PRIO_CLS[x.pr]}`,x.txt)));

  const ft=area("fortes","Pontos fortes e como manter");
  if(!pl.fortes.length)aviso(ft,"Quando as respostas atingirem o nível excelente, os pontos fortes da empresa aparecerão aqui.");
  pl.fortes.forEach(x=>ft.append(cartao(`${NAMES[x.p]}: ${x.tm}`,"Ponto forte","qz-prio--baixa",x.txt)));

  // gráfico (vem do arquivo grafico-esg.js). Fica por último para que, se algo
  // der errado nele, o restante do relatório já esteja pronto.
  try{
    if(typeof montarGrafico==="function")montarGrafico(ultimo);
    else console.warn("grafico-esg.js não foi carregado");
  }catch(e){console.error("Erro ao montar o gráfico:",e)}

  window.scrollTo({top:0,behavior:"smooth"});
}
// ------------------------------------------------------------
// PDF (jsPDF). Os dados do diagnóstico vão embutidos no campo
// "Palavras-chave" do arquivo, em base64, para o comparador ler.
// ------------------------------------------------------------
function codificar(obj){
  const bytes=new TextEncoder().encode(JSON.stringify(obj));
  let s="";bytes.forEach(c=>{s+=String.fromCharCode(c)});
  return btoa(s);
}

function gerarPDF(d){
  if(!window.jspdf){alert("Não foi possível carregar o gerador de PDF. Verifique a conexão com a internet e tente de novo.");return}
  const doc=new window.jspdf.jsPDF({unit:"mm",format:"a4"});
  doc.setLineHeightFactor(1.3);
  const M=18,CW=174,PH=297;let y=M;
  const GREEN=[85,101,31],TXT=[38,48,26],SOFT=[106,112,88];
  const limpa=s=>String(s).replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/[–—]/g,"-").replace(/…/g,"...").replace(/[^\u0000-\u00FF]/g,"?");
  const rgb=h=>[1,3,5].map(k=>parseInt(h.slice(k,k+2),16));
  const garante=h=>{if(y+h>PH-M){doc.addPage();y=M}};
  const escreve=(s,tam,estilo,cor,depois=0)=>{
    doc.setFont("helvetica",estilo);doc.setFontSize(tam);doc.setTextColor(...cor);
    const linhas=doc.splitTextToSize(limpa(s),CW),alt=linhas.length*tam*0.3528*1.3;
    garante(alt);doc.text(linhas,M,y+tam*0.3528);y+=alt+depois;
  };

  escreve("RELATÓRIO ESG",9,"bold",GREEN,2);
  escreve("Diagnóstico ESG: "+d.empresa,20,"bold",TXT,2);
  escreve(`Ano de referência ${d.ano===null?"não informado":d.ano}${d.setor?" · "+d.setor:""}${d.funcionarios===null?"":" · "+fmt(d.funcionarios)+" pessoas"}`,10,"normal",SOFT,1);
  escreve(`Gerado em ${new Date(d.gerado).toLocaleDateString("pt-BR")} · questionário versão ${d.v} · nota geral ${d.geral===null?"sem dados":d.geral+"/100"}`,10,"normal",SOFT,8);

  escreve("Resultado por pilar",13,"bold",TXT,3);
  for(const p in NAMES){
    const v=d.pilares[p],s=v===null?null:stateOf(v);
    garante(22);
    doc.setFont("helvetica","bold");doc.setFontSize(10);
    doc.setTextColor(...TXT);doc.text(limpa(NAMES[p]),M,y+3);
    doc.setTextColor(...(s?rgb(s.color):SOFT));doc.text(s?`${s.label} (${v}%)`:"Sem dados",M+CW,y+3,{align:"right"});
    y+=5;
    doc.setFillColor(217,220,200);doc.rect(M,y,CW,3,"F");
    if(s){doc.setFillColor(...rgb(s.color));doc.rect(M,y,Math.max(CW*v/100,0.1),3,"F")}
    y+=5;
    escreve(DESC[p],9,"normal",SOFT,4);
  }

  y+=2;
  escreve("Onde melhorar",13,"bold",TXT,3);
  const fracos=d.itens.filter(x=>x.s<45).sort((a,b)=>a.s-b.s);
  if(!fracos.length)escreve("Nenhuma resposta ficou em nível de atenção. Continue acompanhando os indicadores todo ano.",10,"normal",SOFT);
  fracos.forEach(x=>{
    garante(22);
    escreve(`${NAMES[x.p]}: ${x.tm} (${x.s}/100)`,10,"bold",TXT,0.5);
    escreve(x.t,9,"normal",TXT,0.5);
    escreve("Sua resposta: "+x.a,9,"normal",SOFT,4);
  });

  y+=2;
  escreve("Sugestões de melhoria",13,"bold",TXT,1);
  escreve("Ordenadas da mais urgente para a menos urgente.",9,"normal",SOFT,3);
  const pl=plano(d.itens);
  if(!pl.melhorar.length)escreve("Todas as respostas ficaram em nível excelente. Mantenha o acompanhamento todo ano e compare os relatórios para acompanhar a evolução da empresa.",10,"normal",SOFT);
  pl.melhorar.forEach((x,k)=>{
    garante(24);
    escreve(`${k+1}. ${NAMES[x.p]}: ${x.tm} (prioridade ${PRIO[x.pr]})`,10,"bold",TXT,0.5);
    escreve(x.txt,9,"normal",TXT,4);
  });
  if(pl.fortes.length){
    y+=2;
    escreve("Pontos fortes e como manter",13,"bold",TXT,3);
    pl.fortes.forEach(x=>{
      garante(20);
      escreve(`${NAMES[x.p]}: ${x.tm}`,10,"bold",TXT,0.5);
      escreve(x.txt,9,"normal",TXT,4);
    });
  }

  const n=doc.getNumberOfPages();
  for(let k=1;k<=n;k++){
    doc.setPage(k);doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(...SOFT);
    doc.text(`Stitch · Protótipo educativo ESG · página ${k} de ${n}`,M,PH-8);
  }

  doc.setProperties({
    title:limpa("Diagnóstico ESG - "+d.empresa),
    subject:"Relatório ESG (questionário versão "+d.v+")",
    author:"Stitch",creator:"Stitch",
    keywords:"ESGDATA:"+codificar(d)
  });

  const slug=String(d.empresa).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"").toLowerCase()||"empresa";
  doc.save(`diagnostico-esg-${slug}-${d.ano===null?"sem-ano":d.ano}.pdf`);
}

// ------------------------------------------------------------
// Navegação e inicialização
// ------------------------------------------------------------
$("next").onclick=()=>{if(i<S.length-1){i++;show()}else finish()};
$("back").onclick=()=>{if(i>0){i--;show()}};
$("skip").onclick=finish; // resumo com o que já foi respondido
$("pdf").onclick=()=>{if(ultimo)gerarPDF(ultimo)};
$("restart").onclick=()=>{ans=[];i=0;ultimo=null;$("report").classList.add("hidden");$("quiz").classList.remove("hidden");show()};
show();