import React, { useState } from 'react';
import ChainVisualizer from './ChainVisualizer';
import ChainVisualizer3D from './ChainVisualizer3D';
import NavigationBar from './NavigationBar';
import { useBlockchainData } from './useBlockchainData';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('3d');

  // Centralized blockchain data management
  const blockchainData = useBlockchainData();

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  return (
    <div className="App">
      <NavigationBar 
        currentView={currentView} 
        onViewChange={handleViewChange} 
        blockchainData={blockchainData}
      />
      <div className="app-content">
        {currentView === 'normal' ? 
          <ChainVisualizer blockchainData={blockchainData} /> : 
          <ChainVisualizer3D blockchainData={blockchainData} />
        }
      </div>
    </div>
  );
}

export default App;