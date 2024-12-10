from django.shortcuts import render
from django.http import JsonResponse
import tensorflow as tf
from .models import Dataset
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework import status
from .serializers import DatasetSerializer
import zipfile
import os
from django.conf import settings
import shutil 



# TensorFlow Test View (Not currently being utilised)
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
        
        if not dataset_file:
            return Response({"error": "Dataset name and file are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        dataset_name = os.path.splitext(dataset_file.name)[0]
        
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


# Dataset Inspection
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
        
#Deleting a dataset
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
        
# Model training test (this code and following revisions should be put into their own seperate files)
# Hardcoding dataset (MNIST) and subsequent preprocessing (this will need to be implemeted on the frontend soon)

@api_view(['POST'])
def train_model(request):
    try:
        data = request.data
        # Dataset (Hardcoded)
        (x_train, y_train), (x_test, y_test) = tf.keras.datasets.mnist.load_data()
        x_train = x_train.reshape((x_train.shape[0], 28, 28, 1)).astype('float32') / 255
        x_test = x_test.reshape((x_test.shape[0], 28, 28, 1)).astype('float32') / 255
        y_train = tf.keras.utils.to_categorical(y_train, 10)
        y_test = tf.keras.utils.to_categorical(y_test, 10)

        # Model building
        input_shape = tuple(map(int, data['inputShape'].split(',')))
        layers_config = data['layers']
        optimizer = data.get('optimizer', 'adam')
        loss = data.get('loss', 'categorical_crossentropy')
        learning_rate = float(data.get('learningRate', 0.001))
        epochs = int(data.get('epochs', 10))

        model = tf.keras.Sequential()
        model.add(tf.keras.layers.InputLayer(input_shape=input_shape))

        for layer in layers_config:
            if layer['type'] == 'Dense':
                model.add(tf.keras.layers.Dense(
                    units=layer['units'],
                    activation=layer['activation']
                ))
            elif layer['type'] == 'Conv2D':
                model.add(tf.keras.layers.Conv2D(
                    filters=layer['filters'],
                    kernel_size=tuple(map(int, layer['kernel_size'].split('x'))),
                    strides=tuple(map(int, layer['strides'].split('x'))),
                    activation=layer['activation']
                ))
            elif layer['type'] == 'MaxPooling2D':
                model.add(tf.keras.layers.MaxPooling2D(
                    pool_size=tuple(map(int, layer['pool_size'].split('x')))
                ))
            elif layer['type'] == 'Flatten':
                model.add(tf.keras.layers.Flatten())
            elif layer['type'] == 'Dropout':
                model.add(tf.keras.layers.Dropout(rate=layer['rate']))

        # Compile the model
        optimizer_instance = getattr(tf.keras.optimizers, optimizer.capitalize())(learning_rate=learning_rate)
        model.compile(optimizer=optimizer_instance, loss=loss, metrics=['accuracy'])

        # Train the model
        model.fit(x_train, y_train, epochs=epochs, validation_data=(x_test, y_test), batch_size=32)

        # Evaluate the model
        val_loss, val_accuracy = model.evaluate(x_test, y_test, verbose=0)

        return JsonResponse({
            'message': 'Model trained and validated successfully!',
            'validation': {
                'loss': val_loss,
                'accuracy': val_accuracy
            },
            '(For Testing) Request Data': request.data,
        }, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)