'use client';

export type TabType = 'user' | 'point' | 'swap' | 'history';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: 'user' as TabType, label: '유저', icon: '👤' },
  { id: 'point' as TabType, label: '포인트', icon: '🪙' },
  { id: 'swap' as TabType, label: '교환', icon: '🔄' },
  { id: 'history' as TabType, label: '내역', icon: '📜' },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4">
      <nav className="space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          시스템 정보
        </h3>
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <p>• 1 BloomToken = 100 Points</p>
          <p>• Base Sepolia 네트워크</p>
          <p>• EIP712 서명 사용</p>
        </div>
      </div>
    </aside>
  );
}
