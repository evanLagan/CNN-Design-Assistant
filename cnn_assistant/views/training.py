import os
import shutil
import traceback
from rest_framework.decorators import api_view
from django.http import JsonResponse
import tensorflow as tf
from ..models import Dataset
from PIL import Image

# Note:
# Need to make batch size dynamic!!!!!
# Need to make build_dynamic_model Complete!!!!! (Missing layers such as batch normalization)

# Function to load dataset dynamically
def load_dataset(dataset_id, image_size, expected_channels):
    try:
        print(f"Loading dataset with ID: {dataset_id}")
        
        dataset = Dataset.objects.get(id=dataset_id)
        print(f"Dataset found: {dataset}")
        
        dataset_root = dataset.root_directory
        
        # Detecting the actual dataset folder inside the extracted directory
        subfolders = [f for f in os.listdir(dataset_root) if os.path.isdir(os.path.join(dataset_root, f))]
        if len(subfolders) == 1:
            dataset_root = os.path.join(dataset_root, subfolders[0])
       
        # Constructing the correct train and test directories
        train_dir = os.path.join(dataset_root, 'train')
        test_dir = os.path.join(dataset_root, 'test')
        
        print(f"Train directory: {train_dir}")
        print(f"Test directory: {test_dir}")
        
        # Dynamically set colour mode based on expected_channels
        color_mode = 'rgb' if expected_channels == 3 else 'grayscale'
        
        train_dataset = tf.keras.preprocessing.image_dataset_from_directory(
            train_dir,
            labels='inferred',
            label_mode='categorical',
            image_size=image_size,
            batch_size=32,
            color_mode=color_mode
        )
        print("Training dataset loaded successfully")

        test_dataset = tf.keras.preprocessing.image_dataset_from_directory(
            test_dir,
            labels='inferred',
            label_mode='categorical',
            image_size=image_size,
            batch_size=32,
            color_mode=color_mode
        )
        print("Test dataset loaded successfully")
        
        return train_dataset, test_dataset, train_dir
    
    except Dataset.DoesNotExist:
        raise ValueError(f'Dataset with ID {dataset_id} does not exist')
    except Exception as e:
        print("Error in load_dataset:", str(e))
        raise 


# Function to build a model dynamically based on user input
def build_dynamic_model(input_shape, layers_config, optimizer, loss, learning_rate):
    model = tf.keras.Sequential()
    model.add(tf.keras.layers.InputLayer(input_shape=input_shape))
    
    for layer in layers_config:
        layer_type = layer['type']
        
        if layer_type == 'Dense':
            model.add(tf.keras.layers.Dense(
                units=layer['units'],
                activation=layer['activation']
            ))
        
        elif layer_type == 'Conv2D':
            model.add(tf.keras.layers.Conv2D(
                filters=layer['filters'],
                kernel_size=tuple(map(int, layer['kernel_size'].split('x'))),
                strides=tuple(map(int, layer['strides'].split('x'))),
                activation=layer['activation']
            ))
            
        elif layer_type == 'MaxPooling2D':
            model.add(tf.keras.layers.MaxPooling2D(
                pool_size=tuple(map(int, layer['pool_size'].split('x')))
            ))
        
        elif layer_type == 'Flatten':
            model.add(tf.keras.layers.Flatten())
        
        elif layer_type == 'Dropout':
            model.add(tf.keras.layers.Dropout(rate=layer['rate']))
        
    # Compile the model with dynamic optimizer and loss
    optimizer_instance = getattr(tf.keras.optimizers, optimizer)(learning_rate=learning_rate)
    model.compile(optimizer=optimizer_instance, loss=loss, metrics=['accuracy'])
    
    return model



# API Endpoint for training the model
@api_view(['POST'])
def train_model(request):
    try:
        print("Request Object: ", request.data)
        
        # Step 1: Parse the request data
        data = request.data
        dataset_id = data.get('dataset_id')
        if not dataset_id:
            return JsonResponse({'error': 'Dataset ID is required'}, status=400)
        
        # Step 2: Get image size from request, defaulting to (244, 244) if not provided
        image_size = tuple(map(int, data.get('inputShape').split(',')[:2]))
        expected_channels = int(data.get('inputShape').split(',')[-1])
        
        # Step 3: Load dataset and detect image channels
        train_dataset, test_dataset, train_dir = load_dataset(dataset_id, image_size, expected_channels)
        
        # Confirm dataset shape before training
        for image_batch, _ in train_dataset.take(1):
            print(f"Dataset batch shape: {image_batch.shape}")
        
        #num_channels = detect_image_channels(train_dir)
        input_shape = (image_size[0], image_size[1], expected_channels)
        
        # Step 4: Extract model parameters from request
        layers_config = data['layers']
        optimizer = data.get('optimizer', 'adam')
        loss = data.get('loss', 'categorical_crossentropy')
        learning_rate = float(data.get('learningRate', 0.001))
        epochs = int(data.get('epochs', 10))
        
        # Step 5: Build the model dynamically
        model = build_dynamic_model(input_shape, layers_config, optimizer, loss, learning_rate)
        
        # Step 6: Train the model
        model.fit(train_dataset, epochs=epochs, validation_data=test_dataset)
        
        # Step 7: Evaluate the model
        val_loss, val_accuracy = model.evaluate(test_dataset, verbose=0)
        
        
        return JsonResponse({
            'message': 'Model trained and validated successfully!',
            'validation': {
                'loss': val_loss,
                'accuracy': val_accuracy
            },
            'request_data': request.data,
        }, status=200)
    
    except Exception as e:
        print("Error in train_model:", str(e))
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)
        

