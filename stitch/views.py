import json
import re
from functools import wraps
from urllib.parse import urlparse

from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.http import require_POST

from .models import PILARES, Contato, Perfil, Relatorio

SENHA_MINIMA = 8


# ------------------------------------------------------------------
# Login: ajudantes
# ------------------------------------------------------------------
def _url_segura(request, url, padrao='home'):
    """Só aceita endereços do próprio site (evita redirecionar para fora)."""
    if url and url_has_allowed_host_and_scheme(
        url, allowed_hosts={request.get_host()}, require_https=request.is_secure()
    ):
        return url
    return reverse(padrao)


def _abrir_popup_login(request, aba='entrar', **dados):
    """Pede para a próxima página abrir o popup de login já na aba certa,
    com aviso, erro e campos preenchidos (lido em templatetags/stitch_login.py)."""
    request.session['popup_login'] = {'aba': aba, **dados}


def login_obrigatorio(aviso):
    """Como o login_required, mas em vez de só mandar para a home:
    volta para a página onde a pessoa estava, abre o popup de login com o aviso
    e, depois que ela entrar ou criar a conta, leva para a página que ela queria."""
    def decorador(view):
        @wraps(view)
        def envolvida(request, *args, **kwargs):
            if request.user.is_authenticated:
                return view(request, *args, **kwargs)
            request.session['login_proximo'] = request.get_full_path()
            _abrir_popup_login(request, 'entrar', aviso=aviso)
            origem = request.META.get('HTTP_REFERER')
            # se a origem for a própria página protegida, volta para a home (sem loop)
            if origem and urlparse(origem).path == request.path:
                origem = None
            return redirect(_url_segura(request, origem))
        return envolvida
    return decorador


# ------------------------------------------------------------------
# Páginas
# ------------------------------------------------------------------
def home(request):
    # quem está logado vê "Bem-vindo(a) de volta, <primeiro nome>!" no lugar do título da capa
    primeiro_nome = ''
    if request.user.is_authenticated:
        partes = (request.user.first_name or '').split()
        primeiro_nome = partes[0] if partes else ''
    return render(request, 'stitch/home.html', {'primeiro_nome': primeiro_nome})

def entenda_esg(request):
    return render(request, 'stitch/entenda_esg.html')

def quem_somos(request):
    return render(request, 'stitch/quem_somos.html')

def simuladores(request):
    return render(request, 'stitch/simuladores.html')

@login_obrigatorio('Faça login ou crie uma conta para acessar o diagnóstico.')
def questionario(request):
    return render(request, "stitch/diagnostico.html")


ASSUNTOS_CONTATO = [
    'Dúvida sobre os Simuladores',
    'Privacidade e Uso de Dados',
    'Perguntas relacionadas a ESG',
    'outros',
]


def _erros_do_contato(d):
    """Confere o formulário de contato. Devolve {campo: mensagem curta}.
    O navegador já avisa antes de enviar; aqui é a garantia (e o que vale sem JavaScript)."""
    erros = {}
    if not d['nome']:
        erros['nome'] = 'Digite seu nome.'
    elif len(d['nome']) > 100:
        erros['nome'] = 'Use no máximo 100 caracteres.'
    if not d['email']:
        erros['email'] = 'Digite seu e-mail.'
    else:
        try:
            validate_email(d['email'])
        except ValidationError:
            erros['email'] = 'Digite um e-mail válido, como nome@empresa.com.'
    if d['telefone']:
        digitos = re.sub(r'\D', '', d['telefone'])
        if not 10 <= len(digitos) <= 13 or len(d['telefone']) > 20:
            erros['telefone'] = 'Digite o número com DDD. Ex.: (81) 99999-9999.'
    if d['assunto'] not in ASSUNTOS_CONTATO:
        erros['assunto'] = 'Escolha o assunto.'
    elif d['assunto'] == 'outros' and not d['assunto_outro']:
        erros['assunto_outro'] = 'Diga sobre o que é o contato.'
    if not d['mensagem']:
        erros['mensagem'] = 'Escreva sua mensagem.'
    if len(d['empresa']) > 150:
        erros['empresa'] = 'Use no máximo 150 caracteres.'
    if len(d['assunto_outro']) > 100:
        erros['assunto_outro'] = 'Use no máximo 100 caracteres.'
    return erros


def contato(request):
    if request.method != 'POST':
        return render(request, 'stitch/contato.html', {'dados': {}, 'erros': {}})

    campos = ['tem_empresa', 'empresa', 'nome', 'email', 'telefone', 'assunto', 'assunto_outro', 'mensagem']
    dados = {c: request.POST.get(c, '').strip() for c in campos}
    if dados['tem_empresa'] == 'nao':
        dados['empresa'] = ''
    erros = _erros_do_contato(dados)
    if erros:
        # devolve a página com o que a pessoa digitou e os campos com erro marcados
        total = len(erros)
        messages.error(request, 'Confira o campo destacado em vermelho.' if total == 1
                       else f'Confira os {total} campos destacados em vermelho.')
        return render(request, 'stitch/contato.html', {'dados': dados, 'erros': erros})

    assunto = dados['assunto_outro'] if dados['assunto'] == 'outros' else dados['assunto']
    Contato.objects.create(
        nome=dados['nome'],
        empresa=dados['empresa'],
        email=dados['email'].lower(),
        telefone=dados['telefone'],
        assunto=assunto,
        mensagem=dados['mensagem'],
    )
    messages.success(request, 'Mensagem enviada! Vamos responder no seu e-mail em breve.')
    # redireciona para o F5 não reenviar a mensagem
    return redirect('contato')


def comparador_pdf(request):
    return render(request, 'stitch/comparador_pdf.html')


# ------------------------------------------------------------------
# Conta
# ------------------------------------------------------------------
def entrar(request):
    if request.method != 'POST':
        return redirect('home')
    voltar = _url_segura(request, request.POST.get('voltar'))
    email = request.POST.get('email', '').strip().lower()
    senha = request.POST.get('senha', '')

    user = authenticate(request, username=email, password=senha)
    if user is None:
        _abrir_popup_login(request, 'entrar', erro='E-mail ou senha incorretos.', email=email,
                           campos=['email', 'senha'])
        return redirect(voltar)

    proximo = request.session.pop('login_proximo', None)
    login(request, user)
    return redirect(_url_segura(request, proximo, 'diagnostico'))


def _erro_no_cadastro(nome, email, senha, confirmar):
    """Devolve (mensagem, campos com erro) ou (None, []).
    Com um campo só, a mensagem aparece embaixo dele; com vários, no topo do popup."""
    vazios = [c for c, v in (('nome', nome), ('email', email), ('senha', senha), ('confirmar', confirmar)) if not v]
    if vazios:
        return 'Preencha todos os campos.', vazios
    try:
        validate_email(email)
    except ValidationError:
        return 'Digite um e-mail válido, como nome@empresa.com.', ['email']
    if len(senha) < SENHA_MINIMA:
        return f'A senha precisa ter pelo menos {SENHA_MINIMA} caracteres.', ['senha']
    if senha.isdigit():
        return 'A senha não pode ter só números.', ['senha']
    if senha != confirmar:
        return 'As senhas não são iguais.', ['confirmar']
    if User.objects.filter(username=email).exists():
        return 'Já existe uma conta com este e-mail. Use a aba Entrar.', ['email']
    return None, []


def cadastrar(request):
    if request.method != 'POST':
        return redirect('home')
    voltar = _url_segura(request, request.POST.get('voltar'))
    nome = request.POST.get('nome', '').strip()[:150]
    email = request.POST.get('email', '').strip().lower()
    senha = request.POST.get('senha', '')
    confirmar = request.POST.get('confirmar', '')

    erro, campos = _erro_no_cadastro(nome, email, senha, confirmar)
    if erro:
        _abrir_popup_login(request, 'cadastro', erro=erro, nome=nome, email=email, campos=campos)
        return redirect(voltar)

    user = User.objects.create_user(username=email, email=email, password=senha, first_name=nome)
    Perfil.objects.get_or_create(user=user)
    proximo = request.session.pop('login_proximo', None)
    login(request, user)
    messages.success(request, f'Conta criada! Boas-vindas ao Stitch, {nome}.')
    return redirect(_url_segura(request, proximo, 'diagnostico'))


def sair(request):
    # só sai com POST (o botão "Sair" do menu da conta é um formulário):
    # assim um link de outro site não consegue deslogar a pessoa
    if request.method == 'POST':
        logout(request)
    return redirect('home')

@login_obrigatorio('Faça login para acessar a sua conta.')
def minha_conta(request):
    perfil, _ = Perfil.objects.get_or_create(user=request.user)
    if request.method == 'POST':
        nome = request.POST.get('nome', '').strip()
        empresa = request.POST.get('empresa', '').strip()
        if not nome:
            messages.error(request, 'Digite seu nome para salvar.')
        elif len(nome) > 150 or len(empresa) > 150:
            messages.error(request, 'Use no máximo 150 caracteres no nome e na empresa.')
        else:
            request.user.first_name = nome
            request.user.save()
            perfil.empresa = empresa
            perfil.save()
            messages.success(request, 'Dados salvos.')
        return redirect('minha_conta')
    relatorios = list(request.user.relatorios.all())
    # dados de cada relatório para o navegador gerar o PDF de novo e montar o gráfico
    relatorios_json = [
        {**r.dados, 'id': r.id, 'criado_em': r.criado_em.isoformat()} for r in relatorios
    ]
    return render(request, 'stitch/minha_conta.html', {
        'perfil': perfil,
        'relatorios': relatorios,
        'relatorios_json': relatorios_json,
    })


# ------------------------------------------------------------------
# Biblioteca de relatórios (PDFs do diagnóstico)
# ------------------------------------------------------------------
TAMANHO_MAXIMO_RELATORIO = 300_000  # bytes do JSON enviado pelo navegador
MAXIMO_DE_ITENS = 300


def _texto(valor, limite):
    return str(valor).strip()[:limite] if isinstance(valor, (str, int, float)) else ''


def _nota(valor):
    """Nota de 0 a 100 (arredondada) ou None. Qualquer outra coisa é inválida."""
    if valor is None:
        return None
    if isinstance(valor, bool) or not isinstance(valor, (int, float)) or not 0 <= valor <= 100:
        raise ValueError('nota fora de 0 a 100')
    return round(valor)


def _limpar_relatorio(bruto):
    """Confere e limpa os dados do relatório que vieram do navegador.
    A nota geral é recalculada aqui (não confiamos na que veio)."""
    if not isinstance(bruto, dict) or not isinstance(bruto.get('pilares'), dict):
        raise ValueError('formato inválido')
    pilares = {chave: _nota(bruto['pilares'].get(chave)) for chave, _ in PILARES}
    notas = [v for v in pilares.values() if v is not None]
    if not notas:
        raise ValueError('nenhum pilar respondido')

    itens_brutos = bruto.get('itens', [])
    if not isinstance(itens_brutos, list) or len(itens_brutos) > MAXIMO_DE_ITENS:
        raise ValueError('itens inválidos')
    chaves_pilares = {chave for chave, _ in PILARES}
    itens = []
    for item in itens_brutos:
        if not isinstance(item, dict) or item.get('p') not in chaves_pilares:
            raise ValueError('item inválido')
        nota = _nota(item.get('s'))
        if nota is None or not _texto(item.get('c'), 60):
            raise ValueError('item inválido')
        itens.append({
            'c': _texto(item['c'], 60), 'p': item['p'], 'tm': _texto(item.get('tm'), 80),
            't': _texto(item.get('t'), 400), 'a': _texto(item.get('a'), 200), 's': nota,
        })

    ano = bruto.get('ano')
    if not (isinstance(ano, int) and not isinstance(ano, bool) and 1900 <= ano <= 2100):
        ano = None
    versao = bruto.get('v')
    if not (isinstance(versao, int) and not isinstance(versao, bool) and 1 <= versao <= 999):
        versao = 1

    return {
        'v': versao,
        'empresa': _texto(bruto.get('empresa'), 150) or 'Sua empresa',
        'ano': ano,
        'gerado': _texto(bruto.get('gerado'), 40),
        'geral': round(sum(notas) / len(notas)),
        'pilares': pilares,
        'itens': itens,
    }


@require_POST
def salvar_relatorio(request):
    """Chamado pelo diagnóstico quando a pessoa baixa o PDF: guarda na biblioteca dela."""
    if not request.user.is_authenticated:
        return JsonResponse({'erro': 'Faça login para salvar o relatório.'}, status=401)
    if len(request.body) > TAMANHO_MAXIMO_RELATORIO:
        return JsonResponse({'erro': 'Relatório grande demais.'}, status=400)
    try:
        dados = _limpar_relatorio(json.loads(request.body))
    except (ValueError, TypeError):  # json.JSONDecodeError é um ValueError
        return JsonResponse({'erro': 'Não foi possível ler os dados do relatório.'}, status=400)

    relatorio = Relatorio.objects.create(
        user=request.user, empresa=dados['empresa'], ano=dados['ano'],
        versao=dados['v'], geral=dados['geral'], dados=dados,
    )
    return JsonResponse({'id': relatorio.id, 'biblioteca': reverse('minha_conta') + '#biblioteca'}, status=201)


@login_obrigatorio('Faça login para acessar a sua conta.')
@require_POST
def excluir_relatorio(request, pk):
    # só encontra relatórios da própria pessoa: o de outra conta dá 404
    get_object_or_404(Relatorio, pk=pk, user=request.user).delete()
    messages.success(request, 'Relatório excluído da sua biblioteca.')
    return redirect(reverse('minha_conta') + '#biblioteca')

@login_obrigatorio('Faça login para acessar a sua conta.')
def excluir_conta(request):
    if request.method != 'POST':
        return redirect('minha_conta')
    if not request.POST.get('confirmar'):
        messages.error(request, 'Confirme a exclusão para apagar a conta.')
        return redirect('minha_conta')
    user = request.user
    logout(request)
    user.delete()
    messages.success(request, 'Sua conta e seus relatórios foram excluídos.')
    return redirect('home')
