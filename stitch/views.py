from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.utils.http import url_has_allowed_host_and_scheme
from .models import Contato, Perfil

def home(request):
    return render(request, 'stitch/home.html')

def entenda_esg(request):
    return render(request, 'stitch/entenda_esg.html')

def quem_somos(request):
    return render(request, 'stitch/quem_somos.html')

def simuladores(request):
    return render(request, 'stitch/simuladores.html')

@login_required(login_url='entrar')
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

def _destino(request):
    proximo = request.POST.get('next') or request.GET.get('next')
    if proximo and url_has_allowed_host_and_scheme(proximo, allowed_hosts={request.get_host()}):
        return proximo
    return 'minha_conta'


def entrar(request):
    proximo = request.POST.get('next') or request.GET.get('next', '')
    email = ''
    if request.method == 'POST':
        email = request.POST.get('email', '').strip().lower()
        senha = request.POST.get('senha', '')
        user = authenticate(request, username=email, password=senha)
        if user is not None:
            login(request, user)
            return redirect(_destino(request))
        messages.error(request, 'E-mail ou senha incorretos.')
    return render(request, 'stitch/entrar.html', {'next': proximo, 'email': email})


def cadastrar(request):
    proximo = request.POST.get('next') or request.GET.get('next', '')
    if request.method == 'POST':
        nome = request.POST.get('nome', '').strip()
        email = request.POST.get('email', '').strip().lower()
        senha = request.POST.get('senha', '')
        empresa = request.POST.get('empresa', '').strip()
        if not nome or not email or not senha:
            messages.error(request, 'Campos com * são obrigatórios.')
        elif User.objects.filter(username=email).exists():
            messages.error(request, 'Já existe uma conta com este e-mail.')
        else:
            user = User.objects.create_user(username=email, email=email, password=senha, first_name=nome)
            Perfil.objects.create(user=user, empresa=empresa)
            login(request, user)
            return redirect(_destino(request))
    return render(request, 'stitch/cadastrar.html', {'next': proximo, 'dados': request.POST})

def sair(request):
    logout(request)
    return redirect('home')

@login_required(login_url='entrar')
def minha_conta(request):
    perfil, _ = Perfil.objects.get_or_create(user=request.user)
    if request.method == 'POST':
        request.user.first_name = request.POST.get('nome', '').strip()
        request.user.save()
        perfil.empresa = request.POST.get('empresa', '').strip()
        perfil.save()
        return redirect('minha_conta')
    return render(request, 'stitch/minha_conta.html', {'perfil': perfil})

@login_required(login_url='entrar')
def meu_perfil(request):
    return render(request, 'stitch/meu_perfil.html')

@login_required(login_url='entrar')
def excluir_conta(request):
    if request.method == 'POST':
        user = request.user
        logout(request)
        user.delete()
    return redirect('home')