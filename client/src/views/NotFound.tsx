import React from 'react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1>404 - Page Not Found</h1>
      <p className="text-text-light">The page you are looking for doesn't exist.</p>
    </div>
  );
};

export default NotFound;
