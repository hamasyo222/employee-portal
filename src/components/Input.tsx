import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input: React.FC<InputProps> = (props) => (
  <input {...props} style={{ padding: '8px', borderRadius: 4, border: '1px solid #ccc' }} />
);

export default Input; 