from django.db import models

class Contato(models.Model):
    nome = models.CharField(max_length=100)
    empresa = models.CharField(max_length=150, blank=True, null=True)
    email = models.EmailField()
    telefone = models.CharField(max_length=20, blank=True)
    assunto = models.CharField(max_length=100)
    mensagem = models.TextField()
    data_envio = models.DateTimeField(auto_now_add=True)

    def __self__(self):
        # Se tiver empresa, mostra seu nome, caso contrário, mostra o nome da pessoa
        identificacao = self.empresa if self.empresa else self.none
        return f'{identificacao} - {self.assunto}'