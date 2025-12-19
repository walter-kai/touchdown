import React from 'react';

const CommissionsCard: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-neon-cyan/10 via-bg-darker/80 to-neon-pink/10">
    <h1>
      Commissions & Revenue Sharing
    </h1>
    <p className="text-xl text-neon-pink mb-12 text-center max-w-2xl">
      Learn how commissions work for both bot users and creators on Dexter City. Transparent, fair, and designed to reward performance.
    </p>
    <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-8 items-stretch">
      {/* Using a Bot Section */}
      <div className="flex-1 flex flex-col bg-bg-dark/80 rounded-xl border-2 border-neon-cyan/30 shadow-lg p-6 min-w-[220px]">
        <h3 className="text-2xl font-bold mb-4 text-neon-cyan text-center drop-shadow-[0_0_8px_#00ffe7]">💸 Using a Bot</h3>
        <p className="text-text-light mb-4 text-center text-sm">
          Pay only when your bot makes profit. No monthly fees, no upfront costs.
        </p>
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center p-3 bg-bg-darker rounded-lg">
            <span className="text-[#b8eaff]">$0 – $5</span>
            <span className="text-neon-cyan font-bold">2%</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-bg-darker rounded-lg">
            <span className="text-[#b8eaff]">$5 – $50</span>
            <span className="text-neon-cyan font-bold">5%</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-bg-darker rounded-lg">
            <span className="text-[#b8eaff]">$50 – $250</span>
            <span className="text-neon-cyan font-bold">10%</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-bg-darker rounded-lg">
            <span className="text-[#b8eaff]">$250+</span>
            <span className="text-neon-cyan font-bold">15%</span>
          </div>
        </div>
        <div className="border-t border-neon-cyan/30 pt-4 mb-2">
          <ul className="ml-2 mt-2 text-[#b8eaff] list-none space-y-2 text-sm">
            <li className="flex items-center gap-2"><span role="img" aria-label="fee">💰</span> Minimum $0.01 fee per successful round</li>
            <li className="flex items-center gap-2"><span role="img" aria-label="cap">📊</span> Monthly commission cap: max 1.5% of total profit</li>
          </ul>
        </div>
      </div>
      {/* Selling a Bot Section */}
      <div className="flex-1 flex flex-col bg-bg-dark/80 rounded-xl border-2 border-neon-pink/30 shadow-lg p-6 min-w-[220px]">
        <h3 className="text-2xl font-bold mb-4 text-neon-pink text-center drop-shadow-[0_0_8px_#faafe8]">🤝 Selling a Bot</h3>
        <p className="text-text-light mb-4 text-center text-sm">
          Bot creators receive 70% of the commission, platform receives 30%.
        </p>
        <div className="flex justify-center items-center gap-2 mb-6">
          <span className="bg-bg-darker px-3 py-1 rounded text-neon-cyan font-bold">70%</span>
          <span className="text-text-light">to Creator</span>
          <span className="bg-bg-darker px-3 py-1 rounded text-neon-pink font-bold">30%</span>
          <span className="text-text-light">to Platform</span>
        </div>
        <div className="border-t border-neon-pink/30 pt-4 mb-2">
          <ul className="ml-2 mt-2 text-[#b8eaff] list-none space-y-2 text-sm">
            <li className="flex items-center gap-2"><span role="img" aria-label="split">🔗</span> Revenue sharing is automatic and transparent</li>
            <li className="flex items-center gap-2"><span role="img" aria-label="support">🛠️</span> Platform support for bot creators</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

export default CommissionsCard;
