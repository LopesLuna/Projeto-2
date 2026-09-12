from django.shortcuts import render, redirect
from .models import Tarefa


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
