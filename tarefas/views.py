from django.shortcuts import render, redirect
from .models import Sugestao


def home(request):
    return render(request, 'tarefas/home.html')


def entenda_esg(request):
    return render(request, 'tarefas/entenda_esg.html')


def simulacoes(request):
    return render(request, 'tarefas/simulacoes.html')


def equipe(request):
    return render(request, 'tarefas/equipe.html')


def fale_conosco(request):
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