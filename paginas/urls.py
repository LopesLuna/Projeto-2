from django.urls import path
from . import views

app_name = 'paginas'
urlpatterns = [
    path('', views.home, name='home'),
    path('equipe/', views.equipe, name='equipe'),
    path('fale-conosco/', views.fale_conosco, name='fale_conosco'),
]