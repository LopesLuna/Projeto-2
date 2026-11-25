"""Testes automatizados do site Stitch (rodam na pipeline do GitHub Actions).

Os testes com SimpleTestCase não usam banco: só conferem que as páginas
respondem e que os elementos principais estão presentes. Os de login e
cadastro (TestCase) usam o banco de teste que o Django cria sozinho.
Rodar localmente:  python manage.py test
"""
import json
import re

from django.contrib.auth.models import User
from django.contrib.staticfiles import finders
from django.test import SimpleTestCase, TestCase, override_settings
from django.urls import reverse

from .models import Relatorio

PAGINAS = ["home", "entenda_esg", "simuladores", "quem_somos", "contato", "comparador_pdf"]

# Logos novas (exportadas do arquivo vetorial da identidade visual)
LOGOS = [
    "img/logo-s-creme.png",
    "img/logo-s-verde-claro.png",
    "img/logo-s-verde-escuro.png",
    "img/logo-stitch-creme.png",
    "img/logo-stitch-verde-claro.png",
    "img/logo-stitch-verde-escuro.png",
    "img/favicon-32.png",
    "img/apple-touch-icon.png",
]

# Nos testes não existe 'collectstatic' rodado, então o armazenamento com
# manifesto (WhiteNoise/Manifest) quebraria o {% static %}. Usamos o simples.
STORAGE_TESTE = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}


@override_settings(STORAGES=STORAGE_TESTE)
class PaginasRespondemTest(SimpleTestCase):
    def test_todas_as_paginas_retornam_200(self):
        for nome in PAGINAS:
            with self.subTest(pagina=nome):
                resp = self.client.get(reverse(nome))
                self.assertEqual(resp.status_code, 200)

    def test_navbar_tem_os_links_principais(self):
        html = self.client.get(reverse("home")).content.decode()
        for nome in ["entenda_esg", "simuladores", "quem_somos", "contato"]:
            with self.subTest(link=nome):
                self.assertIn(reverse(nome), html)


@override_settings(STORAGES=STORAGE_TESTE)
class HomeTest(SimpleTestCase):
    def test_carrossel_tem_4_slides_e_4_bolinhas(self):
        html = self.client.get(reverse("home")).content.decode()
        self.assertEqual(len(re.findall(r'class="st-slide( on)?"', html)), 4)
        self.assertEqual(html.count('aria-label="Slide '), 4)

    def test_tem_os_dois_cards(self):
        html = self.client.get(reverse("home")).content.decode()
        self.assertIn("st-card-about", html)
        self.assertIn("st-card-join", html)

    def test_bolinhas_sem_a_animacao_de_esticar(self):
        html = self.client.get(reverse("home")).content.decode()
        self.assertNotIn("stretch", html)
        with open(finders.find("js/esg-carrossel.js"), encoding="utf-8") as f:
            self.assertNotIn("stretch", f.read())


@override_settings(STORAGES=STORAGE_TESTE)
class IdentidadeVisualTest(SimpleTestCase):
    def test_navbar_usa_o_monograma_creme(self):
        for nome in PAGINAS:
            with self.subTest(pagina=nome):
                html = self.client.get(reverse(nome)).content.decode()
                self.assertIn("img/logo-s-creme.png", html)

    def test_card_o_que_e_stitch_usa_a_logo_verde_escuro(self):
        html = self.client.get(reverse("home")).content.decode()
        self.assertIn("img/logo-stitch-verde-escuro.png", html)

    def test_icone_da_aba_no_head(self):
        html = self.client.get(reverse("home")).content.decode()
        self.assertIn('rel="icon"', html)
        self.assertIn("img/favicon-32.png", html)


@override_settings(STORAGES=STORAGE_TESTE)
class ContatoTest(SimpleTestCase):
    def test_formulario_tem_csrf_e_campos(self):
        html = self.client.get(reverse("contato")).content.decode()
        self.assertIn("csrfmiddlewaretoken", html)
        for campo in ["nome", "email", "assunto", "mensagem"]:
            with self.subTest(campo=campo):
                self.assertIn(f'name="{campo}"', html)

    def test_select_assunto_chama_toggle(self):
        html = self.client.get(reverse("contato")).content.decode()
        self.assertIn('onchange="toggleAssunto()"', html)

    def test_sem_marcador_de_merge_na_pagina(self):
        for nome in PAGINAS:
            with self.subTest(pagina=nome):
                html = self.client.get(reverse(nome)).content.decode()
                self.assertNotIn(">>>>>>>", html)
                self.assertNotIn("<<<<<<<", html)


@override_settings(STORAGES=STORAGE_TESTE)
class PopupLoginTest(SimpleTestCase):
    def test_popup_tem_as_abas_entrar_e_criar_conta(self):
        html = self.client.get(reverse("home")).content.decode()
        self.assertIn('id="aba-entrar"', html)
        self.assertIn('id="aba-cadastro"', html)
        self.assertIn(f'action="{reverse("entrar")}"', html)
        self.assertIn(f'action="{reverse("cadastrar")}"', html)
        self.assertIn('name="confirmar"', html)

    def test_popup_nao_abre_sozinho_sem_motivo(self):
        html = self.client.get(reverse("home")).content.decode()
        self.assertNotIn("data-abrir=", html)


@override_settings(STORAGES=STORAGE_TESTE)
class DiagnosticoExigeLoginTest(TestCase):
    def test_sem_login_volta_para_a_pagina_de_origem_com_aviso(self):
        resp = self.client.get(reverse("diagnostico"), HTTP_REFERER="http://testserver" + reverse("contato"))
        self.assertRedirects(resp, "http://testserver" + reverse("contato"), fetch_redirect_response=False)
        html = self.client.get(reverse("contato")).content.decode()
        self.assertIn('data-abrir="entrar"', html)
        self.assertIn("Faça login ou crie uma conta para acessar o diagnóstico.", html)
        # o aviso substitui o subtítulo, para não repetir a mesma ideia duas vezes
        self.assertNotIn("Entre ou crie sua conta para fazer o diagnóstico", html)

    def test_aviso_aparece_uma_vez_so(self):
        self.client.get(reverse("diagnostico"))
        self.client.get(reverse("home"))
        html = self.client.get(reverse("home")).content.decode()
        self.assertNotIn("data-abrir=", html)

    def test_sem_origem_ou_origem_externa_vai_para_a_home(self):
        resp = self.client.get(reverse("diagnostico"), HTTP_REFERER="https://site-malicioso.com/")
        self.assertRedirects(resp, reverse("home"), fetch_redirect_response=False)

    def test_depois_de_entrar_vai_para_o_diagnostico(self):
        User.objects.create_user(username="ana@empresa.com", email="ana@empresa.com", password="senhaforte1")
        self.client.get(reverse("diagnostico"))
        resp = self.client.post(reverse("entrar"), {
            "email": "ana@empresa.com", "senha": "senhaforte1", "voltar": reverse("home"),
        })
        self.assertRedirects(resp, reverse("diagnostico"), fetch_redirect_response=False)
        self.assertEqual(self.client.get(reverse("diagnostico")).status_code, 200)


@override_settings(STORAGES=STORAGE_TESTE)
class CadastroTest(TestCase):
    def dados(self, **troca):
        dados = {"nome": "Ana", "email": "Ana@Empresa.com", "senha": "senhaforte1",
                 "confirmar": "senhaforte1", "voltar": reverse("home")}
        dados.update(troca)
        return dados

    def test_cria_conta_entra_e_vai_para_o_diagnostico(self):
        resp = self.client.post(reverse("cadastrar"), self.dados())
        self.assertRedirects(resp, reverse("diagnostico"), fetch_redirect_response=False)
        user = User.objects.get(username="ana@empresa.com")
        self.assertEqual(user.first_name, "Ana")
        self.assertEqual(int(self.client.session["_auth_user_id"]), user.pk)

    def test_erros_reabrem_a_aba_criar_conta_com_mensagem(self):
        casos = [
            (self.dados(confirmar="outrasenha1"), "As senhas não são iguais."),
            (self.dados(senha="curta", confirmar="curta"), "pelo menos 8 caracteres"),
            (self.dados(senha="12345678", confirmar="12345678"), "só números"),
            (self.dados(email="sem-arroba"), "e-mail válido"),
            (self.dados(nome=""), "Preencha todos os campos."),
        ]
        for dados, mensagem in casos:
            with self.subTest(mensagem=mensagem):
                resp = self.client.post(reverse("cadastrar"), dados)
                self.assertRedirects(resp, reverse("home"), fetch_redirect_response=False)
                html = self.client.get(reverse("home")).content.decode()
                self.assertIn('data-abrir="cadastro"', html)
                self.assertIn(mensagem, html)
        self.assertFalse(User.objects.exists())

    def test_email_repetido(self):
        User.objects.create_user(username="ana@empresa.com", email="ana@empresa.com", password="x")
        self.client.post(reverse("cadastrar"), self.dados())
        html = self.client.get(reverse("home")).content.decode()
        self.assertIn("Já existe uma conta com este e-mail.", html)
        self.assertEqual(User.objects.count(), 1)

    def test_login_errado_reabre_a_aba_entrar(self):
        self.client.post(reverse("entrar"), {"email": "ninguem@x.com", "senha": "errada123", "voltar": reverse("contato")})
        html = self.client.get(reverse("contato")).content.decode()
        self.assertIn('data-abrir="entrar"', html)
        self.assertIn("E-mail ou senha incorretos.", html)
        self.assertIn('value="ninguem@x.com"', html)


@override_settings(STORAGES=STORAGE_TESTE)
class MenuDaContaTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="ana@empresa.com", email="ana@empresa.com", password="senhaforte1", first_name="Ana"
        )

    def test_deslogado_ve_o_botao_login_e_nao_o_icone(self):
        html = self.client.get(reverse("home")).content.decode()
        self.assertIn('id="abrir-login"', html)
        self.assertNotIn('id="abrir-perfil"', html)

    def test_logado_ve_o_icone_de_perfil_com_o_menu(self):
        self.client.force_login(self.user)
        html = self.client.get(reverse("home")).content.decode()
        self.assertIn('id="abrir-perfil"', html)
        self.assertNotIn('id="abrir-login"', html)
        self.assertNotIn('id="modal-login"', html)
        menu = html[html.index('id="menu-perfil"'):]
        self.assertIn("Ana", menu)
        self.assertIn("ana@empresa.com", menu)
        self.assertIn(f'href="{reverse("minha_conta")}"', menu)
        self.assertIn(f'action="{reverse("sair")}"', menu)

    def test_icone_fica_ativo_na_pagina_minha_conta(self):
        self.client.force_login(self.user)
        html = self.client.get(reverse("minha_conta")).content.decode()
        self.assertIn('class="st-btn-perfil active"', html)

    def test_sair_so_com_post(self):
        self.client.force_login(self.user)
        self.client.get(reverse("sair"))
        self.assertIn("_auth_user_id", self.client.session)  # GET não desloga
        resp = self.client.post(reverse("sair"))
        self.assertRedirects(resp, reverse("home"), fetch_redirect_response=False)
        self.assertNotIn("_auth_user_id", self.client.session)


@override_settings(STORAGES=STORAGE_TESTE)
class SimuladoresTest(SimpleTestCase):
    def test_cards_simule_e_veja_com_icone_e_botao(self):
        html = self.client.get(reverse("simuladores")).content.decode()
        self.assertEqual(html.count('class="duo-icon"'), 2)
        self.assertIn('id="cardSimule"', html)
        self.assertIn('id="cardVeja"', html)
        self.assertIn(f'href="{reverse("diagnostico")}" class="duo-cta"', html)

    def test_fotos_dos_cards_existem(self):
        # o simuladores.css usa estas fotos quando o card é aberto
        for caminho in ["img/bg-simule.jpeg", "img/bg-entenda.jpeg"]:
            with self.subTest(arquivo=caminho):
                self.assertIsNotNone(finders.find(caminho), f"{caminho} não encontrado")


@override_settings(STORAGES=STORAGE_TESTE)
class QuemSomosTest(SimpleTestCase):
    SITE = "https://sites.google.com/cesar.school/projetos-2-g13/equipe"

    def test_mantem_o_texto_do_grupo(self):
        html = self.client.get(reverse("quem_somos")).content.decode()
        self.assertIn("14 estudantes da CESAR School", html)

    def test_leva_para_o_site_do_projeto_em_nova_aba(self):
        html = self.client.get(reverse("quem_somos")).content.decode()
        self.assertGreaterEqual(html.count(f'href="{self.SITE}" target="_blank" rel="noopener"'), 2)
        self.assertIn("img/qr-google-site.svg", html)

    def test_atalhos_levam_para_as_abas_do_site_do_projeto(self):
        html = self.client.get(reverse("quem_somos")).content.decode()
        base = "https://sites.google.com/cesar.school/projetos-2-g13"
        for aba in ["sr1", "sr2", "declara%C3%A7%C3%A3o-de-ia"]:
            with self.subTest(aba=aba):
                self.assertIn(f'href="{base}/{aba}" target="_blank" rel="noopener"', html)
        self.assertNotIn("<li>Equipe</li>", html)

    def test_nao_tem_mais_as_fotos_dos_membros(self):
        html = self.client.get(reverse("quem_somos")).content.decode()
        self.assertNotIn("st-member", html)

    def test_qr_code_existe_e_aponta_para_o_site(self):
        caminho = finders.find("img/qr-google-site.svg")
        self.assertIsNotNone(caminho, "img/qr-google-site.svg não encontrado")
        with open(caminho, encoding="utf-8") as f:
            self.assertIn(self.SITE, f.read())


def relatorio_exemplo(**troca):
    """Dados no formato que o diagnóstico manda (e que o PDF embute)."""
    dados = {
        "v": 1, "empresa": "Têxtil Mangue", "ano": 2025, "gerado": "2026-11-18T12:00:00Z",
        "geral": 50,
        "pilares": {"ambiente": 40, "social": 60, "governanca": None, "lucro": 80},
        "itens": [
            {"c": "agua_reuso", "p": "ambiente", "tm": "Água", "t": "Reuso de água?", "a": "Até 10%", "s": 30},
            {"c": "clima", "p": "social", "tm": "Pessoas", "t": "Pesquisa de clima?", "a": "Anualmente", "s": 100},
        ],
    }
    dados.update(troca)
    return dados


@override_settings(STORAGES=STORAGE_TESTE)
class BibliotecaDeRelatoriosTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="ana@empresa.com", email="ana@empresa.com",
                                             password="senhaforte1", first_name="Ana")
        self.outra = User.objects.create_user(username="bia@empresa.com", email="bia@empresa.com", password="senhaforte1")

    def salvar(self, dados):
        return self.client.post(reverse("salvar_relatorio"), data=json.dumps(dados), content_type="application/json")

    def test_salvar_exige_login(self):
        resp = self.salvar(relatorio_exemplo())
        self.assertEqual(resp.status_code, 401)
        self.assertFalse(Relatorio.objects.exists())

    def test_salvar_guarda_e_recalcula_a_nota_geral(self):
        self.client.force_login(self.user)
        resp = self.salvar(relatorio_exemplo(geral=99))  # nota geral errada de propósito
        self.assertEqual(resp.status_code, 201)
        r = Relatorio.objects.get()
        self.assertEqual((r.user, r.empresa, r.ano), (self.user, "Têxtil Mangue", 2025))
        self.assertEqual(r.geral, 60)  # média de 40, 60 e 80 (governança sem dados)
        self.assertEqual(r.dados["pilares"]["governanca"], None)
        self.assertEqual(len(r.dados["itens"]), 2)

    def test_dados_invalidos_sao_recusados(self):
        self.client.force_login(self.user)
        sem_pilares = {"ambiente": None, "social": None, "governanca": None, "lucro": None}
        casos = {
            "nota acima de 100": relatorio_exemplo(pilares={"ambiente": 140, "social": 1, "governanca": 1, "lucro": 1}),
            "nenhum pilar": relatorio_exemplo(pilares=sem_pilares),
            "item de pilar desconhecido": relatorio_exemplo(itens=[{"c": "x", "p": "outro", "s": 10}]),
            "nota em texto": relatorio_exemplo(pilares={"ambiente": "50", "social": 1, "governanca": 1, "lucro": 1}),
        }
        for nome, dados in casos.items():
            with self.subTest(caso=nome):
                self.assertEqual(self.salvar(dados).status_code, 400)
        resp = self.client.post(reverse("salvar_relatorio"), data="isso não é json", content_type="application/json")
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(self.client.get(reverse("salvar_relatorio")).status_code, 405)
        self.assertFalse(Relatorio.objects.exists())

    def test_minha_conta_mostra_a_biblioteca_e_a_comparacao(self):
        self.client.force_login(self.user)
        html = self.client.get(reverse("minha_conta")).content.decode()
        self.assertIn("st-conta-vazio", html)
        self.assertNotIn('id="comparacao"', html)

        self.salvar(relatorio_exemplo(ano=2024))
        html = self.client.get(reverse("minha_conta")).content.decode()
        self.assertEqual(html.count('class="st-rel-item"'), 1)
        self.assertNotIn('id="comparacao"', html)  # a evolução só aparece com 2 ou mais

        self.salvar(relatorio_exemplo(ano=2025))
        html = self.client.get(reverse("minha_conta")).content.decode()
        self.assertEqual(html.count('class="st-rel-item"'), 2)
        self.assertIn('id="comparacao"', html)
        self.assertIn('id="cmp-onda"', html)
        self.assertIn('id="relatorios-dados"', html)

    def test_minha_conta_nao_tem_mais_o_formulario_de_dados(self):
        self.client.force_login(self.user)
        html = self.client.get(reverse("minha_conta")).content.decode()
        self.assertNotIn('name="empresa"', html)
        self.assertIn(f'action="{reverse("excluir_conta")}"', html)  # excluir conta continua lá

    def test_cada_um_ve_so_os_seus_relatorios(self):
        Relatorio.objects.create(user=self.outra, empresa="Outra", ano=2025, geral=50,
                                 dados=relatorio_exemplo(empresa="Outra"))
        self.client.force_login(self.user)
        html = self.client.get(reverse("minha_conta")).content.decode()
        self.assertNotIn("Outra", html)

    def test_excluir_relatorio(self):
        meu = Relatorio.objects.create(user=self.user, empresa="Minha", geral=50, dados=relatorio_exemplo())
        dela = Relatorio.objects.create(user=self.outra, empresa="Dela", geral=50, dados=relatorio_exemplo())
        self.client.force_login(self.user)
        self.assertEqual(self.client.post(reverse("excluir_relatorio", args=[dela.id])).status_code, 404)
        resp = self.client.post(reverse("excluir_relatorio", args=[meu.id]))
        self.assertRedirects(resp, reverse("minha_conta") + "#biblioteca", fetch_redirect_response=False)
        self.assertEqual(list(Relatorio.objects.values_list("empresa", flat=True)), ["Dela"])

    def test_excluir_a_conta_apaga_os_relatorios(self):
        Relatorio.objects.create(user=self.user, empresa="Minha", geral=50, dados=relatorio_exemplo())
        self.client.force_login(self.user)
        self.client.post(reverse("excluir_conta"), {"confirmar": "on"})
        self.assertFalse(Relatorio.objects.filter(empresa="Minha").exists())

    def test_comparador_so_tem_os_dois_arquivos_e_os_botoes(self):
        html = self.client.get(reverse("comparador_pdf")).content.decode()
        self.assertEqual(html.count('class="cmp-zona"'), 2)
        self.assertIn('id="comparar"', html)
        self.assertIn(f'href="{reverse("diagnostico")}"', html)
        self.assertNotIn("cmp-resultado", html)          # o resultado vai para o PDF
        self.assertIn("jspdf.umd.min.js", html)
        self.assertIn("js/relatorio-pdf.js", html)

    def test_diagnostico_sabe_onde_salvar_e_gera_pdf_de_verdade(self):
        self.client.force_login(self.user)
        html = self.client.get(reverse("diagnostico")).content.decode()
        self.assertIn(f'data-salvar-url="{reverse("salvar_relatorio")}"', html)
        self.assertIn("jspdf.umd.min.js", html)
        self.assertIn("js/relatorio-pdf.js", html)


class EstaticosTest(SimpleTestCase):
    def test_base_css_existe(self):
        self.assertIsNotNone(finders.find("css/base.css"), "css/base.css não encontrado")

    def test_arquivos_da_biblioteca_existem(self):
        for caminho in ["js/relatorio-pdf.js", "js/minha-conta.js", "css/conta.css"]:
            with self.subTest(arquivo=caminho):
                self.assertIsNotNone(finders.find(caminho), f"{caminho} não encontrado")

    def test_logos_novas_existem(self):
        for caminho in LOGOS:
            with self.subTest(arquivo=caminho):
                self.assertIsNotNone(finders.find(caminho), f"{caminho} não encontrado")

# ------------------------------------------------------------------
# Erros nos formulários, avisos e confirmações
# ------------------------------------------------------------------
@override_settings(STORAGES=STORAGE_TESTE)
class ErrosEAvisosTest(TestCase):
    def contato(self, **troca):
        dados = {"tem_empresa": "nao", "nome": "Ana", "email": "ana@empresa.com", "telefone": "",
                 "assunto": "Perguntas relacionadas a ESG", "assunto_outro": "", "mensagem": "Oi"}
        dados.update(troca)
        return dados

    def test_contato_valido_salva_e_avisa_com_pop_up(self):
        from .models import Contato
        resp = self.client.post(reverse("contato"), self.contato(), follow=True)
        self.assertEqual(Contato.objects.count(), 1)
        self.assertContains(resp, "st-aviso--sucesso")
        self.assertContains(resp, "Mensagem enviada!")

    def test_contato_com_erro_marca_o_campo_e_guarda_o_que_foi_digitado(self):
        from .models import Contato
        resp = self.client.post(reverse("contato"), self.contato(email="sem-arroba", mensagem=""))
        self.assertEqual(Contato.objects.count(), 0)
        html = resp.content.decode()
        self.assertIn('id="email-erro"', html)
        self.assertIn('id="mensagem-erro"', html)
        self.assertIn("Digite um e-mail válido", html)
        self.assertIn('value="Ana"', html)                      # não perde o que digitou
        self.assertIn("Confira os 2 campos destacados em vermelho.", html)

    def test_contato_nome_grande_nao_quebra(self):
        resp = self.client.post(reverse("contato"), self.contato(nome="A" * 300))
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "no máximo 100 caracteres")

    def test_contato_telefone_e_assunto_outros(self):
        resp = self.client.post(reverse("contato"), self.contato(telefone="12", assunto="outros"))
        self.assertContains(resp, 'id="telefone-erro"')
        self.assertContains(resp, 'id="input_assunto_outro-erro"')

    def test_cadastro_marca_so_o_campo_com_erro(self):
        self.client.post(reverse("cadastrar"), {"nome": "Ana", "email": "ana@x.com", "senha": "senhaforte1",
                                                "confirmar": "outra12345", "voltar": reverse("home")})
        html = self.client.get(reverse("home")).content.decode()
        self.assertIn('id="cad-confirmar-erro"', html)
        self.assertEqual(html.count('class="st-campo-erro"'), 1)

    def test_login_errado_marca_email_e_senha(self):
        self.client.post(reverse("entrar"), {"email": "x@x.com", "senha": "errada123", "voltar": reverse("home")})
        html = self.client.get(reverse("home")).content.decode()
        self.assertEqual(html.count('class="st-campo-erro"'), 2)

    def test_excluir_conta_sem_confirmar_nao_apaga(self):
        user = User.objects.create_user(username="a@a.com", email="a@a.com", password="senhaforte1")
        self.client.force_login(user)
        self.client.post(reverse("excluir_conta"))
        self.assertTrue(User.objects.filter(pk=user.pk).exists())
        html = self.client.get(reverse("minha_conta")).content.decode()
        self.assertIn("Confirme a exclusão", html)
        self.assertIn('data-confirmar-envia="confirmar"', html)   # o pop-up do site manda a confirmação

    def test_minha_conta_nome_grande_nao_quebra(self):
        user = User.objects.create_user(username="b@b.com", email="b@b.com", password="senhaforte1")
        self.client.force_login(user)
        resp = self.client.post(reverse("minha_conta"), {"nome": "B" * 300}, follow=True)
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "no máximo 150 caracteres")

    def test_todas_as_paginas_carregam_o_script_de_avisos(self):
        self.assertIsNotNone(finders.find("js/stitch-ui.js"))
        for nome in PAGINAS:
            with self.subTest(pagina=nome):
                self.assertIn("js/stitch-ui.js", self.client.get(reverse(nome)).content.decode())

    def test_botao_da_simulacao_leva_ao_diagnostico(self):
        html = self.client.get(reverse("simuladores")).content.decode()
        self.assertIn("Diagnostique sua empresa", html)
        self.assertNotIn("Simule com seus dados reais", html)

    def test_comentario_do_template_nao_aparece_na_pagina(self):
        # {# ... #} de várias linhas não é comentário no Django: aparece como texto
        user = User.objects.create_user(username="c@c.com", email="c@c.com", password="senhaforte1")
        self.client.force_login(user)
        for nome in PAGINAS + ["minha_conta", "diagnostico"]:
            with self.subTest(pagina=nome):
                self.assertNotIn("{#", self.client.get(reverse(nome)).content.decode())
