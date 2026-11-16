from django.shortcuts import render, redirect
from .models import Contato
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib import messages
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required

def home(request):
    return render(request, 'stitch/home.html')

def entenda_esg(request):
    return render(request, 'stitch/entenda_esg.html')

def quem_somos(request):
    return render(request, 'stitch/quem_somos.html')

def simuladores(request):
    return render(request, 'stitch/simuladores.html')

@login_required(login_url='home')
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

def entrar(request):
    if request.method == 'POST':
        email = request.POST.get('email', '').strip().lower()
        senha = request.POST.get('senha', '')
        user = authenticate(request, username=email, password=senha)
        if user is not None:
            login(request, user)
            return redirect('diagnostico')
        messages.error(request, 'E-mail ou senha incorretos.')
    return redirect('home')

def cadastrar(request):
    if request.method == 'POST':
        email = request.POST.get('email', '').strip().lower()
        senha = request.POST.get('senha', '')
        if not email or not senha:
            messages.error(request, 'Campos com * são obrigatórios.')
        elif User.objects.filter(username=email).exists():
            messages.error(request, 'Já existe uma conta com este e-mail.')
        else:
            user = User.objects.create_user(username=email, email=email, password=senha)
            login(request,user)
            return redirect('diagnostico')
    return redirect('home')

def sair(request):
    logout(request)
    return redirect('home')