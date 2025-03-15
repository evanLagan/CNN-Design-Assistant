import React, { useState, useEffect } from 'react';
import api from '../api';
import '../styles/DatasetUpload.css';

const DatasetPanel = ({ datasets, fetchDatasets, handleSelectDataset, selectedDataset }) => {
    const [fileStructure, setFileStructure] = useState([]);
    const [deletingDatasetId, setDeletingDatasetId] = useState(null);
    const [datasetMetadata, setDatasetMetadata] = useState(null);

    // Function to fetch the file structure and metadata for a specific dataset.
    const handleInspect = (dataset) => {
        console.log("Inspection called on:" , dataset.id)
        api.get(`/datasets/${dataset.id}/structure/`)
            .then((response) => {
                // Save the returned file structure and metadata to the components's stat
                setFileStructure(response.data.structure);
                setDatasetMetadata(response.data.metadata);
            })
            .catch((error) => console.error('Error fetching file structure:', error));
    };

    // Function to clear the displayed file structure view
    const handleClose = () => {
        setFileStructure([]);
    };
    
    // Function to remove a dataset after confirming with the user.
    const handleRemove = (datasetId) => {
        if (window.confirm('Are you sure that you want to remove this dataset from the application?')) {
            // Set the dataset ID being deleted to disable its remove button (Avoid multiple requests that slow the system)
            setDeletingDatasetId(datasetId);
            
            // Send a delete request to the backend
            api.delete(`/datasets/${datasetId}/`)
                .then(() => {
                    alert('Dataset removed successfully');
                    // Refresh the dataset list after deletion
                    fetchDatasets();
                })
                .catch((error) => {
                    console.error('Error removing dataset:', error);
                    alert('Failed to remove dataset. Please try again');
                })
                .finally(() => {
                    // Reset the deleting state once the operation is complete
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
                            <p><strong style={{ color: "red"}}>Number of Units needed in the final layer of your model:</strong> {datasetMetadata.num_classes_train}</p>
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