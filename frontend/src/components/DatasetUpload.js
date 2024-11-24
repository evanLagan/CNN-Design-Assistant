import React, { useState } from 'react';
import api from '../api';

const DatasetUpload = ({ fetchDatasets }) => {
    const [file, setFile] = useState(null);
    const [name, setName] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleNameChange = (e) => {
        setName(e.target.value);
    };

    const handleUpload = (e) => {
        e.preventDefault();
        if (!file || !name) {
            alert('Please provide a dataset name and files')
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('file', file);

        api.post('/datasets/', formData)
            .then(() => {
                alert('Dataset uploaded successfully!');
                fetchDatasets();
            })
            .catch(error => console.error('Error uploading dataset:', error));
    };

    return (

        <div className='dataset-upload-container'>
            <h3>Dataset Upload</h3>
            <form className='dataset-upload' onSubmit={handleUpload}>
                <label className='dataset-name'>
                    Dataset Name:
                    <input type="text" value={name} onChange={handleNameChange} />
                </label>
                <label className='dataset-zip'>
                    Upload ZIP:
                    <input type="file" onChange={handleFileChange} />
                </label>
                <button className='dataset-upload-button' type="submit">Upload</button>
            </form>
        </div>
    );
};

export default DatasetUpload;