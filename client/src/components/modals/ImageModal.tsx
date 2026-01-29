import React from 'react';

interface ImageModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, imageUrl, onClose }) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
      <div className="relative max-w-3xl mx-auto">
        <img src={imageUrl} alt="Full view" className="max-w-full max-h-screen object-contain" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white text-2xl bg-transparent border-none cursor-pointer"
          aria-label="Close modal"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default ImageModal;
