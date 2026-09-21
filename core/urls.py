from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('tarefas/', include('tarefas.urls')),
    path('', include('paginas.urls')),
]