import React, { useState, useEffect } from 'react';
import api from './api';
import './App.css';
import DatasetPanel from './components/DatasetPanel';
import DatasetUpload from './components/DatasetUpload';
import ModelBuilder from './components/ModelBuilder';
import Notepad from './components/Notepad';
import TrainingResponseDisplay from './components/TrainingResponseDisplay';

function App() {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectDataset] = useState(null);
  const [modelConfig, setModelConfig] = useState(null);
  const [trainingStatus, setTrainingStatus] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingResponse, setTrainingResponse] = useState(null);

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

    // Check if a dataset is selected before training
    if (!selectedDataset) {
      alert("Please select a dataset.");
      return;
    }

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
      setTrainingResponse(response.data);
      alert('Training completed successfully!');
    } catch (error) {
      console.error('Error during training:', error);

      if (error.response && error.response.data && error.response.data.error) {
        alert(`Training Failed: ${error.response.data.error}`);
      } else {
        alert('An error occurred during training');
      }
      setTrainingStatus('Training failed.');
    } finally {
      setIsTraining(false);
    }
  }

  // Retrieving model code
  const getModelCode = async (config) => {
    try {
      // Remove spaces
      const payload = {
        ...config,
        inputShape: config.inputShape.replace(/\s/g, ''),
      };
      const response = await api.post('/get-model-code/', payload);
      return response.data;
    } catch (error) {
      console.error('Error fetching model code:', error);
      throw error;
    }
  };

  // Clear training response
  const clearTrainingResponse = () => {
    setTrainingResponse(null);
    setTrainingStatus(null);
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
          onGetModelCode={getModelCode}
        />
      </div>
      <div className='training-response-display'>
        <TrainingResponseDisplay 
          responseData={trainingResponse}
          clearResponse={clearTrainingResponse} 
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
