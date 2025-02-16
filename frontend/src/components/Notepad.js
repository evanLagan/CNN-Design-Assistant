import React, { useState } from 'react';
import '../styles/Notepad.css';

const Notepad = () => {
  const [text, setText] = useState(''); // State to store the text

  const handleTextChange = (event) => {
    setText(event.target.value); // Update state when the text changes
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text) // Copy text to clipboard
      .then(() => alert('Text copied to clipboard!'))
      .catch((err) => alert('Failed to copy text:', err));
  };

  return (
    <div>
      <h2>Notepad</h2>
      <textarea
        value={text}
        onChange={handleTextChange}
        placeholder="Take notes and record training results here..."
        style={styles.textarea}
      />
      <div>
        <button className='notepad-btn' onClick={handleCopy}>
          Copy Text
        </button>
        <button className='notepad-btn' onClick={() => setText('')}>
          Clear
        </button>
      </div>
    </div>
  );
};

const styles = {
    textarea: {
        width: '97%',    
        height: '400px',   
        padding: '15px',   
        fontSize: '16px',  
        fontFamily: 'Arial, sans-serif', 
        borderRadius: '5px',  
        border: '1px solid #ddd', 
        outline: 'none',  
        resize: 'vertical', 
      },
}


export default Notepad;