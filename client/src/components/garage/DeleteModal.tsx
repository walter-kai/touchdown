import React from 'react';
import { FaTrash } from 'react-icons/fa';

interface DeleteModalProps {
  botName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ botName, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-[#23263a] w-full max-w-md rounded-2xl p-10 relative border-4 border-[#00ffe7]/40 shadow-[0_0_48px_#00ffe7] hud-panel">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#ff005c]">
          Are you sure you want to delete <span className="text-[#00ffe7]">{botName}</span>?
        </h2>
        <div className="flex justify-between gap-4">
          <button
            onClick={onConfirm}
            className="btn-hud bg-red-500 text-white border-red-400 hover:bg-red-600"
          >
            <FaTrash />
            Yes
          </button>
          <button
            onClick={onCancel}
            className="btn-hud bg-gray-500 text-white border-gray-400 hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
