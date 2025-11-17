import React from 'react';
import { FaPlus } from 'react-icons/fa';

interface CreateBotCardProps {
  onClick: () => void;
}

const CreateBotCard: React.FC<CreateBotCardProps> = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className="relative flex flex-col items-center justify-center min-h-[180px] cursor-pointer"
      style={{
        background: "#181a23",
        borderRadius: "1rem",
        border: "4px solid #00ffe7",
        boxShadow: "0 0 32px #00ffe7",
        overflow: "hidden"
      }}
    >
      <div className="p-2 text-center">
        <div className="w-12 h-12 bg-[#00ffe7] text-[#181a23] text-3xl font-extrabold rounded-full flex items-center justify-center mx-auto mb-2 shadow-[0_0_8px_#00ffe7] border-4 border-[#00ffe7]/60">
          <FaPlus />
        </div>
        <h2 className="text-base font-bold text-[#00ffe7]">Create Bot</h2>
      </div>
    </div>
  );
};

export default CreateBotCard;
