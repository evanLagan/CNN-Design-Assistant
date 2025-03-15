import React, { useState } from 'react';
import '../styles/ModelBuilder.css';

const ModelBuilder = ({ onSaveModel, onTrainModel, isTraining, onGetModelCode }) => {
    const [layers, setLayers] = useState([]);
    const [inputShape, setInputShape] = useState('224, 224, 3');
    const [optimizer, setOptimizer] = useState('Adam');
    const [loss, setLoss] = useState('categorical_crossentropy');
    const [learningRate, setLearningRate] = useState(0.001);
    const [modeIntialised, setModelInitialised] = useState(false);
    const [epochs, setEpochs] = useState(10);
    
    // Displaying Errors in the UI
    const [errors, setErrors] = useState({})
    const [validationMessages, setValidationMessages] = useState([]);


    // State for python model code pop-up
    const [modalOpen, setModalOpen] = useState(false);
    const [modelCode, setModelCode] = useState('');

    // Tooltip state for displaying both layer and global hyperparameters
    const [tooltip, setTooltip] = useState({
        visible: false,
        text: '',
        x: 0,
        y: 0
    });

    // Mapping layer types to their descriptions for tooltips (Need to add more)
    const layerDescriptions = {
        Dense: "A fully connected layer where every input is connected to every output. When used as the final layer, ensure the number of units matches the number of classes in the dataset.",
        Conv2D: "A spatial feature extractor, building complex representations by aggregating local information through strided kernel operations.",
        MaxPooling2D: "A pooling layer that downsamples the input to reduce spatial dimensions.",
        Flatten: "Flattens the multi-dimensional input into a 1d array.",
        BatchNormalization: "Normalizes activations to speed up training. Typically added after convolutional or dense layers to improve training stability",
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
            BatchNormalization: { type: 'BatchNormalization' },
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
                BatchNormalization: { type: 'BatchNormalization' },
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

    // Validate input format for strides, kernel size and pooling layers
    const validateNumXNum = (value) => {
        return /^\d+x\d+$/.test(value); // Ensures the format "number x number"
    } 

    // Validate layer compatability
    const validateLayerCompatability = () => {
        let errors = [];

        if (layers.length === 0){
            errors.push("The model must have at least one layer.");
        }
        if (layers.length > 0 && layers[0].type !== "Conv2D") {
            errors.push("The first layer must be a Conv2D layer");
        }

        let hasFlatten = false;
        for (let i = 0; i < layers.length; i++){
            const layer = layers[i];
            const prevLayer = layers[i - 1] || null;

            if(layer.type === "Conv2D" && prevLayer?.type === "Dense") {
                errors.push("A Conv2D layer cannot follow a Dense layer.");
            }
            if(layer.type === "Dense" && !hasFlatten) {
                errors.push("A Dense layer must come after a Flatten layer.");
            }
            if(layer.type === "MaxPooling2D" && prevLayer?.type !== "Conv2D" && prevLayer?.type !== "BatchNormalization"){
                errors.push("MaxPooling2D must follow a Conv2D or BatchNormalization layer");
            }
            if(i === 0 && layer.type === "Dropout") {
                errors.push("Dropout cannot be the first layer.");
            }
            if (layer.type === "BatchNormalization" && prevLayer?.type !== "Conv2D" && prevLayer?.type !== "MaxPooling2D"){
                errors.push("BatchNormalization must follow a Conv2D or MaxPooling2D layer.");
            }

            if(layer.type === "Flatten"){
                hasFlatten = true;
            }
        }

        // Ensure the final layer is a Dense Layer
        const lastLayer = layers[layers.length - 1];
        if (!lastLayer || lastLayer.type !== "Dense"){
            errors.push("The final layer must be a Dense Layer.");
        } 

        setValidationMessages(errors);
        return errors;
    };


    //Saving the model
    const saveModel = () => {
        const validationErrors = validateLayerCompatability();

        if (validationErrors.length > 0) {
            alert("Model Cofiguration Invalid");
            return;
        }

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

    // Getting model code
    const handleGetModelCode = async () => {
        const config = {
            inputShape,
            layers,
            optimizer,
            loss,
            learningRate,
        };

        try {
            const code = await onGetModelCode(config);
            setModelCode(code);
            setModalOpen(true);
        } catch (error) {
            alert('Failed to fetch model code');
        }
    };

    // Copying to clipboard
    const handleCopy = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(modelCode)
              .then(() => alert('Model code copied to clipboard!'))
              .catch(err => alert('Failed to copy text: ' + err));
        } else {
            alert('Clipboard API not available');
        }
    };


    return (
        <div className="model-builder">
            <h1>Model Builder</h1>

            {/*Initial Add Layer button */}
            {!modeIntialised || layers.length === 0 ? (
                <>
                    <button className="mb-build-model-btn" onClick={initialiseModel}>Build Model</button>
                    <button className="mb-build-model-btn" onClick={loadGenericCNN}>Load Generic CNN</button>
                </>

            ) : null}

            {/*Input Layer, Layers, and Global Hyperparameters */}

            {modeIntialised && layers.length > 0 && (
                <>
                    {/*Input Layer */}
                    <div className='input-layer'>
                        <label className='input-label'>
                            Input Shape:
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <input
                                    className='input-field'
                                    type="text"
                                    value={inputShape}
                                    onChange={(e) => setInputShape(e.target.value)}
                                    placeholder="224, 224, 3"
                                />
                                <span
                                    className="info-icon"
                                    style={{ marginLeft: "8px", cursor: 'pointer' }}
                                    onMouseEnter={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setTooltip({
                                            visible: true,
                                            text: 'Image Dimensions: (Height (pixels), Width (pixels), Channels ( 3 = "RGB", 1 = "greyscale" ))',
                                            x: rect.right + 10,
                                            y: rect.top,
                                        })
                                    }}
                                    onMouseLeave={() => {
                                        setTooltip({ visible: false, text: '', x: 0, y: 0 });
                                    }}
                                >
                                    ℹ️
                                </span>
                            </div>
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
                                                    setTooltip({ visible: false, text: '', x: 0, y: 0 })
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
                                                        min="1"
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
                                                        min="1"
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
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            updateLayer(index, 'kernel_size', value);

                                                            setErrors((prevErrors) => ({
                                                                ...prevErrors,
                                                                [index]: {
                                                                    ...prevErrors[index],
                                                                    kernel_size: validateNumXNum(value) ? '' : 'Format must be NUMxNUM'
                                                                }
                                                            }));
                                                        }}
                                                        placeholder="e.g., 3x3"
                                                    />
                                                {errors[index]?.kernel_size && <p className='error-message'>{errors[index].kernel_size}</p>}
                                                </label>
                                                <label>
                                                    Strides:
                                                    <input
                                                        className='input-field'
                                                        type="text"
                                                        value={layer.strides || ''}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            updateLayer(index, 'strides', value);

                                                            setErrors((prevErrors) => ({
                                                                ...prevErrors,
                                                                [index]: {
                                                                    ...prevErrors[index],
                                                                    strides: validateNumXNum(value) ? '' : 'Format must be NUMxNUM'
                                                                }
                                                            }));
                                                        }}
                                                        placeholder='e.g., 1x1'
                                                    />
                                                    {errors[index]?.strides && <p className="error-message">{errors[index].strides}</p>}
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
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        updateLayer(index, 'pool_size', value);

                                                        setErrors((prevErrors) => ({
                                                            ...prevErrors,
                                                            [index]: {
                                                                ...prevErrors[index],
                                                                pool_size: validateNumXNum(value) ? '' : 'Format must be NUMxNUM'
                                                            }
                                                        }));
                                                    }}
                                                    placeholder="e.g., 2x2"
                                                />
                                                {errors[index]?.pool_size && <p className="error-message">{errors[index].pool_size}</p>}
                                            </label>
                                        )}
                                    </div>

                                    <div className="layer-buttons">
                                        <button className='mb-remove' onClick={() => removeLayer(index)}>-</button>
                                        <button className='mb-add' onClick={() => addLayer(index)}>+</button>
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
                                        <option value="Adam">Adam</option>
                                        <option value="SGD">SGD</option>
                                        <option value="RMSprop">RMSProp</option>
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
                                        min="0.001"
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
                                style={{
                                    border: epochs > 15 ? '2px solid red' : '1px solid #ccc',
                                    outline: epochs > 15 ? 'none' : undefined,
                                }}
                            />
                        </label>
                        {epochs > 15 && (
                            <p style={{ color: 'black', fontSize: '0.9em', zIndex: 10, top: '100%' }}>
                                Ensure you have access to a machine with sufficient GPU power.
                            </p>
                        )}
                    </div>
                </>
            )}
            {modeIntialised && (
                <>
                    <button className='save-button' onClick={saveModel}>Save Model</button>
                    <button
                        className="train-button"
                        onClick={() => onTrainModel({ inputShape, layers, optimizer, loss, learningRate, epochs })}
                        disabled={isTraining}
                        style={{ marginLeft: '8px'}}
                    >
                        {isTraining ? 'Training...' : 'Train Model'}
                    </button>

                    <button 
                        className="get-model-code-button"
                        onClick={handleGetModelCode}
                        style={{ marginLeft: '8px'}}
                    > Generate Python Code </button>

                    {isTraining && <div className="spinner"></div>}

                </>
            )}

            {/* Layer Validation Messages */}
            {validationMessages.length > 0 && (
                <div className="validation-messages">
                    <h3>Model Validation Issues:</h3>
                    <ul>
                        {validationMessages.map((msg, index) => (
                            <li key={index} style={{ color: 'red', fontSize: '0.9em'}}>{msg}</li>
                        ))}
                    </ul>
                </div>
            )}

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

            {/* Modal fo displaying model code */}
            {modalOpen && (
                <div className='modal-overlay' onClick={() => setModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Generated Model Code</h2>
                        <pre style={{ background: '#f4f4f4', padding: '10px', borderRadius: '4px', maxHeight: '400px', overflow: 'auto' }}>
                            {modelCode}
                        </pre>
                        <button className='mb-copy' onClick={handleCopy}>Copy</button>
                        <button className='mb-close' onClick={() => setModalOpen(false)} style={{ marginLeft: '4px'}}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );

};

export default ModelBuilder;