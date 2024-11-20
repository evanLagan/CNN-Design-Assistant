from django.db import models

class Dataset(models.Model):
    name = models.CharField(max_length=255)
    upload_date = models.DateTimeField(auto_now_add=True)
    root_directory = models.CharField(max_length=500)

    def __str__(self):
        return self.name
