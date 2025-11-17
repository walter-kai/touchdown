import React from 'react';
import { FaTimes, FaCheckCircle } from 'react-icons/fa';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-[#23263a] w-full max-w-md rounded-2xl p-10 relative border-4 border-[#00ffe7]/40 shadow-[0_0_48px_#00ffe7] hud-panel flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-[#181a23] p-2 rounded-full hover:bg-[#00ffe7] hover:text-[#181a23] text-[#00ffe7] border-2 border-[#00ffe7] transition-all text-xl"
          aria-label="Close"
        >
          <FaTimes />
        </button>
        <FaCheckCircle className="text-green-400 text-5xl mb-4" />
        <h2 className="text-2xl font-bold text-[#00ffe7] mb-2">
          Checkout Complete!
        </h2>
        <div className="text-[#e0e7ef] text-center mb-4">
          Thank you for your purchase.
          <br />
          Your bots will be available in your{' '}
          <span className="text-[#00ffe7] font-bold">Garage</span>.
        </div>
        <button
          onClick={onClose}
          className="hud-btn bg-[#00ffe7] text-[#181a23] px-6 py-2 rounded-lg font-bold uppercase shadow-[0_0_8px_#00ffe7] hover:bg-[#ff005c] hover:text-white hover:shadow-[0_0_16px_#ff005c] transition-all border-2 border-[#00ffe7] text-lg"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default CheckoutModal;
