from django.urls import path
from . import views

urlpatterns = [
    path('test-tensorflow/', views.test_tensorflow, name='test_tensorflow'),
]