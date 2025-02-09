import React from 'react';
import PropTypes from 'prop-types';

const TrainingResponseDisplay = ({ responseData }) => {
    return (
        <div className="training-response-display" style={{ padding: "20px", border: "1px solid #ccc", borderRadius: "8px"}}>
            <h2>Training Response</h2>
            { responseData ? (
                <>
                  <p>{responseData.message}</p>
                  {responseData.validation && (
                    <div className="validation-metrics">
                        <p><strong>Loss:</strong> {responseData.validation.loss } </p>
                        <p><strong>Accuracy:</strong> {responseData.validation.accuracy} </p>
                    </div>
                  )}
                  {responseData.request_data && (
                    <div className="request-data">
                        <h3>Request Data:</h3>
                        <pre>{JSON.stringify(responseData.request_data, null, 2)}</pre>
                    </div>
                  )}
                </>
            ) : (
                <p>No training results available yet</p>
            )}
        </div>
    );
};

TrainingResponseDisplay.propTypes = {
    responseData: PropTypes.shape({
        message: PropTypes.string,
        validation: PropTypes.shape({
            loss: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
            accuracy: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        }),
        request_data: PropTypes.object,
    }),
};

export default TrainingResponseDisplay;