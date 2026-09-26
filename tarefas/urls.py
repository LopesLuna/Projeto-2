from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('equipe/', views.equipe, name='equipe'),
    path('fale-conosco/', views.fale_conosco, name='fale_conosco'),
    path('tarefas/', views.lista_tarefas, name='lista_tarefas'),
    path('tarefas/nova/', views.criar_tarefa, name='criar_tarefa'),
]
