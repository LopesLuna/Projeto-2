from django.urls import path
from . import views

urlpatterns = [
    path('', views.lista_tarefas, name='lista_tarefas'),
    path('nova/', views.criar_tarefa, name='criar_tarefa'),
]
