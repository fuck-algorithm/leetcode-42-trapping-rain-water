import React from 'react';
import './TabControl.css';

export interface TabItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface TabControlProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const TabControl: React.FC<TabControlProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="tab-control" data-testid="tab-control">
      <div className="tab-header" data-testid="tab-header">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            data-testid={`tab-button-${tab.id}`}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div className="tab-content" data-testid="tab-content">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};

export default TabControl; 