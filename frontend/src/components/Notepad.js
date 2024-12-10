import React, { useState } from 'react';

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
        placeholder="Type your notes here..."
        style={styles.textarea}
      />
      <div>
        <button onClick={handleCopy}>
          Copy Text
        </button>
        <button onClick={() => setText('')}>
          Clear
        </button>
      </div>
    </div>
  );
};

const styles = {
    textarea: {
        width: '97%',     // Makes the text area take the full width of its container
        height: '400px',   // Larger height for more visible content
        padding: '15px',   // Adds inner spacing for better text readability
        fontSize: '16px',  // Makes the text more legible
        fontFamily: 'Arial, sans-serif', // Sets a clean font for notes
        borderRadius: '5px',  // Slightly rounded corners
        border: '1px solid #ddd', // Subtle border
        outline: 'none',   // Removes default outline
        resize: 'vertical', // Allows vertical resizing
      },
}


export default Notepad;