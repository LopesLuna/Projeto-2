from django.shortcuts import render, redirect
from .models import Tarefa, Sugestao


def home(request):
    return render(request, 'tarefas/home.html')

def quem_somos(request):
    return render(request, 'tarefas/quem_somos.html')


def contato(request):
    enviado = False
    if request.method == 'POST':
        nome = request.POST.get('nome')
        email = request.POST.get('email')
        telefone = request.POST.get('telefone')
        assunto = request.POST.get('assunto')
        mensagem = request.POST.get('mensagem')

        if nome and email and assunto and mensagem:
            Sugestao.objects.create(
                nome=nome,
                email=email,
                telefone=telefone,
                assunto=assunto,
                mensagem=mensagem,
            )
            enviado = True

    return render(request, 'tarefas/fale_conosco.html', {'enviado': enviado})

def simulacao(request):
    """Renderiza e processa o formulário do simulador (form.html)"""
    if request.method == 'POST':
        # Aqui entra a lógica de salvar os dados do formulário no banco
        pass

    return render(request, 'tarefas/form.html')