import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-[#00ffe7] drop-shadow-[0_0_8px_#00ffe7] mb-8">
        Privacy Policy
      </h1>
      
      <div className="bg-[#23263a] border border-[#00ffe7]/30 rounded-lg p-6 text-[#e0e7ef] space-y-6">
        <section>
          <h2 className="text-xl font-bold text-[#00ffe7] mb-4">Information We Collect</h2>
          <p>
            We collect information you provide directly to us, such as when you create an account, 
            connect your wallet, or contact us for support.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-bold text-[#00ffe7] mb-4">How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>To provide and maintain our services</li>
            <li>To process transactions and send related information</li>
            <li>To send technical notices and support messages</li>
            <li>To improve our services and develop new features</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-xl font-bold text-[#00ffe7] mb-4">Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information against 
            unauthorized access, alteration, disclosure, or destruction.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-bold text-[#00ffe7] mb-4">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at support@dextercity.com.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
