from django.db import models
from django.contrib.auth.models import User

class Contato(models.Model):
    nome = models.CharField(max_length=100)
    empresa = models.CharField(max_length=150, blank=True, null=True)
    email = models.EmailField()
    telefone = models.CharField(max_length=20, blank=True)
    assunto = models.CharField(max_length=100)
    mensagem = models.TextField()
    data_envio = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # Se tiver empresa, mostra seu nome; caso contrário, mostra o nome da pessoa
        identificacao = self.empresa if self.empresa else self.nome
        return f"{identificacao} - {self.assunto}"

class Perfil(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    empresa = models.CharField(max_length=150, blank=True)

    def __str__(self):
        return self.user.email


# Faixas de nota usadas no diagnóstico, no PDF e no comparador (mesmos limites do questionario.js)
FAIXAS = [
    (24, 'critico', 'Crítico'),
    (44, 'preocupante', 'Preocupante'),
    (74, 'estavel', 'Estável'),
    (100, 'excelente', 'Excelente'),
]
PILARES = [
    ('ambiente', 'Meio ambiente'),
    ('social', 'Social'),
    ('governanca', 'Governança'),
    ('lucro', 'Lucro'),
]


def faixa_da_nota(valor):
    """Devolve (slug, rótulo) da faixa de uma nota de 0 a 100, ou ('sem-dados', 'Sem dados')."""
    if valor is None:
        return 'sem-dados', 'Sem dados'
    for limite, slug, rotulo in FAIXAS:
        if valor <= limite:
            return slug, rotulo
    return FAIXAS[-1][1], FAIXAS[-1][2]


class Relatorio(models.Model):
    """Um diagnóstico ESG concluído e baixado em PDF pela pessoa.

    Guardamos os dados (e não o arquivo): o PDF é gerado de novo no navegador
    quando a pessoa baixa pela biblioteca, sempre igual ao original.
    """
    # id explícito: a migração fica igual qualquer que seja o DEFAULT_AUTO_FIELD do settings
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='relatorios')
    criado_em = models.DateTimeField(auto_now_add=True)
    empresa = models.CharField(max_length=150)
    ano = models.PositiveSmallIntegerField(null=True, blank=True)
    versao = models.PositiveSmallIntegerField(default=1)
    geral = models.PositiveSmallIntegerField(null=True, blank=True)
    dados = models.JSONField()

    class Meta:
        ordering = ['-criado_em', '-id']

    def __str__(self):
        return f"{self.empresa} ({self.ano or 'sem ano'}) - {self.user.email}"

    @property
    def estado_geral(self):
        slug, rotulo = faixa_da_nota(self.geral)
        return {'slug': slug, 'rotulo': rotulo}

    @property
    def pilares(self):
        valores = (self.dados or {}).get('pilares', {})
        lista = []
        for chave, nome in PILARES:
            valor = valores.get(chave)
            slug, rotulo = faixa_da_nota(valor)
            lista.append({'chave': chave, 'nome': nome, 'valor': valor, 'slug': slug, 'rotulo': rotulo})
        return lista
