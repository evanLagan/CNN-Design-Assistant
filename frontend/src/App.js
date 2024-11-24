import React, { useState, useEffect } from 'react';
import api from './api';
import './App.css';
import TestTensorFlow from './components/TestTensorFlow';
import DatasetPanel from './components/DatasetPanel';
import DatasetUpload from './components/DatasetUpload';
import ModelBuilder from './components/ModelBuilder';

function App() {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectDataset] = useState(null);
  const [modelConfig, setModelConfig] = useState(null);

  //Fetch Datasets from the backend
  const fetchDatasets = () => {
    api.get('/datasets/')
      .then((response) => setDatasets(response.data))
      .catch((error) => console.error('Error fetching datasets:', error));
  };

  //Fetch datasets on the initial load
  useEffect(() => {
    fetchDatasets();
  }, []);


  //Handle Dataset selection
  const handleSelectDataset = (dataset) => {
    setSelectDataset(dataset); //Update the selected dataset
    console.log('Selected dataset:', dataset);
  };

  //Handle Saving model configuration
  const saveModelConfig = (config) => {
    setModelConfig(config);
    console.log('Model Configuration saved:', config);
  };


  return (
   <div>
    <h1 style={{marginLeft: "20px"}}>CNN Design Assistant</h1>
    <div className="app-layout">
      <div className='dataset-section'>
        <DatasetPanel
          datasets={datasets}
          fetchDatasets={fetchDatasets}
          handleSelectDataset={handleSelectDataset}
          selectedDataset={selectedDataset}
        />
        <DatasetUpload fetchDatasets={fetchDatasets} />
      </div>
      <div className='model-builder-section'>
        <ModelBuilder onSaveModel={saveModelConfig} />
      </div>
    </div>
    </div>


  );
}

export default App;
