import React from 'react';

const TestimonialCard: React.FC = () => (
  <div className="bg-bg-darker rounded-xl shadow-md p-6 max-w-xl mx-auto my-8 flex flex-col items-center border border-neon-cyan/30">
    <img
      src="https://randomuser.me/api/portraits/men/32.jpg"
      alt="User"
      className="w-16 h-16 rounded-full mb-3 border-2 border-neon-cyan"
    />
    <p className="italic text-text-light mb-2">
      "Dexter City made it so easy to launch my first trading bot. The dashboard
      is intuitive and the community is super helpful!"
    </p>
    <div className="font-semibold text-neon-cyan">Alex T., Early Adopter</div>
  </div>
);

export default TestimonialCard;
