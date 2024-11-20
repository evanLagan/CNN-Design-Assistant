from django.urls import path
from . import views
from .views import DatasetUploadView
from .views import DatasetStructureView
from .views import DatasetDeleteView

urlpatterns = [
    path('test-tensorflow/', views.test_tensorflow, name='test_tensorflow'),
    
    path('datasets/', DatasetUploadView.as_view(), name='dataset_upload'),

    path('datasets/<int:dataset_id>/structure/', DatasetStructureView.as_view(), name='dataset_structure'),

    path('datasets/<int:dataset_id>/', DatasetDeleteView.as_view(), name='dataset_delete'),

  

]