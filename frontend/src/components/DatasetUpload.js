import React, { useState } from 'react';
import api from '../api';

const DatasetUpload = ({ fetchDatasets }) => {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Handle the form submission for uploading the dataset
    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    // Handle the form submission for uploading the dataset
    const handleUpload = (e) => {
        e.preventDefault();
        if (!file) {
            alert('Please provide a dataset')
            return;
        }
        
        // Indicate that the upload is in progress
        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);
        
        // Make an API call to upload the dataset
        api.post('/datasets/', formData)
            .then(() => {
                alert('Dataset uploaded successfully!');
                fetchDatasets();
            })
            .catch((error) => {
                console.error('Error uploading dataset:', error);
                alert('Failed to upload dataset. Please try again');
            })
            .finally(() => {
                setIsUploading(false);
            });
    };

    return (

        <div className='dataset-upload-container'>
            <h3>Dataset Upload</h3>
            <form className='dataset-upload' onSubmit={handleUpload}>
                <label className='dataset-zip'>
                    Upload ZIP:
                    <input className='choose-file-btn' type="file" onChange={handleFileChange} />
                </label>
                <button className='dataset-upload-button' type="submit" disabled={isUploading}>
                    {isUploading ? 'Uploading...' : 'Upload'}
                </button>
            </form>
            {isUploading && <p>Dataset is being uploaded. Please wait</p>}
        </div>
    );
};

export default DatasetUpload;