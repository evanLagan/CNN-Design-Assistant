from django.urls import path
from .views.datasets import DatasetUploadView, DatasetStructureView, DatasetDeleteView
from .views.training import train_model



urlpatterns = [
    path('datasets/', DatasetUploadView.as_view(), name='dataset_upload'),

    path('datasets/<int:dataset_id>/structure/', DatasetStructureView.as_view(), name='dataset_structure'),

    path('datasets/<int:dataset_id>/', DatasetDeleteView.as_view(), name='dataset_delete'),

    path('train-model/', train_model, name='train-model'),

]