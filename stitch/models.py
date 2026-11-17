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
        