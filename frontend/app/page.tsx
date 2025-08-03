'use client';

import { useState } from 'react';
import Header from './components/Header/Header';
import Sidebar, { TabType } from './components/Sidebar/Sidebar';
import MainPanel from './components/MainPanel/MainPanel';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('user');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header />
      
      {/* Body: Sidebar + MainPanel */}
      <div className="flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <MainPanel activeTab={activeTab} />
      </div>
    </div>
  );
}
