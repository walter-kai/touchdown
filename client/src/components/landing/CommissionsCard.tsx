import React from 'react';

const CommissionsCard: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#0fffd7]/10 via-[#23263a]/80 to-[#faafe8]/10">
    <h1 className="text-5xl font-bold text-[#00ffe7] mb-8 text-center drop-shadow-[0_0_16px_#00ffe7] tracking-wide">
      Commissions & Revenue Sharing
    </h1>
    <p className="text-xl text-[#faafe8] mb-12 text-center max-w-2xl">
      Learn how commissions work for both bot users and creators on Dexter City. Transparent, fair, and designed to reward performance.
    </p>
    <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-8 items-stretch">
      {/* Using a Bot Section */}
      <div className="flex-1 flex flex-col bg-[#181a23]/80 rounded-xl border-2 border-[#00ffe7]/30 shadow-lg p-6 min-w-[220px]">
        <h3 className="text-2xl font-bold mb-4 text-[#00ffe7] text-center drop-shadow-[0_0_8px_#00ffe7]">💸 Using a Bot</h3>
        <p className="text-[#e0e7ef] mb-4 text-center text-sm">
          Pay only when your bot makes profit. No monthly fees, no upfront costs.
        </p>
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center p-3 bg-[#23263a] rounded-lg">
            <span className="text-[#b8eaff]">$0 – $5</span>
            <span className="text-[#00ffe7] font-bold">2%</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-[#23263a] rounded-lg">
            <span className="text-[#b8eaff]">$5 – $50</span>
            <span className="text-[#00ffe7] font-bold">5%</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-[#23263a] rounded-lg">
            <span className="text-[#b8eaff]">$50 – $250</span>
            <span className="text-[#00ffe7] font-bold">10%</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-[#23263a] rounded-lg">
            <span className="text-[#b8eaff]">$250+</span>
            <span className="text-[#00ffe7] font-bold">15%</span>
          </div>
        </div>
        <div className="border-t border-[#00ffe7]/30 pt-4 mb-2">
          <ul className="ml-2 mt-2 text-[#b8eaff] list-none space-y-2 text-sm">
            <li className="flex items-center gap-2"><span role="img" aria-label="fee">💰</span> Minimum $0.01 fee per successful round</li>
            <li className="flex items-center gap-2"><span role="img" aria-label="cap">📊</span> Monthly commission cap: max 1.5% of total profit</li>
          </ul>
        </div>
      </div>
      {/* Selling a Bot Section */}
      <div className="flex-1 flex flex-col bg-[#181a23]/80 rounded-xl border-2 border-[#faafe8]/30 shadow-lg p-6 min-w-[220px]">
        <h3 className="text-2xl font-bold mb-4 text-[#faafe8] text-center drop-shadow-[0_0_8px_#faafe8]">🤝 Selling a Bot</h3>
        <p className="text-[#e0e7ef] mb-4 text-center text-sm">
          Bot creators receive 70% of the commission, platform receives 30%.
        </p>
        <div className="flex justify-center items-center gap-2 mb-6">
          <span className="bg-[#23263a] px-3 py-1 rounded text-[#00ffe7] font-bold">70%</span>
          <span className="text-[#e0e7ef]">to Creator</span>
          <span className="bg-[#23263a] px-3 py-1 rounded text-[#faafe8] font-bold">30%</span>
          <span className="text-[#e0e7ef]">to Platform</span>
        </div>
        <div className="border-t border-[#faafe8]/30 pt-4 mb-2">
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
