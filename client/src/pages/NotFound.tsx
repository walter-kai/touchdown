import React from 'react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-[#00ffe7] drop-shadow-[0_0_8px_#00ffe7]">404 - Page Not Found</h1>
      <p className="text-[#e0e7ef]">The page you are looking for doesn't exist.</p>
    </div>
  );
};

export default NotFound;
