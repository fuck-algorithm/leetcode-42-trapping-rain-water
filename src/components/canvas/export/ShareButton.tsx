/**
 * ShareButton - 分享按钮组件
 * 
 * 提供复制分享链接和导出图片功能
 * 
 * Requirements: 12.4, 12.5, 12.6
 */

import React, { useState, useCallback } from 'react';
import { ExportManager, ExportState } from './ExportManager';
import './ShareButton.css';

interface ShareButtonProps {
  getState: () => ExportState;
  getSvgElement?: () => SVGElement | null;
  className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  getState,
  getSvgElement,
  className = '',
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  const exportManager = new ExportManager();

  const handleCopyLink = useCallback(async () => {
    try {
      const state = getState();
      const url = exportManager.generateShareUrl(state);
      await exportManager.copyToClipboard(url);
      setCopyStatus('success');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  }, [getState]);

  const handleExportImage = useCallback(async () => {
    if (!getSvgElement) return;
    
    const svgElement = getSvgElement();
    if (!svgElement) {
      console.error('SVG element not found');
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 2000);
      return;
    }

    try {
      setExportStatus('loading');
      const blob = await exportManager.exportAsImage(svgElement);
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      exportManager.downloadBlob(blob, `algorithm-visualization-${timestamp}.png`);
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to export image:', error);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 2000);
    }
  }, [getSvgElement]);

  const getCopyButtonText = () => {
    switch (copyStatus) {
      case 'success': return '✓ 已复制';
      case 'error': return '✗ 复制失败';
      default: return '📋 复制链接';
    }
  };

  const getExportButtonText = () => {
    switch (exportStatus) {
      case 'loading': return '⏳ 导出中...';
      case 'success': return '✓ 已下载';
      case 'error': return '✗ 导出失败';
      default: return '🖼️ 导出图片';
    }
  };

  return (
    <div className={`share-button-container ${className}`}>
      <button
        className="share-button"
        onClick={() => setShowMenu(!showMenu)}
        title="分享与导出"
      >
        📤 分享
      </button>
      
      {showMenu && (
        <div className="share-menu">
          <button
            className={`share-menu-item ${copyStatus !== 'idle' ? copyStatus : ''}`}
            onClick={handleCopyLink}
            disabled={copyStatus === 'success'}
          >
            {getCopyButtonText()}
          </button>
          
          {getSvgElement && (
            <button
              className={`share-menu-item ${exportStatus !== 'idle' ? exportStatus : ''}`}
              onClick={handleExportImage}
              disabled={exportStatus === 'loading' || exportStatus === 'success'}
            >
              {getExportButtonText()}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ShareButton;
