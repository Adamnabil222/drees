
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full max-w-7xl text-center mb-8">
      <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
        VirtualDresser
      </h1>
      <p className="text-lg text-gray-400 mt-2">غرفة القياس الافتراضية الذكية</p>
    </header>
  );
};

export default Header;
