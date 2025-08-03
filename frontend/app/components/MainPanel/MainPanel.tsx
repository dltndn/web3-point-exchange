'use client';

import { TabType } from '../Sidebar/Sidebar';
import UserPanel from '../UserPanel/UserPanel';
import PointPanel from '../PointPanel/PointPanel';
import SwapPanel from '../SwapPanel/SwapPanel';
import HistoryPanel from '../HistoryPanel/HistoryPanel';

interface MainPanelProps {
  activeTab: TabType;
}

export default function MainPanel({ activeTab }: MainPanelProps) {
  const renderPanel = () => {
    switch (activeTab) {
      case 'user':
        return <UserPanel />;
      case 'point':
        return <PointPanel />;
      case 'swap':
        return <SwapPanel />;
      case 'history':
        return <HistoryPanel />;
      default:
        return <UserPanel />;
    }
  };

  return (
    <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      {renderPanel()}
    </main>
  );
}
