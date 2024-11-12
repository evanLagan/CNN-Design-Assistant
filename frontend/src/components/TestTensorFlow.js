import React, {useEffect, useState } from 'react';
import api from '../api';

const TestTensorFlow = () => {
    const [result, setResult] = useState(null);

    useEffect(() => {
        api.get('/test-tensorflow/')
           .then(response => setResult(response.data.result))
           .catch(error => console.error(error));
    }, []);

    return <div>TensorFlow Result: {result ? result.join(', ') : 'Loading...'}</div>
};

export default TestTensorFlow;
