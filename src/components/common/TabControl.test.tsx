import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import TabControl from './TabControl';

const tabs = [
  { id: 'twoPointers', title: '双指针法', content: <p>从两端向中间扫描。</p> },
  { id: 'stack', title: '单调栈法', content: <p>用栈寻找凹槽边界。</p> },
];

function ControlledTabs() {
  const [activeTab, setActiveTab] = React.useState('twoPointers');
  return <TabControl tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />;
}

describe('TabControl accessible algorithm navigation', () => {
  it('exposes tab and panel relationships and selected state', () => {
    render(<ControlledTabs />);
    expect(screen.getByRole('tablist', { name: '算法解法' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '双指针法' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: '单调栈法' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel', { name: '双指针法' })).toHaveTextContent('从两端向中间扫描');
  });

  it('moves focus and selection with horizontal arrow keys', () => {
    render(<ControlledTabs />);
    fireEvent.keyDown(screen.getByRole('tab', { name: '双指针法' }), { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: '单调栈法' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: '双指针法' })).toHaveAttribute('tabIndex', '-1');
  });
});
