from django.shortcuts import render

from django.http import JsonResponse
import tensorflow as tf

def test_tensorflow(request):
    x = tf.constant([1, 2, 3])
    y = tf.constant([4, 5, 6])
    result = tf.add(x, y)
    return JsonResponse({'result': result.numpy().tolist()})

# Create your views here.
