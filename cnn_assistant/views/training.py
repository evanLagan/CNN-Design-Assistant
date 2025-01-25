from rest_framework.decorators import api_view
from django.http import JsonResponse
import tensorflow as tf


@api_view(['POST'])
def train_model(request):

    try:
        # Step 1: Parse the request data
        data = request.data

        # Load and preprocess MNIST dataset
        (x_train, y_train), (x_test, y_test) = tf.keras.datasets.mnist.load_data()
        x_train = x_train.reshape((x_train.shape[0], 28, 28, 1)).astype('float32') / 255
        x_test = x_test.reshape((x_test.shape[0], 28, 28, 1)).astype('float32') / 255
        y_train = tf.keras.utils.to_categorical(y_train, 10)
        y_test = tf.keras.utils.to_categorical(y_test, 10)

        # Step 2: Extract hyperparameters and model configuration
        input_shape = tuple(map(int, data['inputShape'].split(',')))
        layers_config = data['layers']
        optimizer = data.get('optimizer', 'adam')
        loss = data.get('loss', 'categorical_crossentropy')
        learning_rate = float(data.get('learningRate', 0.001))
        epochs = int(data.get('epochs', 10))

        # Step 3: Build the model
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

        # Step 4: Compile the model
        optimizer_instance = getattr(tf.keras.optimizers, optimizer.capitalize())(learning_rate=learning_rate)
        model.compile(optimizer=optimizer_instance, loss=loss, metrics=['accuracy'])

        # Step 5: Train the model
        model.fit(x_train, y_train, epochs=epochs, validation_data=(x_test, y_test), batch_size=32)

        # Step 6: Evaluate the model
        val_loss, val_accuracy = model.evaluate(x_test, y_test, verbose=0)

        # Return results
        return JsonResponse({
            'message': 'Model trained and validated successfully!',
            'validation': {
                'loss': val_loss,
                'accuracy': val_accuracy
            },
            'request_data': request.data,
        }, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
