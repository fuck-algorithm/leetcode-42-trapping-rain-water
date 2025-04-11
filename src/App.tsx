import React, { useState } from 'react';
import './App.css';
import RainWaterVisualizer from './components/RainWaterVisualizer';
import HeightsInputControl from './components/HeightsInputControl';

function App() {
  // Default data for the trapping rain water problem
  const defaultHeights = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1];
  
  // State to keep track of the current heights
  const [heights, setHeights] = useState<number[]>(defaultHeights);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Trapping Rain Water Visualization</h1>
        <div className="visualization-container">
          <RainWaterVisualizer heights={heights} />
        </div>
        <div className="control-container">
          <HeightsInputControl 
            initialHeights={defaultHeights}
            onUpdateHeights={setHeights}
          />
        </div>
      </header>
    </div>
  );
}

export default App;
