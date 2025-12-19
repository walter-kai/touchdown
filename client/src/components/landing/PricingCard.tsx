import React from 'react';

const PricingCard: React.FC = () => (
  <div className="bg-gradient-to-br from-bg-darker to-bg-dark border border-neon-cyan/30 rounded-xl shadow-lg p-6 w-96 mx-auto my-8">
    <h3 className="text-xl font-bold mb-4 text-neon-cyan text-center">📦 Per-Round Profit Commission</h3>
    <p className="text-text-light mb-4 text-center text-sm">
      Pay only when your bot makes profit. No monthly fees, no upfront costs.
    </p>
    
    <div className="space-y-3 mb-6">
      <div className="flex justify-between items-center p-3 bg-bg-dark rounded-lg">
        <span className="text-[#b8eaff]">$0 – $5</span>
        <span className="text-neon-cyan font-bold">2%</span>
      </div>
      <div className="flex justify-between items-center p-3 bg-bg-dark rounded-lg">
        <span className="text-[#b8eaff]">$5 – $50</span>
        <span className="text-neon-cyan font-bold">5%</span>
      </div>
      <div className="flex justify-between items-center p-3 bg-bg-dark rounded-lg">
        <span className="text-[#b8eaff]">$50 – $250</span>
        <span className="text-neon-cyan font-bold">10%</span>
      </div>
      <div className="flex justify-between items-center p-3 bg-bg-dark rounded-lg">
        <span className="text-[#b8eaff]">$250+</span>
        <span className="text-neon-cyan font-bold">15%</span>
      </div>
    </div>

    <div className="border-t border-neon-cyan/30 pt-4 mb-4">
      <h4 className="text-lg font-semibold text-neon-cyan mb-3">📌 Additional Features</h4>
      <ul className="ml-6 mt-2 text-[#b8eaff] list-none space-y-2 text-sm">
        <div className="flex items-center">
          <span role="img" aria-label="fee">💰</span>
          <li className="ml-4">Minimum $0.01 fee per successful round</li>
        </div>
        <div className="flex items-center">
          <span role="img" aria-label="split">🤝</span>
          <li className="ml-4">Bot creator revenue sharing (70/30 split)</li>
        </div>
        <div className="flex items-center">
          <span role="img" aria-label="cap">📊</span>
          <li className="ml-4">Monthly commission cap: max 1.5% of total profit</li>
        </div>
      </ul>
    </div>

    <button className="bg-neon-cyan text-bg-dark w-full px-4 py-3 rounded hover:bg-neon-pink-dark hover:text-white transition shadow-[0_0_8px_#00ffe7] hover:shadow-[0_0_16px_#ff005c] font-bold">
      Start Trading - No Upfront Cost
    </button>
  </div>
);

export default PricingCard;
