from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('entenda-esg/', views.entenda_esg, name='entenda_esg'),
    path('simulacoes/', views.simulacoes, name='simulacoes'),
    path('quem-somos/', views.equipe, name='equipe'),
    path('entre-em-contato/', views.fale_conosco, name='fale_conosco'),
]