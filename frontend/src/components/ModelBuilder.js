import React, { useState } from 'react';
import '../styles/ModelBuilder.css';

const ModelBuilder = ({ onSaveModel }) => {
    const [layers, setLayers] = useState([]);
    const [inputShape, setInputShape] = useState('32, 32, 3'); //Default Value
    const [optimizer, setOptimizer] = useState('adam'); //Default Value
    const [loss, setLoss] = useState('categorical_crossentropy'); //Default Value
    const [learningRate, setLearningRate] = useState(0.001); //Default value
    const [showGlobalHyperparameters, setShowGlobalHyperparameters] = useState(false);
    const [modeIntialised, setModelInitialised] = useState(false); //Tracks whether or not a model is being built
    const [epochs, setEpochs] = useState(10); // Default value



    //Adding a new layer
    const addLayer = (index = null) => {
        const newLayer = { type: 'Conv2D', filters: 32, kernel_size: '3x3', strides: '1x1', activation: 'relu', } //Default
        const newLayers = [...layers];

        if (index !== null) {
            newLayers.splice(index + 1, 0, newLayer);
        } else {
            newLayers.push(newLayer);
        }

        setLayers(newLayers);
    };

    //Initialising a Model
    const initialiseModel = () => {
        setModelInitialised(true);
        addLayer();
    }

    //Removing a layer
    const removeLayer = (index) => {
        const newLayers = [...layers];
        newLayers.splice(index, 1);
        setLayers(newLayers);
    };

    //Updating a layer
    const updateLayer = (index, field, value) => {
        const newLayers = [...layers];
        newLayers[index][field] = value;
        setLayers(newLayers);
    };

    //Saving the model
    const saveModel = () => {
        const modelConfig = {
            input_shape: inputShape,
            layers,
        };

        //Add global hyperparameters only if configured
        if (showGlobalHyperparameters) {
            modelConfig.optimizer = optimizer;
            modelConfig.loss = loss;
            modelConfig.learning_rate = learningRate;
        }

        onSaveModel(modelConfig);
        console.log('Model configuration saved:', modelConfig);
        alert('Model configuration saved');
    };


    return (
        <div className="model-builder">
            <h1>Model Builder</h1>

            {/*Initial Add Layer button */}
            {!modeIntialised || layers.length === 0 ? (
                <button onClick={initialiseModel}>Add Layer</button>
            ) : null}

            {/*Input Layer, Layers, and Global Hyperparameters */}

            {modeIntialised && layers.length > 0 && (
                <>
                    {/*Input Layer */}
                    <div className='input-layer'>
                        <label className='input-label'>
                            Input Shape:
                            <input
                                className='input-field'
                                type="text"
                                value={inputShape}
                                onChange={(e) => setInputShape(e.target.value)}
                                placeholder="32, 32, 3"
                            />
                        </label>
                    </div>

                    {/* Layers */}
                    <div>
                        {layers.length === 0 && (
                            <button onClick={addLayer}>Start Building</button>
                        )}
                        <ul>
                            {layers.map((layer, index) => (
                                <li key={index} className="layer-item">
                                    <div className="layer-parameters">
                                        <label>
                                            <select
                                                className='input-field'
                                                value={layer.type}
                                                onChange={(e) => updateLayer(index, 'type', e.target.value)}
                                            >
                                                <option value="Dense">Dense</option>
                                                <option value="Conv2D">Conv2D</option>
                                                <option value="MaxPooling2D">MaxPooling2D</option>
                                                <option value="Flatten">Flatten</option>
                                                <option value="BatchNormalization">BatchNormalization</option>
                                                <option value="ReLU">ReLU</option>
                                                <option value="Dropout">Dropout</option>
                                            </select>
                                        </label>

                                        {/* Dynamic Parameters */}
                                        {layer.type === 'Dense' && (
                                            <>
                                                <label>
                                                    Units:
                                                    <input
                                                        className='input-field'
                                                        type="number"
                                                        value={layer.units || ''}
                                                        onChange={(e) =>
                                                            updateLayer(index, 'units', parseInt(e.target.value))
                                                        }
                                                    />
                                                </label>
                                                <label>
                                                    Activation:
                                                    <select
                                                        className='input-field'
                                                        value={layer.activation || ''}
                                                        onChange={(e) => updateLayer(index, 'activation', e.target.value)}
                                                    >
                                                        <option value="relu">ReLU</option>
                                                        <option value="sigmoid">Sigmoid</option>
                                                        <option value="softmax">Softmax</option>
                                                        <option value="tanh">Tanh</option>
                                                    </select>
                                                </label>
                                            </>
                                        )}
                                        {layer.type === 'Conv2D' && (
                                            <>
                                                <label>
                                                    Filters:
                                                    <input
                                                        className='input-field'
                                                        type="number"
                                                        value={layer.filters || ''}
                                                        onChange={(e) =>
                                                            updateLayer(index, 'filters', parseInt(e.target.value))
                                                        }
                                                    />
                                                </label>
                                                <label>
                                                    Kernel Size:
                                                    <input
                                                        className='input-field'
                                                        type="text"
                                                        value={layer.kernel_size || ''}
                                                        onChange={(e) => updateLayer(index, 'kernel_size', e.target.value)}
                                                        placeholder="e.g., 3x3"
                                                    />
                                                </label>
                                                <label>
                                                    Strides:
                                                    <input
                                                        className='input-field'
                                                        type="text"
                                                        value={layer.strides || ''}
                                                        onChange={(e) => updateLayer(index, 'strides', e.target.value)}
                                                        placeholder="e.g., 1x1"
                                                    />
                                                </label>
                                                <label>
                                                    Activation:
                                                    <select
                                                        className='input-field'
                                                        value={layer.activation || ''}
                                                        onChange={(e) => updateLayer(index, 'activation', e.target.value)}
                                                    >
                                                        <option value="relu">ReLU</option>
                                                        <option value="sigmoid">Sigmoid</option>
                                                        <option value="softmax">Softmax</option>
                                                        <option value="tanh">Tanh</option>
                                                    </select>
                                                </label>
                                            </>
                                        )}
                                        {layer.type === 'Dropout' && (
                                            <label>
                                                Rate:
                                                <input
                                                    className='input-field'
                                                    type="number"
                                                    step="0.1"
                                                    value={layer.rate || ''}
                                                    onChange={(e) => updateLayer(index, 'rate', parseFloat(e.target.value))}
                                                />
                                            </label>
                                        )}
                                        {layer.type === 'MaxPooling2D' && (
                                            <label>
                                                Pool Size:
                                                <input
                                                    className='input-field'
                                                    type="text"
                                                    value={layer.pool_size || ''}
                                                    onChange={(e) => updateLayer(index, 'pool_size', e.target.value)}
                                                    placeholder="e.g., 2x2"
                                                />
                                            </label>
                                        )}
                                    </div>

                                    <div className="layer-buttons">
                                        <button onClick={() => removeLayer(index)}>-</button>
                                        <button onClick={() => addLayer(index)}>+</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Global Hyperparameters */}
                    <div className='global-hyperparameters'>
                        <h4>
                            <button onClick={() => setShowGlobalHyperparameters(!showGlobalHyperparameters)}>
                                {showGlobalHyperparameters ? '-' : 'Add Global Hyperparameters'}
                            </button>
                        </h4>
                        {showGlobalHyperparameters && (
                            <div className='hyperparameter-fields'>
                                <div className='field'>
                                    <label>
                                        Optimizer:
                                        <select
                                            className='input-field'
                                            value={optimizer}
                                            onChange={(e) => setOptimizer(e.target.value)}>
                                            <option value="adam">Adam</option>
                                            <option value="sgd">SGD</option>
                                            <option value="rmsprop">RMSProp</option>
                                        </select>
                                    </label>
                                </div>
                                <div className='field'>
                                    <label>
                                        Loss:
                                        <select
                                            className='input-field'
                                            value={loss}
                                            onChange={(e) => setLoss(e.target.value)}>
                                            <option value="categorical_crossentropy">Categorical Crossentropy</option>
                                            <option value="binary_crossentropy">Binary Crossentropy</option>
                                            <option value="mean_squared_error">Mean Squared Error</option>
                                        </select>
                                    </label>
                                </div>
                                <div className='field'>
                                    <label>
                                        Learning Rate:
                                        <input
                                            className='input-field'
                                            type="number"
                                            step="0.001"
                                            value={learningRate}
                                            onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                                        />
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Epochs */}
                    <div className="epochs-section">
                        <label>
                            Epochs:
                            <input
                                type="number"
                                min="1"
                                value={epochs}
                                onChange={(e) =>setEpochs(parseInt(e.target.value))}
                            />
                        </label>
                    </div>
                </>
            )}
            {/* Save Button */}
            <button className='save-button' onClick={saveModel}>Save Model</button>
        </div>



    );

};

export default ModelBuilder;