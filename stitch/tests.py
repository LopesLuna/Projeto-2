"""Testes automatizados do site Stitch (rodam na pipeline do GitHub Actions).

Não dependem de banco de dados: só conferem que as páginas respondem e que
os elementos principais estão presentes.
Rodar localmente:  python manage.py test
"""
import re

from django.contrib.staticfiles import finders
from django.test import SimpleTestCase, override_settings
from django.urls import reverse

PAGINAS = ["home", "entenda_esg", "simuladores", "quem_somos", "contato"]

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


class EstaticosTest(SimpleTestCase):
    def test_base_css_existe(self):
        self.assertIsNotNone(finders.find("css/base.css"), "css/base.css não encontrado")