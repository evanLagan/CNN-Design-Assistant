import React, { useState, useEffect } from 'react';
import api from '../api';
import '../styles/DatasetUpload.css';

const DatasetPanel = ({ datasets, fetchDatasets, handleSelectDataset, selectedDataset }) => {
    const [fileStructure, setFileStructure] = useState([]);
    const [deletingDatasetId, setDeletingDatasetId] = useState(null);


    const handleInspect = (dataset) => {
        //setSelectedDataset(dataset);
        api.get(`/datasets/${dataset.id}/structure/`)
            .then((response) => setFileStructure(response.data))
            .catch((error) => console.error('Error fetching file structure:', error));
    };

    const handleClose = () => {
        //setSelectedDataset(null);
        setFileStructure([]);
    };

    const handleRemove = (datasetId) => {
        if (window.confirm('Are you sure that you want to remove this dataset from the application?')) {
            setDeletingDatasetId(datasetId);

            api.delete(`/datasets/${datasetId}/`)
                .then(() => {
                    alert('Dataset removed successfully');
                    fetchDatasets();
                })
                .catch((error) => {
                    console.error('Error removing dataset:', error);
                    alert('Failed to remove dataset. Please try again');
                })
                .finally(() => {
                    setDeletingDatasetId(null);
                });
        }
    }

    return (
        <div className="dataset-panel">
            <h2>Current Datasets</h2>
            <ul className="dataset-list">
                {datasets.map((dataset) => (
                    <li key={dataset.id}>
                        <strong>{dataset.name}</strong>
                        <div className="button-container">
                            <button className='inspect-btn' onClick={() => handleInspect(dataset)}>🔍</button>
                            <button className='remove-btn' onClick={() => handleRemove(dataset.id)} disabled={deletingDatasetId === dataset.id}>
                                {deletingDatasetId === dataset.id ? 'Removing...' : '🗑️'}
                            </button>
                            <button 
                                onClick={() => handleSelectDataset(selectedDataset?.id === dataset.id ? null : dataset)}
                                className={`select-btn ${selectedDataset?.id === dataset.id ? 'select-btn-red' : ''}`}
                                    
                            >
                                {selectedDataset?.id === dataset.id ? 'Deselect' : 'Select Dataset'}
                            </button>
                        </div>
                    </li>
                ))}
            </ul>

            {fileStructure.length > 0 && (
                <div className="dataset-structure">
                    <h4>Structure of: {selectedDataset?.name}</h4>
                    <button onClick={handleClose}>Close</button>
                    <ul>
                        {fileStructure.map((item, index) => (
                            <li key={index}>
                                <strong>{item.path}</strong>
                                <ul>
                                    {item.directories.map((dir, dirIndex) => (
                                        <li key={dirIndex}>📁 {dir}</li>
                                    ))}
                                    {item.files.map((file, fileIndex) => (
                                        <li key={fileIndex}>📄 {file}</li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default DatasetPanel;