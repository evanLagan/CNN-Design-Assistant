import React, { useState, useEffect } from 'react';
import api from './api';
import TestTensorFlow from './components/TestTensorFlow';
import DatasetPanel from './components/DatasetPanel';
import DatasetUpload from './components/DatasetUpload';

function App() {
  const [datasets, setDatasets] = useState([]);

  const fetchDatasets = () => {
    api.get('/datasets/')
       .then((response) => setDatasets(response.data))
       .catch((error) => console.error('Error fetching datasets:', error));
  };

  useEffect(() => {
    fetchDatasets();
  }, []);


  return (
    <div className="App">
      <div style={{ padding: 20 }}>
        <h1>TensorFlow Test</h1>
        <div style={{ marginBottom: '20px' }}>
          <TestTensorFlow />
        </div>
       <div style={{ marginBottom: '20px' }}>
          <DatasetUpload fetchDatasets={fetchDatasets} />
       </div>
          <DatasetPanel datasets={datasets} fetchDatasets={fetchDatasets} />
        </div>
    </div>

   
  );
}

export default App;
