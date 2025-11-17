import React, { useState, useEffect } from 'react';

const RandomRobohashCard: React.FC = () => {
  const [currentId, setCurrentId] = useState<number>(Math.floor(Math.random() * 10000));

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentId(Math.floor(Math.random() * 10000));
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-neon-darker border border-neon-cyan/30 rounded-xl shadow-[0_0_16px_#faafe8] max-w-xs mx-auto">
        {/* <div className="relative"> */}
          <img
            src={`https://robohash.org/${currentId}?set=set1&size=150x150`}
            alt={`Random bot ${currentId}`}
            className="w-16 h-16 mx-auto rounded-lg border-2 border-neon-cyan shadow-md bg-neon-dark transition-all duration-500"
          />
          {/* <div className="absolute -bottom-2 -right-2 bg-neon-cyan text-neon-dark text-xs font-bold px-2 py-1 rounded-full">
            #{currentId}
          </div> */}
        {/* </div> */}
      
    </div>
  );
};

export default RandomRobohashCard;
