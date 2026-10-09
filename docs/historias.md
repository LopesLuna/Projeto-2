# Histórias do Stitch 

---

**📄 `docs/historias.md`**

# Histórias do Usuário — Stitch

Histórias do produto Stitch, cada uma com cenários de validação em BDD (Dado / Quando / Então).

## Índice

- [H01 — Explicação curta e objetiva do Stitch](#h01--explicação-curta-e-objetiva-do-stitch)
- [H02 — Entender a posição ESG da empresa com dados comparativos](#h02--entender-a-posição-esg-da-empresa-com-dados-comparativos)
- [H03 — Histórico de relatórios e comparação temporal](#h03--histórico-de-relatórios-e-comparação-temporal)
- [H04 — Aplicar ESG sem causar prejuízo](#h04--aplicar-esg-sem-causar-prejuízo)
- [H05 — Saber se o ESG vale a pena](#h05--saber-se-o-esg-vale-a-pena)
- [H06 — Relatório ESG para apresentação ao banco](#h06--relatório-esg-para-apresentação-ao-banco)
- [H07 — Por onde começar a aplicar ESG](#h07--por-onde-começar-a-aplicar-esg)
- [H08 — Criar conta para usar o simulador com dados reais](#h08--criar-conta-para-usar-o-simulador-com-dados-reais)
- [H09 — Painel interno para editar materiais explicativos (admin)](#h09--painel-interno-para-editar-materiais-explicativos-admin)
- [H10 — Gerenciar métricas de mercado no banco de dados (gestor)](#h10--gerenciar-métricas-de-mercado-no-banco-de-dados-gestor)
- [H11 — Recomendações do que implementar e seus benefícios](#h11--recomendações-do-que-implementar-e-seus-benefícios)

---

## H01 — Explicação curta e objetiva do Stitch

**Como** alguém com interesse nas empresas-alvo,
**quero** uma explicação curta e objetiva do que se trata o Stitch,
**para** entender rapidamente o valor da plataforma antes de investir tempo nela.

### Cenários de validação (BDD)

**Cenário 1: visitante entende a proposta**
- Dado que acesso a página inicial sem conhecer o Stitch
- Quando leio a seção de apresentação
- Então vejo um texto curto explicando o que é a plataforma, para quem é e qual problema resolve

**Cenário 2: chamada para ação visível**
- Dado que li a explicação da plataforma
- Então vejo um botão claro para iniciar o diagnóstico ESG

**Cenário 3: linguagem acessível**
- Dado que não conheço o termo "ESG"
- Quando leio a explicação
- Então o texto usa linguagem simples, sem exigir conhecimento prévio

---

## H02 — Entender a posição ESG da empresa com dados comparativos

**Como** dono de empresa-alvo que **não sabe** o que é ESG,
**quero** visualizar dados comparativos e entender onde a empresa se encontra quanto a práticas verdes,
**para** descobrir, sem conhecimento prévio, como meu negócio se posiciona frente ao mercado.

### Cenários de validação (BDD)

**Cenário 1: pilares explicados em linguagem simples**
- Dado que não sei o que é ESG
- Quando acesso a área de dados comparativos
- Então os quatro pilares (ambiental, social, governança e reputação/financeiro) são explicados em linguagem simples

**Cenário 2: comparação com o mercado**
- Dado que informei a situação da minha empresa no diagnóstico
- Quando visualizo os dados comparativos
- Então o sistema indica em quais frentes a empresa está acima ou abaixo da média do setor têxtil

---

## H03 — Histórico de relatórios e comparação temporal

**Como** dono de empresa-alvo que já aplica práticas ESG,
**quero** comparar os dados antigos da minha empresa com dados recentes,
**para** saber exatamente onde melhorar e guardar meu histórico de relatórios.

### Cenários de validação (BDD)

**Cenário 1: novo relatório é salvo no histórico**
- Dado que estou autenticado e concluí um diagnóstico
- Quando o relatório final é gerado
- Então ele fica salvo no meu histórico com a data da execução

**Cenário 2: listar relatórios**
- Dado que possuo relatórios salvos
- Quando acesso a página "Meus relatórios"
- Então vejo todos os relatórios ordenados do mais recente ao mais antigo

**Cenário 3: comparar dois relatórios**
- Dado que tenho ao menos dois relatórios salvos
- Quando seleciono dois para comparação
- Então o sistema exibe a evolução das pontuações de cada pilar entre os dois períodos

---

## H04 — Aplicar ESG sem causar prejuízo

**Como** dono de empresa-alvo que tem interesse em práticas ecológicas,
**quero** saber como aplicar o ESG da melhor forma para não causar prejuízo,
**para** adotar práticas sustentáveis de forma financeiramente segura.

### Cenários de validação (BDD)

**Cenário 1: recomendações indicam custo e esforço**
- Dado que concluí o diagnóstico
- Quando vejo as recomendações de aplicação
- Então cada sugestão indica o custo e o esforço estimados de implementação

**Cenário 2: filtrar por baixo custo**
- Dado que vejo a lista de recomendações
- Quando filtro apenas práticas de baixo custo
- Então vejo somente as práticas acessíveis para começar sem comprometer o caixa

---

## H05 — Saber se o ESG vale a pena

**Como** dono de empresa-alvo,
**quero** saber se o ESG vale a pena aplicar (supre minhas necessidades),
**para** decidir com segurança se invisto em práticas sustentáveis.

### Cenários de validação (BDD)

**Cenário 1: evidências de retorno**
- Dado que concluí o diagnóstico
- Quando acesso a seção de retorno do ESG
- Então vejo evidências dos benefícios em reputação, acesso a crédito e novos contratos

**Cenário 2: benefícios com embasamento real**
- Dado que vejo os benefícios apresentados
- Então cada um cita dados reais e fontes verificáveis do setor (não gerados por IA)

---

## H06 — Relatório ESG para apresentação ao banco

**Como** dono de empresa-alvo que teve empréstimo vetado (por falta de relatório ESG),
**quero** saber como ter/formatar um relatório para apresentar ao banco,
**para** comprovar minhas práticas ESG e recuperar meu crédito.

### Cenários de validação (BDD)

**Cenário 1: gerar relatório em formato de apresentação**
- Dado que concluí o diagnóstico
- Quando solicito o relatório
- Então o sistema gera um documento em formato adequado para apresentação institucional (ex.: PDF)

**Cenário 2: relatório com conteúdo exigido**
- Dado que o relatório foi gerado
- Então ele contém as pontuações por pilar, as práticas atestadas e as evidências dos dados

**Cenário 3: orientação para crédito vetado**
- Dado que tive o crédito vetado por falta de relatório ESG
- Quando acesso a orientação do sistema
- Então vejo o que o relatório precisa conter para ser aceito na negociação com o banco

---

## H07 — Por onde começar a aplicar ESG

**Como** dono de empresa-alvo,
**quero** saber como aplicar ESG na minha empresa e por onde começar,
**para** iniciar a jornada de sustentabilidade sem me perder.

### Cenários de validação (BDD)

**Cenário 1: roteiro de primeiros passos**
- Dado que concluí o diagnóstico
- Quando vejo o resultado
- Então recebo um roteiro de primeiros passos ordenado por prioridade

**Cenário 2: roteiro personalizado**
- Dado que meus pilares têm pontuações diferentes
- Quando vejo o roteiro
- Então os primeiros passos correspondem aos pilares com menor pontuação

---

## H08 — Criar conta para usar o simulador com dados reais

**Como** dono de empresa-alvo,
**quero** criar uma conta no sistema,
**para** usar o simulador com os dados reais da minha empresa e guardar meu histórico de relatórios.

### Cenários de validação (BDD)

**Cenário 1: cadastro com sucesso**
- Dado que não possuo conta
- Quando preencho o cadastro com e-mail e senha válidos e envio
- Então minha conta é criada e sou autenticado no sistema

**Cenário 2: e-mail já cadastrado**
- Dado que já existe uma conta com o e-mail informado
- Quando tento me cadastrar novamente
- Então vejo uma mensagem de erro clara e nenhuma conta duplicada é criada

**Cenário 3: usuário autenticado vê histórico**
- Dado que estou autenticado e já gerei relatórios
- Quando acesso minha área de conta
- Então vejo meus relatórios salvos no histórico

---

## H09 — Painel interno para editar materiais explicativos (admin)

**Como** administrador do site,
**quero** poder alterar os materiais explicativos sobre ESG através de um painel interno,
**para** não precisar pedir a um programador para mexer no código toda vez que uma informação precisar de atualização.

### Cenários de validação (BDD)

**Cenário 1: acesso restrito ao painel**
- Dado que sou administrador
- Quando faço login e acesso o painel interno
- Então posso visualizar e editar os materiais explicativos sobre ESG

**Cenário 2: publicar alteração sem código**
- Dado que editei um texto explicativo no painel
- Quando salvo a alteração
- Então o conteúdo exibido no site é atualizado sem nenhuma alteração de código

**Cenário 3: acesso negado a não administradores**
- Dado que sou um usuário comum
- Quando tento acessar o painel interno
- Então o acesso é negado

---

## H10 — Gerenciar métricas de mercado no banco de dados (gestor)

**Como** gestor do sistema,
**quero** conseguir inserir, editar e apagar os dados das métricas das outras empresas no banco de dados
**para** que o comparador funcione sempre com informações recentes do mercado.

### Cenários de validação (BDD)

**Cenário 1: inserir nova métrica**
- Dado que sou gestor do sistema
- Quando insiro os dados de métrica de uma empresa no painel
- Então o registro fica salvo no banco de dados

**Cenário 2: editar e apagar métricas**
- Dado que existem métricas cadastradas
- Quando edito ou apago um registro
- Então o banco de dados é atualizado imediatamente

**Cenário 3: comparador sempre atualizado**
- Dado que uma métrica do mercado foi atualizada
- Quando um usuário visualiza os dados comparativos
- Então o comparador usa a informação mais recente

---

## H11 — Recomendações do que implementar e seus benefícios

**Como** dono de empresa de moda,
**quero** ver o que devo implementar na minha empresa para melhorar meus dados e o que essas mudanças podem beneficiar,
**para** priorizar as ações que trazem mais retorno para o negócio.

### Cenários de validação (BDD)

**Cenário 1: recomendação com benefício explicado**
- Dado que concluí o diagnóstico
- Quando vejo as recomendações
- Então cada uma mostra o que implementar e quais benefícios a mudança pode trazer (dados, reputação, crédito)

**Cenário 2: vínculo com os pilares**
- Dado que vejo uma recomendação
- Quando clico nela
- Então vejo em qual pilar ela impacta e o ganho estimado na pontuação
