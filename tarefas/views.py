from django.shortcuts import render
from .models import Tarefa


def lista_tarefas(request):
    tarefas = Tarefa.objects.all().order_by('-data_criacao')
    return render(request, 'tarefas/lista.html', {'tarefas': tarefas})
