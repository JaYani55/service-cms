import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import FAQ from '@/components/Info/FAQ';
import Legal from '@/components/Info/Legal';

const Info = () => {
  const { language, theme } = useTheme();
  const [activeTab, setActiveTab] = useState('faq');

  const tabClasses = (tab) =>
    `px-4 py-2 -mb-px border-b-2 font-medium cursor-pointer ${
      activeTab === tab
        ? theme === 'dark'
          ? 'border-blue-500 text-blue-500'
          : 'border-blue-600 text-blue-600'
        : theme === 'dark'
        ? 'border-transparent text-gray-400 hover:text-gray-200'
        : 'border-transparent text-gray-500 hover:text-gray-700'
    }`;

  return (
    <main
      className={`min-h-screen py-10 px-4 sm:px-6 lg:px-8 ${
        theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
      }`}
      tabIndex={-1}
    >
      <div className="max-w-3xl mx-auto">
        {/* Tab List */}
        <div
          role="tablist"
          aria-label="Info navigation"
          className="flex border-b border-gray-200 dark:border-gray-700 mb-6"
        >
          <button
            role="tab"
            id="tab-faq"
            aria-controls="panel-faq"
            aria-selected={activeTab === 'faq'}
            onClick={() => setActiveTab('faq')}
            className={tabClasses('faq')}
          >
            {language === 'en' ? 'FAQ' : 'FAQ'}
          </button>

          <button
            role="tab"
            id="tab-legal"
            aria-controls="panel-legal"
            aria-selected={activeTab === 'legal'}
            onClick={() => setActiveTab('legal')}
            className={tabClasses('legal')}
          >
            Legal
          </button>
        </div>

        {/* Panels */}
        <div
          id="panel-faq"
          role="tabpanel"
          aria-labelledby="tab-faq"
          hidden={activeTab !== 'faq'}
        >
          <FAQ />
        </div>

        <div
          id="panel-legal"
          role="tabpanel"
          aria-labelledby="tab-legal"
          hidden={activeTab !== 'legal'}
        >
          <Legal />
        </div>
      </div>
    </main>
  );
};

export default Info;
