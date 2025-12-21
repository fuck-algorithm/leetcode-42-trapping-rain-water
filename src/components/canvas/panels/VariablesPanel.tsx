/**
 * VariablesPanel Component
 * 
 * Displays algorithm variables and their current values with change highlighting.
 * 
 * Requirements: 11.1, 11.2, 11.4
 */

import React, { useState, useMemo, useCallback } from 'react';
import { VariableState } from '../animation/types';

export interface VariablesPanelProps {
  variables: VariableState[];
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  maxHeight?: number;
  width?: number;
}

// 样式常量
const STYLES = {
  colors: {
    background: '#ffffff',
    border: '#e0e0e0',
    headerBg: '#f5f5f5',
    headerText: '#333333',
    variableName: '#1565c0',
    variableValue: '#333333',
    changedBg: 'rgba(255, 235, 59, 0.3)',
    changedBorder: '#ffc107',
    referencedBg: 'rgba(33, 150, 243, 0.1)',
    referencedBorder: '#2196f3',
    expandIcon: '#666666',
    typeLabel: '#999999',
  },
  fontSize: {
    header: 14,
    variable: 13,
    value: 12,
    type: 10,
  },
};

/**
 * 格式化变量值用于显示
 */
export function formatVariableValue(value: any, maxLength: number = 50): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  
  if (typeof value === 'string') {
    const str = `"${value}"`;
    return str.length > maxLength ? str.slice(0, maxLength - 3) + '..."' : str;
  }
  
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  if (Array.isArray(value)) {
    const str = JSON.stringify(value);
    return str.length > maxLength ? str.slice(0, maxLength - 3) + '...]' : str;
  }
  
  if (typeof value === 'object') {
    const str = JSON.stringify(value);
    return str.length > maxLength ? str.slice(0, maxLength - 3) + '...}' : str;
  }
  
  return String(value);
}

/**
 * 获取变量类型标签
 */
export function getTypeLabel(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return `array[${value.length}]`;
  return typeof value;
}

/**
 * 检查值是否可展开
 */
export function isExpandable(value: any): boolean {
  return Array.isArray(value) || (typeof value === 'object' && value !== null);
}

/**
 * 单个变量项组件
 */
const VariableItem: React.FC<{
  variable: VariableState;
  expanded: boolean;
  onToggleExpand: () => void;
}> = ({ variable, expanded, onToggleExpand }) => {
  const { name, value, type, changed, referencedInStep } = variable;
  
  const canExpand = isExpandable(value);
  const formattedValue = formatVariableValue(value);
  const typeLabel = getTypeLabel(value);
  
  // 计算背景样式
  const getBackgroundStyle = (): React.CSSProperties => {
    if (changed) {
      return {
        backgroundColor: STYLES.colors.changedBg,
        borderLeft: `3px solid ${STYLES.colors.changedBorder}`,
      };
    }
    if (referencedInStep) {
      return {
        backgroundColor: STYLES.colors.referencedBg,
        borderLeft: `3px solid ${STYLES.colors.referencedBorder}`,
      };
    }
    return {
      borderLeft: '3px solid transparent',
    };
  };

  return (
    <div
      className="variable-item"
      data-testid={`variable-${name}`}
      data-changed={changed}
      data-referenced={referencedInStep}
      style={{
        padding: '8px 12px',
        ...getBackgroundStyle(),
        transition: 'background-color 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 展开/折叠按钮 */}
          {canExpand && (
            <button
              onClick={onToggleExpand}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                color: STYLES.colors.expandIcon,
                fontSize: '12px',
              }}
              data-testid={`expand-${name}`}
            >
              {expanded ? '▼' : '▶'}
            </button>
          )}
          
          {/* 变量名 */}
          <span
            style={{
              color: STYLES.colors.variableName,
              fontWeight: 'bold',
              fontSize: STYLES.fontSize.variable,
            }}
          >
            {name}
          </span>
          
          {/* 类型标签 */}
          <span
            style={{
              color: STYLES.colors.typeLabel,
              fontSize: STYLES.fontSize.type,
            }}
          >
            ({typeLabel})
          </span>
        </div>
        
        {/* 变化指示器 */}
        {changed && (
          <span
            style={{
              backgroundColor: STYLES.colors.changedBorder,
              color: '#000',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold',
            }}
          >
            已变化
          </span>
        )}
      </div>
      
      {/* 变量值 */}
      <div
        style={{
          marginTop: '4px',
          marginLeft: canExpand ? '24px' : '0',
          color: STYLES.colors.variableValue,
          fontSize: STYLES.fontSize.value,
          fontFamily: 'monospace',
          wordBreak: 'break-all',
        }}
      >
        {expanded && canExpand ? (
          <ExpandedValue value={value} />
        ) : (
          formattedValue
        )}
      </div>
    </div>
  );
};

/**
 * 展开的值显示
 */
const ExpandedValue: React.FC<{ value: any }> = ({ value }) => {
  if (Array.isArray(value)) {
    return (
      <div style={{ paddingLeft: '12px' }}>
        {value.map((item, index) => (
          <div key={index} style={{ marginBottom: '2px' }}>
            <span style={{ color: '#999' }}>[{index}]</span>{' '}
            <span>{formatVariableValue(item, 30)}</span>
          </div>
        ))}
      </div>
    );
  }
  
  if (typeof value === 'object' && value !== null) {
    return (
      <div style={{ paddingLeft: '12px' }}>
        {Object.entries(value).map(([key, val]) => (
          <div key={key} style={{ marginBottom: '2px' }}>
            <span style={{ color: '#999' }}>{key}:</span>{' '}
            <span>{formatVariableValue(val, 30)}</span>
          </div>
        ))}
      </div>
    );
  }
  
  return <span>{formatVariableValue(value)}</span>;
};

/**
 * Main VariablesPanel component
 */
const VariablesPanel: React.FC<VariablesPanelProps> = ({
  variables,
  collapsed = false,
  onToggleCollapse,
  maxHeight = 300,
  width = 250,
}) => {
  const [expandedVars, setExpandedVars] = useState<Set<string>>(new Set());

  // 切换变量展开状态
  const toggleExpand = useCallback((name: string) => {
    setExpandedVars(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  // 统计变化的变量数量
  const changedCount = useMemo(() => {
    return variables.filter(v => v.changed).length;
  }, [variables]);

  // 统计引用的变量数量
  const referencedCount = useMemo(() => {
    return variables.filter(v => v.referencedInStep).length;
  }, [variables]);

  return (
    <div
      className="variables-panel"
      data-testid="variables-panel"
      data-collapsed={collapsed}
      style={{
        width: collapsed ? 40 : width,
        backgroundColor: STYLES.colors.background,
        border: `1px solid ${STYLES.colors.border}`,
        borderRadius: '4px',
        overflow: 'hidden',
        transition: 'width 0.3s ease',
      }}
    >
      {/* 头部 */}
      <div
        className="panel-header"
        style={{
          backgroundColor: STYLES.colors.headerBg,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${STYLES.colors.border}`,
          cursor: onToggleCollapse ? 'pointer' : 'default',
        }}
        onClick={onToggleCollapse}
      >
        {!collapsed && (
          <>
            <span
              style={{
                fontWeight: 'bold',
                fontSize: STYLES.fontSize.header,
                color: STYLES.colors.headerText,
              }}
            >
              变量 ({variables.length})
            </span>
            <div style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
              {changedCount > 0 && (
                <span style={{ color: STYLES.colors.changedBorder }}>
                  {changedCount} 变化
                </span>
              )}
              {referencedCount > 0 && (
                <span style={{ color: STYLES.colors.referencedBorder }}>
                  {referencedCount} 引用
                </span>
              )}
            </div>
          </>
        )}
        {onToggleCollapse && (
          <span style={{ fontSize: '12px', color: '#666' }}>
            {collapsed ? '◀' : '▶'}
          </span>
        )}
      </div>

      {/* 变量列表 */}
      {!collapsed && (
        <div
          className="panel-content"
          style={{
            maxHeight,
            overflowY: 'auto',
          }}
        >
          {variables.length === 0 ? (
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                color: '#999',
                fontSize: '12px',
              }}
            >
              无变量
            </div>
          ) : (
            variables.map((variable) => (
              <VariableItem
                key={variable.name}
                variable={variable}
                expanded={expandedVars.has(variable.name)}
                onToggleExpand={() => toggleExpand(variable.name)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default VariablesPanel;

/**
 * 检查变量是否应该高亮显示
 */
export function shouldHighlightVariable(variable: VariableState): boolean {
  return variable.changed || variable.referencedInStep;
}

/**
 * 获取所有变化的变量
 */
export function getChangedVariables(variables: VariableState[]): VariableState[] {
  return variables.filter(v => v.changed);
}

/**
 * 获取所有引用的变量
 */
export function getReferencedVariables(variables: VariableState[]): VariableState[] {
  return variables.filter(v => v.referencedInStep);
}
