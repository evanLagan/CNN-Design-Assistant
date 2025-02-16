from rest_framework.decorators import api_view
from django.http import HttpResponse, JsonResponse
import tensorflow as tf

def generate_model_code(input_shape, layers_config, optimizer, loss, learning_rate):
    code_lines = [
        "import tensorflow as tf",
        "",
        "def build_model():",
        f"    model = tf.keras.Sequential()",
        f"    model.add(tf.keras.layers.InputLayer(input_shape={input_shape}))",
        ""
    ]
    
    for layer in layers_config:
        layer_type = layer['type']
        if layer_type == 'Dense':
            line = (f"    model.add(tf.keras.layers.Dense(units={layer['units']}, "
                    f"activation='{layer['activation']}'))")
            code_lines.append(line)
        elif layer_type == 'Conv2D':
            kernel_size = tuple(map(int, layer['kernel_size'].split('x')))
            strides = tuple(map(int, layer['strides'].split('x')))
            line = (f"    model.add(tf.keras.layers.Conv2D(filters={layer['filters']}, "
                    f"kernel_size={kernel_size}, strides={strides}, activation='{layer['activation']}'))")
            code_lines.append(line)
        elif layer_type == 'MaxPooling2D':
            pool_size = tuple(map(int, layer['pool_size'].split('x')))
            line = f"    model.add(tf.keras.layers.MaxPooling2D(pool_size={pool_size}))"
            code_lines.append(line)
        elif layer_type == 'Flatten':
            code_lines.append("    model.add(tf.keras.layers.Flatten())")
        elif layer_type == 'BatchNormalization':
            code_lines.append("    model.add(tf.keras.layers.BatchNormalization())")
        elif layer_type == 'Dropout':
            line = f"    model.add(tf.keras.layers.Dropout(rate={layer['rate']}))"
            code_lines.append(line)
            
        code_lines.append("")  

    code_lines.extend([
        f"    optimizer = tf.keras.optimizers.{optimizer.capitalize()}(learning_rate={learning_rate})",
        f"    model.compile(optimizer=optimizer, loss='{loss}', metrics=['accuracy'])",
        "    return model",
        "",
        "# To build the model, call:",
        "# model = build_model()"
    ])
    
    return "\n".join(code_lines)

@api_view(['POST'])
def get_model_code(request):
    try:
        data = request.data
        
        image_size = tuple(map(int, data.get('inputShape').split(',')[:2]))
        expected_channels = int(data.get('inputShape').split(',')[-1])
        input_shape = (image_size[0], image_size[1], expected_channels)
        
        layers_config = data['layers']
        optimizer = data.get('optimizer', 'adam')
        loss = data.get('loss', 'categorical_crossentropy')
        learning_rate = float(data.get('learningRate', 0.001))
        
        # Generate the code string
        model_code = generate_model_code(input_shape, layers_config, optimizer, loss, learning_rate)
        
        return HttpResponse(model_code, content_type='text/plain')
    
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)