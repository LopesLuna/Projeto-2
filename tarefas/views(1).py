from django.shortcuts import render, redirect
from .models import Tarefa, Sugestao


def home(request):
    return render(request, 'tarefas/home.html')


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


def lista_tarefas(request):
    tarefas = Tarefa.objects.all().order_by('-data_criacao')
    return render(request, 'tarefas/lista.html', {'tarefas': tarefas})


def criar_tarefa(request):
    if request.method == 'POST':
        titulo = request.POST.get('titulo')
        descricao = request.POST.get('descricao')
        status = request.POST.get('status')
        responsavel = request.POST.get('responsavel')

        if titulo:
            Tarefa.objects.create(
                titulo=titulo,
                descricao=descricao,
                status=status,
                responsavel=responsavel,
            )
            return redirect('lista_tarefas')

    return render(request, 'tarefas/form.html')
