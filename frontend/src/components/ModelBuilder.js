import React, { useState } from 'react';
import '../styles/ModelBuilder.css';

const ModelBuilder = ({ onSaveModel, onTrainModel, isTraining }) => {
    const [layers, setLayers] = useState([]);
    const [inputShape, setInputShape] = useState('32, 32, 3');
    const [optimizer, setOptimizer] = useState('adam');
    const [loss, setLoss] = useState('categorical_crossentropy');
    const [learningRate, setLearningRate] = useState(0.001);
    //const [showGlobalHyperparameters, setShowGlobalHyperparameters] = useState(true);
    const [modeIntialised, setModelInitialised] = useState(false);
    const [epochs, setEpochs] = useState(10);

    // Tooltip state for displaying both layer and global hyperparameters
    const [tooltip, setTooltip] = useState({
        visible: false,
        text: '',
        x: 0,
        y: 0
    });

    // Mapping layer types to their descriptions for tooltips (Need to add more)
    const layerDescriptions = {
        Dense: "A fully connected layer where every input is connected to every output.",
        Conv2D: "A spatial feature extractor, building complex representations by aggregating local information through strided kernel operations.",
        MaxPooling2D: "A pooling layer that downsamples the input to reduce spatial dimensions.",
        Flatten: "Flattens the multi-dimensional input into a 1d array.",
        BatchNormalization: "Normalizes activations to speed up training.",
        ReLu: "Applies the Rectified Linear Unit activation function.",
        Droput: "Randomly disables a fraction of neurons during training to prevent overfitting.",
    }

    // Mapping global hyperparameters to their descriptions 
    const globalHyperDescriptions = {
        optimizer: "This determines how the model weights are updated during training. Increasing speeds up convergence but risks instability. Decreasing enhances stability but may lead to slow training.",
        loss: "Calculates the error between the predicted and true values.",
        learningRate: "Controls how much the model is adjusted during training",
    };

    //Adding a new layer
    const addLayer = (index = null) => {
        const defaultConfigs = {
            // Need to add more
            Dense: { type: 'Dense', units: 128, activation: 'relu' },
            Conv2D: { type: 'Conv2D', filters: 32, kernel_size: '3x3', strides: '1x1', activation: 'relu' },
            MaxPooling2D: { type: 'MaxPooling2D', pool_size: '2x2' },
            Flatten: { type: 'Flatten' },
            Dropout: { type: 'Dropout', rate: 0.5 },

            // Need to test these on the backend
            BatchNormalization: { type: 'BatchNormalization'},
            ReLU: { type: 'ReLU'},
        };
        const newLayer = defaultConfigs['Conv2D'];
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

    const updateLayer = (index, field, value) => {
        const newLayers = [...layers];
        if (field === 'type') {
            const defaultConfigs = {
                Dense: { type: 'Dense', units: 128, activation: 'relu' },
                Conv2D: { type: 'Conv2D', filters: 32, kernel_size: '3x3', strides: '1x1', activation: 'relu' },
                MaxPooling2D: { type: 'MaxPooling2D', pool_size: '2x2' },
                Flatten: { type: 'Flatten' },
                Dropout: { type: 'Dropout', rate: 0.5 },

                //New need to test
                BatchNormalization: { type: 'BatchNormalization'},
                ReLU: { type: 'ReLU'},
            };
            newLayers[index] = defaultConfigs[value]; // Reset to the default configuration
        } else {
            // For other fields, simply update the existing value
            newLayers[index][field] = value;
        }
        setLayers(newLayers);
    };

    // Handlers for global hyperparameter tooltip on the info icons
    const handleGlobalFieldMouseEnter = (event, fieldName) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setTooltip({
            visible: true,
            text: globalHyperDescriptions[fieldName],
            x: rect.right + 10,
            y: rect.top,
        });
    };

    const handleGlobalFieldMouseLeave = () => {
        setTooltip({ visible: false, text: '', x: 0, y: 0 });
    };

    // Function to load a generic CNN Model
    const loadGenericCNN = () => {
        const genericCNN = [
            { type: 'Conv2D', filters: 32, kernel_size: '3x3', strides: '1x1', activation: 'relu' },
            { type: 'MaxPooling2D', pool_size: '2x2' },
            { type: 'Conv2D', filters: 64, kernel_size: '3x3', strides: '1x1', activation: 'relu' },
            { type: 'MaxPooling2D', pool_size: '2x2' },
            { type: 'Flatten' },
            { type: 'Dense', units: 128, activation: 'relu' },
            { type: 'Dense', units: 10, activation: 'softmax' },
        ];
        setModelInitialised(true);
        setLayers(genericCNN);
        setInputShape('224, 224, 3');
    };


    //Saving the model
    const saveModel = () => {
        const modelConfig = {
            input_shape: inputShape,
            layers,
            optimizer,
            loss,
            learning_rate: learningRate,
        };

        onSaveModel(modelConfig);
        console.log('Model configuration saved:', modelConfig);
        alert('Model configuration saved');
    };


    return (
        <div className="model-builder">
            <h1>Model Builder</h1>

            {/*Initial Add Layer button */}
            {!modeIntialised || layers.length === 0 ? (
                <>
                  <button onClick={initialiseModel}>Build Model</button>
                  <button onClick={loadGenericCNN}>Load Generic CNN</button>
                </>
                
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
                                            {/* Info button for this layer */}
                                            <span
                                              className="info-icon"
                                              style={{ marginLeft: '8px', cursor: 'pointer' }}
                                              onMouseEnter={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const description = layerDescriptions[layer.type] || "No description available.";
                                                setTooltip({
                                                    visible: true,
                                                    text: description,
                                                    x: rect.right + 10,
                                                    y: rect.top,
                                                });
                                              }}
                                            onMouseLeave={() => {
                                                setTooltip({ visible: false, text: '', x: 0, y:0})
                                            }}
                                            >
                                                 ℹ️
                                            </span>
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
                        <h4>Global Hyperparameters</h4>
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
                                    <span
                                        className="info-icon"
                                        onMouseEnter={(e) => handleGlobalFieldMouseEnter(e, 'optimizer')}
                                        onMouseLeave={handleGlobalFieldMouseLeave}
                                    >
                                        ℹ️
                                    </span>
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
                                    <span
                                        className="info-icon"
                                        onMouseEnter={(e) => handleGlobalFieldMouseEnter(e, 'loss')}
                                        onMouseLeave={handleGlobalFieldMouseLeave}
                                    >
                                        ℹ️
                                    </span>
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
                                    <span
                                        className="info-icon"
                                        onMouseEnter={(e) => handleGlobalFieldMouseEnter(e, 'learningRate')}
                                        onMouseLeave={handleGlobalFieldMouseLeave}
                                    >
                                        ℹ️
                                    </span>
                                </label>
                            </div>
                        </div>

                    </div>

                    {/* Epochs */}
                    <div className="epochs-section">
                        <label>
                            Epochs:
                            <input
                                type="number"
                                min="1"
                                value={epochs}
                                onChange={(e) => setEpochs(parseInt(e.target.value))}
                            />
                        </label>
                    </div>
                </>
            )}
            {/* Save Button */}
            <button className='save-button' onClick={saveModel}>Save Model</button>

            {/* Train Button */}
            <button
                className="train-button"
                onClick={() => onTrainModel({ inputShape, layers, optimizer, loss, learningRate, epochs })}
                disabled={isTraining}
            >
                {isTraining ? 'Training...' : 'Train Model'}
            </button>
            {isTraining && <div className="spinner"></div>}

            {/* Tooltip Element */}
            {tooltip.visible && (
                <div
                    className="tooltip"
                    style={{
                        position: 'absolute',
                        top: tooltip.y,
                        left: tooltip.x,
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        color: '#fff',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        pointerEvents: 'none',
                        zIndex: 1000,
                    }}
                >
                    {tooltip.text}
                </div>
            )}
        </div>
    );

};

export default ModelBuilder;