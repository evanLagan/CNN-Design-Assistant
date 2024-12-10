import React, { useState, useEffect } from 'react';
import api from './api';
import './App.css';
import TestTensorFlow from './components/TestTensorFlow';
import DatasetPanel from './components/DatasetPanel';
import DatasetUpload from './components/DatasetUpload';
import ModelBuilder from './components/ModelBuilder';
import Notepad from './components/Notepad';

function App() {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectDataset] = useState(null);
  const [modelConfig, setModelConfig] = useState(null);
  const [trainingStatus, setTrainingStatus] = useState(null);
  const [isTraining, setIsTraining] = useState(false);

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

  //Handle model training

  const trainModel = async (modelConfig) => {
    if (isTraining) return; // Preventing multiple clicks 

    console.log('Train Button has been pressed: Model training has begun')
    try {
      setIsTraining(true);
      setTrainingStatus('Training in progress...');

      //Adding dataset_id to modelConfig
      const payLoad = {
        ...modelConfig,
        dataset_id:selectedDataset?.id,
      };

      const response = await api.post('/train-model/', payLoad);
      setTrainingStatus('Training completed.');
      console.log('Training response:', response.data);
      alert('Training completed successfully!');
    } catch (error) {
      console.error('Error during training:', error);
      setTrainingStatus('Training failed.');
      alert('An error occured during training');
    } finally {
      setIsTraining(false);
    }
  }


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
        <ModelBuilder 
          onSaveModel={saveModelConfig}
          onTrainModel={trainModel} 
          isTraining={isTraining} 
        />
      </div>
      <div className='notepad-section'>
        < Notepad />
      </div>
    </div>
    </div>


  );
}

export default App;
