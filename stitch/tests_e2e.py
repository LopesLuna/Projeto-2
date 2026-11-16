"""Testes de sistema (E2E) com Selenium.

Abrem o site num Chrome de verdade (modo headless), como um usuario faria.
Rodar so os E2E:   python manage.py test --tag e2e
Rodar tudo:        python manage.py test
"""
from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from django.test import override_settings, tag
from django.urls import reverse
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


# Nos testes nao rodamos o collectstatic, entao o armazenamento com manifesto
# quebraria o {% static %} e a pagina daria 500. Usamos o simples.
STORAGE_TESTE = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}


@tag("e2e")
@override_settings(STORAGES=STORAGE_TESTE)
class SiteE2ETest(StaticLiveServerTestCase):

    @classmethod
    def setUpClass(cls):
        opts = Options()
        opts.add_argument("--headless=new")
        opts.add_argument("--no-sandbox")
        opts.add_argument("--disable-dev-shm-usage")
        opts.add_argument("--window-size=1366,900")
        cls.browser = webdriver.Chrome(options=opts)
        cls.browser.implicitly_wait(5)
        super().setUpClass()

    @classmethod
    def tearDownClass(cls):
        cls.browser.quit()
        super().tearDownClass()

    def test_home_abre_com_titulo_do_stitch(self):
        self.browser.get(self.live_server_url + reverse("home"))
        self.assertIn("Stitch", self.browser.title)

    def test_menu_leva_para_entenda_esg(self):
        self.browser.get(self.live_server_url + reverse("home"))
        self.browser.find_element(By.LINK_TEXT, "Entenda ESG").click()
        destino = self.live_server_url + reverse("entenda_esg")
        WebDriverWait(self.browser, 10).until(EC.url_to_be(destino))
        self.assertEqual(self.browser.current_url, destino)
