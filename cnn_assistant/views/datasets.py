from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework import status
import zipfile
import os
from django.conf import settings
import shutil
from ..models import Dataset


class DatasetUploadView(APIView):
    parser_classes = [MultiPartParser]

    def get(self, request):
        datasets = Dataset.objects.all()
        data = [{"id": dataset.id, "name": dataset.name, "root_directory": dataset.root_directory} for dataset in datasets]
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        dataset_file = request.FILES.get('file')

        if not dataset_file:
            return Response({"error": "Dataset name and file are required"}, status=status.HTTP_400_BAD_REQUEST)

        dataset_name = os.path.splitext(dataset_file.name)[0]

        temp_path = os.path.join(settings.MEDIA_ROOT, 'temp.zip')
        with open(temp_path, 'wb') as f:
            for chunk in dataset_file.chunks():
                f.write(chunk)

        extract_path = os.path.join(settings.MEDIA_ROOT, 'datasets', dataset_name)
        os.makedirs(extract_path, exist_ok=True)
        with zipfile.ZipFile(temp_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)

        os.remove(temp_path)

        dataset = Dataset.objects.create(name=dataset_name, root_directory=extract_path)
        return Response({"message": "Dataset uploaded successfully", "id": dataset.id}, status=status.HTTP_201_CREATED)


class DatasetStructureView(APIView):
    def get(self, request, dataset_id):
        try:
            dataset = Dataset.objects.get(id=dataset_id)
            structure = []

            for root, dirs, files in os.walk(dataset.root_directory):
                relative_path = os.path.relpath(root, dataset.root_directory)
                if relative_path == '.':
                    relative_path = os.path.basename(dataset.root_directory)

                structure.append({
                    "path": relative_path,
                    "directories": dirs,
                    "files": files
                })

            return Response(structure, status=status.HTTP_200_OK)
        except Dataset.DoesNotExist:
            return Response({"error": "Dataset not found"}, status=status.HTTP_404_NOT_FOUND)


class DatasetDeleteView(APIView):
    def delete(self, request, dataset_id):
        try:
            dataset = Dataset.objects.get(id=dataset_id)
            shutil.rmtree(dataset.root_directory, ignore_errors=True)
            dataset.delete()
            return Response({"message": "Dataset deleted successfully"}, status=status.HTTP_200_OK)
        except Dataset.DoesNotExist:
            return Response({"error": "Dataset not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
