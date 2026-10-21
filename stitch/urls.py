from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('quem-somos/', views.quem_somos, name='quem_somos'),
    path('contato/', views.contato, name='contato'),
    path('simulacao/', views.simuladores, name='simulacao'),
]