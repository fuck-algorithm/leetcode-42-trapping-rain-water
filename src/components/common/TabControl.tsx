import React, { useRef } from 'react';
import './TabControl.css';

export interface TabItem {
  id: string;
  title: string;
  content: React.ReactNode;
  description?: string;
}

interface TabControlProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const TabControl: React.FC<TabControlProps> = ({ tabs, activeTab, onTabChange }) => {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = Math.max(0, tabs.findIndex(tab => tab.id === activeTab));
  const active = tabs[activeIndex];

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    onTabChange(tabs[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="tab-control" data-testid="tab-control">
      <div className="tab-header" data-testid="tab-header" role="tablist" aria-label="算法解法">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={element => { tabRefs.current[index] = element; }}
            id={`algorithm-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`algorithm-panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            title={tab.description}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={event => handleKeyDown(event, index)}
            data-testid={`tab-button-${tab.id}`}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div
        className="tab-content"
        data-testid="tab-content"
        role="tabpanel"
        id={`algorithm-panel-${active.id}`}
        aria-labelledby={`algorithm-tab-${active.id}`}
        aria-label={active.description ? `${active.title}：${active.description}` : active.title}
        tabIndex={0}
      >
        {active.content}
      </div>
    </div>
  );
};

export default TabControl;
