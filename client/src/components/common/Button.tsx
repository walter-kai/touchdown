import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string; // for additional custom styles
}

const Button: React.FC<ButtonProps> = ({ label, onClick, type = 'button', className = '' }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`
        bg-neon-cyan text-bg-dark font-bold py-2 px-4 rounded transition duration-200
        hover:bg-neon-pink-dark hover:text-white shadow-[0_0_8px] shadow-neon-cyan hover:shadow-[0_0_16px] hover:shadow-neon-pink-dark
        ${className}
      `}
    >
      {label}
    </button>
  );
};

export default Button;
