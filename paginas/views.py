from django.shortcuts import render, redirect
from .models import Sugestao


def home(request):
    return render(request, 'paginas/home.html')


def equipe(request):
    return render(request, 'paginas/equipe.html')


def fale_conosco(request):
    if request.method == 'POST':
        nome = request.POST.get('nome')
        email = request.POST.get('email')
        telefone = request.POST.get('telefone')
        assunto = request.POST.get('assunto')
        mensagem = request.POST.get('mensagem')

        Sugestao.objects.create(
            nome=nome,
            email=email,
            telefone=telefone,
            assunto=assunto,
            mensagem=mensagem,
        )
        return redirect('paginas:fale_conosco')

    return render(request, 'paginas/fale_conosco.html')