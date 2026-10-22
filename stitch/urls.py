from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('quem-somos/', views.quem_somos, name='quem_somos'),
    path('contato/', views.contato, name='contato'),
    path('simuladores/', views.simuladores, name='simuladores'),
    path('entenda-esg/', views.entenda_esg, name='entenda_esg'),
]