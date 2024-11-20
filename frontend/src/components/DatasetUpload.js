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
        if(!file || !name){
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
        <form onSubmit={handleUpload}>
            <label>
                Dataset Name:
                <input type="text" value={name} onChange={handleNameChange} />
            </label>
            <label>
                Upload ZIP:
                <input type="file" onChange={handleFileChange} />
            </label>
            <button type="submit">Upload</button>
        </form>
    );
};

export default DatasetUpload;