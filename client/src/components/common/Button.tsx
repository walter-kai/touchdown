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
        bg-[#00ffe7] text-[#181a23] font-bold py-2 px-4 rounded transition duration-200
        hover:bg-[#ff005c] hover:text-white shadow-[0_0_8px_#00ffe7] hover:shadow-[0_0_16px_#ff005c]
        ${className}
      `}
    >
      {label}
    </button>
  );
};

export default Button;
