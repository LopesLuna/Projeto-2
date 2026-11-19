from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('quem-somos/', views.quem_somos, name='quem_somos'),
    path('contato/', views.contato, name='contato'),
    path('simuladores/', views.simuladores, name='simuladores'),
    path('entenda-esg/', views.entenda_esg, name='entenda_esg'),
    path('diagnostico/', views.questionario, name='diagnostico'),
    path('comparador_pdf/', views.comparador_pdf, name= 'comparador_pdf'),
    path('entrar/', views.entrar, name='entrar'),
    path('cadastrar/', views.cadastrar, name='cadastrar'),
    path('sair/', views.sair, name='sair'),
    path('minha-conta/', views.minha_conta, name='minha_conta'),
    path('minha-conta/excluir/', views.excluir_conta, name='excluir_conta'),
    path('minha-conta/relatorios/', views.salvar_relatorio, name='salvar_relatorio'),
    path('minha-conta/relatorios/<int:pk>/excluir/', views.excluir_relatorio, name='excluir_relatorio'),
]