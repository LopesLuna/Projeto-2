# 🪡 Stitch - Plataforma ESG para PMEs do setor têxtil

![Python](https://img.shields.io/badge/Python-3.x-blue?style=for-the-badge&logo=python)
![Django](https://img.shields.io/badge/Django-Framework-092E20?style=for-the-badge&logo=django)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Render-336791?style=for-the-badge&logo=postgresql)
![Deploy](https://img.shields.io/badge/Deploy-Render-46E3B7?style=for-the-badge&logo=render)

> **Stitch** é uma plataforma web conscientizadora e prática desenvolvida para guiar pequenas e médias empresas (PMEs) na implementação e acompanhamento de práticas **ESG** (*Environmental, Social, and Governance*) nos seus negócios.

---
## 💡 Sobre o Projeto

O projeto **Stitch** nasceu no contexto de democratizar o acesso a conceitos e práticas sustentáveis para PMEs. Através de uma interface acessível e intuitiva, as empresas conseguem compreender os pilares do ESG, gerir tarefas sustentáveis e promover impacto positivo de forma real.

---
## 🛠️ Tecnologias Utilizadas

- **Linguagem:** Python 3.x
- **Framework Web:** Django
- **Banco de Dados:** 
  - *Desenvolvimento:* SQLite3
  - *Produção:* PostgreSQL (Render)
- **Servidor & Static Files:** Gunicorn, WhiteNoise e Dj-Database-Url
- **Hospedagem / Deploy:** Render

## Como rodar o projeto

### Pré-requisitos

- Python 3.x instalado

### Passos

git clone https://github.com/LopesLuna/Projeto-2.git
cd Projeto-2
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

Depois, acesse http://127.0.0.1:8000/

## Deploy

A aplicação está publicada em produção no Render:

**URL de acesso:** https://projeto-2-tarefas.onrender.com

Basta acessar o link acima para ver o sistema funcionando (nenhuma instalação necessária).

## Entregas

### Entrega 01
Análise de competidores e configuração inicial do ambiente de desenvolvimento.
[Relatório_de_Análise_de_Competidores.md](Relatório_de_Análise_de_Competidores.md)

### Entrega 02

**Descrição:** Implementação da infraestrutura básica da aplicação Django (model, view, template e rotas de tarefas, incluindo cadastro de novas tarefas), páginas institucionais (Home/Sobre, Equipe e Fale Conosco com formulário de sugestões), deploy em produção no Render, e configuração do Issue Tracker no GitHub.

Artefatos, screencasts e evidências: [infraestrutura_render.md](infraestrutura_render.md)

## Equipe

| Nome completo | E-mail School |
|---|---|
| Cauê Juvino | ceja@cesar.school |
| João Bezerra | jbbn@cesar.school |
| Jose Ernesto | jetd@cesar.school |
| Mariana Luna | maall@cesar.school |
| Matheus Costa | mplc@cesar.school |
| Pedro Correia | pca2@cesar.school |
| Rodrigo Fernandes | rfvb@cesar.school |
