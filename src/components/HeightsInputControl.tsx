import React, { useState } from 'react';
import { validateHeights, generateRandomHeights } from '../utils/validation';

interface HeightsInputControlProps {
  initialHeights: number[];
  onUpdateHeights: (heights: number[]) => void;
}

// 预设数据样例
const PRESET_DATA = [
  { label: '示例1', data: [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1] },
  { label: '示例2', data: [4, 2, 0, 3, 2, 5] },
  { label: '阶梯', data: [1, 2, 3, 4, 5, 4, 3, 2, 1] },
  { label: '凹槽', data: [5, 1, 1, 1, 5] },
];

const HeightsInputControl: React.FC<HeightsInputControlProps> = ({ 
  initialHeights, 
  onUpdateHeights 
}) => {
  const [inputValue, setInputValue] = useState<string>(initialHeights.join(','));
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // 清除之前的错误
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = validateHeights(inputValue);
    
    if (result.isValid && result.heights) {
      setError(null);
      onUpdateHeights(result.heights);
    } else {
      setError(result.error || '输入无效');
    }
  };

  const handleReset = () => {
    setInputValue(initialHeights.join(','));
    setError(null);
    onUpdateHeights(initialHeights);
  };

  const handlePreset = (data: number[]) => {
    setInputValue(data.join(','));
    setError(null);
    onUpdateHeights(data);
  };

  const handleRandomGenerate = () => {
    const randomHeights = generateRandomHeights(8, 15, 9);
    setInputValue(randomHeights.join(','));
    setError(null);
    onUpdateHeights(randomHeights);
  };

  return (
    <div className="heights-input-control">
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="heights-input">高度数组 (逗号分隔):</label>
          <div className="input-row">
            <input
              id="heights-input"
              type="text"
              value={inputValue}
              onChange={handleChange}
              placeholder="例如: 0,1,0,2,1,0,1,3,2,1,2,1"
              className={error ? 'error' : ''}
            />
            <div className="buttons-group">
              <button type="submit">更新</button>
              <button type="button" onClick={handleReset}>重置</button>
              {PRESET_DATA.map((preset, index) => (
                <button 
                  key={index} 
                  type="button" 
                  onClick={() => handlePreset(preset.data)}
                >
                  {preset.label}
                </button>
              ))}
              <button type="button" onClick={handleRandomGenerate}>随机</button>
            </div>
          </div>
        </div>
        {error && <div className="error-message">{error}</div>}
      </form>
    </div>
  );
};

export default HeightsInputControl;
