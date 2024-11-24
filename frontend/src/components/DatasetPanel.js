import React, { useState, useEffect } from 'react';
import api from '../api';
import '../styles/DatasetUpload.css';

const DatasetPanel = ({ datasets, fetchDatasets, handleSelectDataset, selectedDataset }) => {
    //const [selectedDataset, setSelectedDataset] = useState(null);
    const [fileStructure, setFileStructure] = useState([]);

    // Fetch file structure for the selected dataset
    const handleInspect = (dataset) => {
        //setSelectedDataset(dataset);
        api.get(`/datasets/${dataset.id}/structure/`)
           .then((response) => setFileStructure(response.data))
           .catch((error) => console.error('Error fetching file structure:', error));
    };

    //Handle closing the dataset inspection view
    const handleClose = () => {
        //setSelectedDataset(null);
        setFileStructure([]);
    };

    //Handle dataset removal
    const handleRemove = (datasetId) => {
        if(window.confirm('Are you sure that you want to remove this dataset from the application?')){
            api.delete(`/datasets/${datasetId}/`)
               .then(() => {
                   alert('Dataset removed successfully');
                   fetchDatasets();
               })
               .catch((error) => console.error('Error removing dataset:', error));
        }
    }

    return (
        <div className="dataset-panel">
            <h2>Current Datasets</h2>
            <ul className="dataset-list">
                {datasets.map((dataset) => (
                    <li key={dataset.id}>
                        <strong>{dataset.name}</strong>
                        <button onClick={() => handleInspect(dataset)}>Inspect</button>
                        <button onClick={() => handleRemove(dataset.id)}>Remove</button>
                        <button onClick={() => handleSelectDataset(selectedDataset?.id === dataset.id ? null : dataset)}>
                            {selectedDataset?.id === dataset.id ? 'Deselect' : 'Select Dataset'}
                        </button>
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