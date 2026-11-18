"""Tag usada no base.html para montar o popup de login.

As views de login e cadastro (e as páginas que exigem login) guardam na sessão
o que o popup deve mostrar na próxima página: qual aba abrir, um aviso, um erro
e os campos já digitados. A tag lê esses dados uma única vez e apaga da sessão,
para o popup não reabrir sozinho nas páginas seguintes.
"""
from django import template

register = template.Library()


@register.simple_tag(takes_context=True)
def popup_login(context):
    request = context.get('request')
    sessao = getattr(request, 'session', None)
    if sessao is None:
        return {}
    return sessao.pop('popup_login', {})
