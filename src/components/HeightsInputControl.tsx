import React, { useState } from 'react';

interface HeightsInputControlProps {
  initialHeights: number[];
  onUpdateHeights: (heights: number[]) => void;
}

const HeightsInputControl: React.FC<HeightsInputControlProps> = ({ 
  initialHeights, 
  onUpdateHeights 
}) => {
  const [inputValue, setInputValue] = useState<string>(initialHeights.join(','));
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Parse the comma-separated values
      const newHeights = inputValue
        .split(',')
        .map(val => val.trim())
        .filter(val => val !== '')
        .map(val => {
          const num = Number(val);
          if (isNaN(num)) {
            throw new Error(`Invalid value: ${val} is not a number`);
          }
          if (num < 0) {
            throw new Error(`Invalid value: ${val} is negative`);
          }
          return num;
        });
      
      if (newHeights.length < 2) {
        throw new Error('Please provide at least 2 values');
      }
      
      setError(null);
      onUpdateHeights(newHeights);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid input');
    }
  };

  const handleReset = () => {
    setInputValue(initialHeights.join(','));
    setError(null);
    onUpdateHeights(initialHeights);
  };

  const handleExample1 = () => {
    const example = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1];
    setInputValue(example.join(','));
    setError(null);
    onUpdateHeights(example);
  };

  const handleExample2 = () => {
    const example = [4, 2, 0, 3, 2, 5];
    setInputValue(example.join(','));
    setError(null);
    onUpdateHeights(example);
  };

  const handleRandomGenerate = () => {
    // 生成长度为8-15的随机高度数组
    const length = Math.floor(Math.random() * 8) + 8; // 8-15之间的随机数
    const randomHeights = Array.from({ length }, () => Math.floor(Math.random() * 9) + 1); // 高度在1-9之间
    setInputValue(randomHeights.join(','));
    setError(null);
    onUpdateHeights(randomHeights);
  };

  return (
    <div className="heights-input-control">
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="heights-input">Heights (comma-separated):</label>
          <div className="input-row">
          <input
            id="heights-input"
            type="text"
            value={inputValue}
            onChange={handleChange}
            placeholder="e.g. 0,1,0,2,1,0,1,3,2,1,2,1"
            className={error ? 'error' : ''}
          />
            <div className="buttons-group">
          <button type="submit">Update</button>
          <button type="button" onClick={handleReset}>Reset</button>
              <button type="button" onClick={handleExample1}>Example 1</button>
              <button type="button" onClick={handleExample2}>Example 2</button>
              <button type="button" onClick={handleRandomGenerate}>Random</button>
            </div>
          </div>
        </div>
        {error && <div className="error-message">{error}</div>}
      </form>
    </div>
  );
};

export default HeightsInputControl; 