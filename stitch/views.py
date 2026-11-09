from django.shortcuts import render, redirect
from .models import Contato
from django.shortcuts import render, redirect




def home(request):
    return render(request, 'stitch/home.html')

def entenda_esg(request):
    return render(request, 'stitch/entenda_esg.html')

def quem_somos(request):
    return render(request, 'stitch/quem_somos.html')

def simuladores(request):
    return render(request, 'stitch/simuladores.html')

def questionario(request):
    return render(request, "stitch/diagnostico.html")
    
    
def contato(request):
    enviado = False
    if request.method == 'POST':
        nome = request.POST.get('nome')
        empresa = request.POST.get('empresa')
        email = request.POST.get('email')
        telefone = request.POST.get('telefone')

        assunto = request.POST.get('assunto')
        if assunto and assunto.lower() == 'outros':
            assunto = request.POST.get('assunto_outro')

        mensagem = request.POST.get('mensagem')

        if nome and email and assunto and mensagem:
            Contato.objects.create(
                nome=nome,
                empresa=empresa,
                email=email,
                telefone=telefone,
                assunto=assunto,
                mensagem=mensagem,
            )
            enviado = True
    return render(request, 'stitch/contato.html', {'enviado': enviado})


def comparador_pdf(request):
    return render(request, 'stitch/comparador_pdf.html')
