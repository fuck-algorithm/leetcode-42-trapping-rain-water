import { useState, useEffect, RefObject } from 'react';

interface ElementSize {
  width: number;
  height: number;
}

export const useElementSize = <T extends HTMLElement>(ref: RefObject<T | null>): ElementSize => {
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });

  useEffect(() => {
    if (!ref.current) return;
    
    const updateSize = () => {
      if (ref.current) {
        const { width, height } = ref.current.getBoundingClientRect();
        setSize({ width, height });
      }
    };

    // 初始化
    updateSize();

    // 监听窗口大小变化
    window.addEventListener('resize', updateSize);
    
    // 使用ResizeObserver监听元素大小变化
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    
    if (ref.current) {
      resizeObserver.observe(ref.current);
    }
    
    return () => {
      window.removeEventListener('resize', updateSize);
      resizeObserver.disconnect();
    };
  }, [ref]);

  return size;
}; 