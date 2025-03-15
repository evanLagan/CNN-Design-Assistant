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
from PIL import Image
import mimetypes


class DatasetUploadView(APIView):
    parser_classes = [MultiPartParser]

    def get(self, request):
        # Retrieve all datasets from the database
        datasets = Dataset.objects.all()
        # Prepare a list of dataset dictionaries with basic information.
        data = [{"id": dataset.id, "name": dataset.name, "root_directory": dataset.root_directory} for dataset in datasets]
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        # Get the uploaded file from the request
        dataset_file = request.FILES.get('file')
        
        # Validate that a file was provided
        if not dataset_file:
            return Response({"error": "Dataset name and file are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Use the file name (without extensions) as the dataset name
        dataset_name = os.path.splitext(dataset_file.name)[0]
        
        # Save the uploaded ZIP file temporarily
        temp_path = os.path.join(settings.MEDIA_ROOT, 'temp.zip')
        with open(temp_path, 'wb') as f:
            for chunk in dataset_file.chunks():
                f.write(chunk)
        
        # Create the extraction path using the dataset name
        extract_path = os.path.join(settings.MEDIA_ROOT, 'datasets', dataset_name)
        os.makedirs(extract_path, exist_ok=True)
        
        # Extract the ZIP file contents into the extraction path
        with zipfile.ZipFile(temp_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)

        # Remove the temporary ZIP file after extraction
        os.remove(temp_path)
        
        # Create a new Dataset entry in the database
        dataset = Dataset.objects.create(name=dataset_name, root_directory=extract_path)
        return Response({"message": "Dataset uploaded successfully", "id": dataset.id}, status=status.HTTP_201_CREATED)


class DatasetStructureView(APIView):
    def get(self, request, dataset_id):
        try:
            # Retrieve the dataset object by its ID
            dataset = Dataset.objects.get(id=dataset_id)
            root_dir = dataset.root_directory
            structure = []
            metadata = {
                "color_channel": None,
                "num_classes_train": 0,
                "num_classes_test": 0,
                "total_images": 0,
                "train_test_mismatch": False,
                "has_train_test_split": False,
                "mixed_image_sizes_per_class": {} 
            }
            
            # Dictionaries to count images per class for both train and test splits
            class_counts = {"train": {}, "test": {}}
            
            # Dictionaries to track unique image sizes for each class
            image_sizes_per_class = {"train": {}, "test": {}}  

            # Walk through the dataset directory to build its structure and collect metadata
            for root, dirs, files in os.walk(root_dir):
                relative_path = os.path.relpath(root, root_dir)
                if relative_path == '.':
                    relative_path = os.path.basename(root_dir)

                structure.append({
                    "path": relative_path,
                    "directories": dirs,
                    "files": files
                })

                # Detect train/test folder presence
                is_train = "train" in relative_path.lower()
                is_test = "test" in relative_path.lower()

                if is_train or is_test:
                    metadata["has_train_test_split"] = True
                    parent_folder = "train" if is_train else "test"

                    for folder in dirs:  # Each subdirectory represents a class
                        class_counts[parent_folder][folder] = 0  # Initialize class count
                        image_sizes_per_class[parent_folder][folder] = set()  # Track image sizes

                # Process image files
                for file in files:
                    file_path = os.path.join(root, file)
                    if mimetypes.guess_type(file_path)[0] and "image" in mimetypes.guess_type(file_path)[0]:
                        with Image.open(file_path) as img:
                            img_size = (img.width, img.height)  # Image dimensions
                            class_name = os.path.basename(root)  # Get class folder name

                            # Determine if image belongs to a known train/test class
                            if class_name in class_counts["train"]:
                                class_counts["train"][class_name] += 1
                                image_sizes_per_class["train"][class_name].add(img_size)
                            elif class_name in class_counts["test"]:
                                class_counts["test"][class_name] += 1
                                image_sizes_per_class["test"][class_name].add(img_size)

                            # Set color channel type (only needed once)
                            if not metadata["color_channel"]:
                                metadata["color_channel"] = "RGB" if img.mode == "RGB" else "Grayscale"

                        metadata["total_images"] += 1

            # Count unique classes in train and test
            metadata["num_classes_train"] = len(class_counts["train"])
            metadata["num_classes_test"] = len(class_counts["test"])

            # Check if train/test class lists are mismatched
            train_classes = set(class_counts["train"].keys())
            test_classes = set(class_counts["test"].keys())
            metadata["train_test_mismatch"] = train_classes != test_classes

            # Detect mixed image sizes for each class
            for dataset_type in ["train", "test"]:
                for class_name, sizes in image_sizes_per_class[dataset_type].items():
                    metadata["mixed_image_sizes_per_class"][class_name] = len(sizes) > 1

            return Response({"structure": structure, "metadata": metadata}, status=status.HTTP_200_OK)

        except Dataset.DoesNotExist:
            return Response({"error": "Dataset not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class DatasetDeleteView(APIView):
    def delete(self, request, dataset_id):
        try:
            # Fetch the dataset object
            dataset = Dataset.objects.get(id=dataset_id)

            # Path to dataset directory
            root_dir = dataset.root_directory
            print(f"Attempting to delete dataset directory: {root_dir}")

            # Check if the directory is the media folder itself
            media_root = os.path.normpath(settings.MEDIA_ROOT)  # Normalize for OS-specific path formats
            root_dir_normalized = os.path.normpath(root_dir)

            if root_dir_normalized == media_root:
                return Response({"error": "Cannot delete the media folder"}, status=status.HTTP_400_BAD_REQUEST)

            # Remove the dataset directory if it exists
            if os.path.exists(root_dir):
                shutil.rmtree(root_dir, ignore_errors=False)  # Fail if deletion fails

                # Clean up empty parent directories, but stop at the media folder
                parent_dir = os.path.dirname(root_dir)
                while os.path.isdir(parent_dir) and not os.listdir(parent_dir):
                    if os.path.normpath(parent_dir) == media_root:  # Stop at the media folder
                        break
                    os.rmdir(parent_dir)
                    parent_dir = os.path.dirname(parent_dir)
                print(f"Dataset directory and empty parent directories deleted: {root_dir}")
            else:
                print(f"Directory not found: {root_dir}")

            # Delete the database entry
            dataset.delete()
            return Response({"message": "Dataset deleted successfully"}, status=status.HTTP_200_OK)

        except Dataset.DoesNotExist:
            return Response({"error": "Dataset not found"}, status=status.HTTP_404_NOT_FOUND)
        except PermissionError as e:
            print(f"Permission error: {e}")
            return Response({"error": "Permission denied while deleting directory"}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            print(f"Error in DatasetDeleteView: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
