// Loading.tsx
import React from 'react';

export const Loading: React.FC = () => {

  return (
    <div className='center-items my-4'>
      <h1 className="text-center my-4">Not logged in yet!</h1>
      <img className="w-[200px] mx-auto" src="/Owly-character-wink-nudge-nocturn.gif" alt="Owly" />
      <p className="text-center">Redirecting to NextDoor authentication...</p>
    </div>
  );
};

