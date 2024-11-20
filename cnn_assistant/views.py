from django.shortcuts import render
from django.http import JsonResponse
import tensorflow as tf
from .models import Dataset
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework import status
from .serializers import DatasetSerializer
import zipfile
import os
from django.conf import settings
import shutil 



# TensorFlow Test View
def test_tensorflow(request):
    x = tf.constant([1, 2, 3])
    y = tf.constant([4, 5, 6])
    result = tf.add(x, y)
    return JsonResponse({'result': result.numpy().tolist()})



# Dataset Upload View
class DatasetUploadView(APIView):
    parser_classes = [MultiPartParser]

    def get(self, request):
        # fetch all datasets from the database
        datasets = Dataset.objects.all()
        # prepare the data for the response
        data = [{"id": dataset.id, "name": dataset.name, "root_directory": dataset.root_directory} for dataset in datasets]
        return Response(data, status=status.HTTP_200_OK)
    
    def post(self, request):
        dataset_file = request.FILES.get('file')
        dataset_name = request.data.get('name')

        if not dataset_file or not dataset_name:
            return Response({"error": "Dataset name and file are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Save the ZIP file temporarily 
        temp_path = os.path.join(settings.MEDIA_ROOT, 'temp.zip')
        with open(temp_path, 'wb') as f:
            for chunk in dataset_file.chunks():
                f.write(chunk)
        
        # Extract the ZIP file
        extract_path = os.path.join(settings.MEDIA_ROOT, 'datasets', dataset_name)
        os.makedirs(extract_path, exist_ok=True)
        with zipfile.ZipFile(temp_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)
        
        # Delete the temporary file
        os.remove(temp_path)

        # Save dataset information in the database
        dataset = Dataset.objects.create(name=dataset_name, root_directory=extract_path)
        return Response({"message": "Dataset uploaded successfully", "id": dataset.id}, status=status.HTTP_201_CREATED)



class DatasetStructureView(APIView):
    def get(self, request, dataset_id):
        try:
            dataset = Dataset.objects.get(id=dataset_id)
            structure = []

            for root, dirs, files in os.walk(dataset.root_directory):
                # Include the root directory name as part of the path
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
            
            # Delete the directory from disk
            shutil.rmtree(dataset.root_directory, ignore_errors=True)
            
            # Delete the dataset entry from the database
            dataset.delete()
            
            return Response({"message": "Dataset deleted successfully"}, status=status.HTTP_200_OK)
        except Dataset.DoesNotExist:
            return Response({"error": "Dataset not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)