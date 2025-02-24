import React, { useState, useEffect } from 'react';
import api from '../api';
import '../styles/DatasetUpload.css';

const DatasetPanel = ({ datasets, fetchDatasets, handleSelectDataset, selectedDataset }) => {
    const [fileStructure, setFileStructure] = useState([]);
    const [deletingDatasetId, setDeletingDatasetId] = useState(null);
    const [datasetMetadata, setDatasetMetadata] = useState(null);


    const handleInspect = (dataset) => {
        //setSelectedDataset(dataset);
        api.get(`/datasets/${dataset.id}/structure/`)
            .then((response) => {
                setFileStructure(response.data.structure);
                setDatasetMetadata(response.data.metadata);
            })
            .catch((error) => console.error('Error fetching file structure:', error));
    };

    /*
    const handleInspect = (dataset) => {
        //setSelectedDataset(dataset);
        api.get(`/datasets/${dataset.id}/structure/`)
            .then((response) =>  setFileStructure(response.data))
            .catch((error) => console.error('Error fetching file structure:', error));
    }; */

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
                    <button onClick={handleClose}>Close</button>

                    {/* Display dataset metadata */}
                    {datasetMetadata && (
                        <div className="dataset-metadata" style={{ marginBottom: '70px'}}>
                            <h2>Dataset Info</h2>
                            <p><strong>Colour Channel:</strong> {datasetMetadata.color_channel}</p>
                            <p><strong>Number of Classes (Train):</strong> {datasetMetadata.num_classes_train}</p>
                            <p><strong>Number of Classes (Test):</strong> {datasetMetadata.num_classes_test}</p>
                            <p><strong>Total Images:</strong> {datasetMetadata.total_images}</p>
                            <p><strong>Has Train/Test Split:</strong> {datasetMetadata.has_train_test_split ? '✅ Yes' : '❌ No'}</p>
                        </div>
                    )}
                    
                    
                    {/* Display folder structure */}
                    <h2>Contents</h2>
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