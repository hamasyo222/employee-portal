import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

const Button: React.FC<ButtonProps> = ({ children, ...props }) => (
  <button {...props} style={{ padding: '8px 16px', borderRadius: 4, background: '#2563eb', color: '#fff', border: 'none' }}>
    {children}
  </button>
);

export default Button; 