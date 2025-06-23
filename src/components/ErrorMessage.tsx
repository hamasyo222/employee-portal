import React from 'react';

type ErrorMessageProps = {
  message: string;
};

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (
  <div style={{ color: 'red', margin: '8px 0' }}>{message}</div>
);

export default ErrorMessage; 