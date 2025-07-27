import React, { useState, useEffect } from 'react';
import ChainVisualizer from './ChainVisualizer';
import ChainVisualizer3D from './ChainVisualizer3D';
import NavigationBar from './NavigationBar';
import IntroModal from './IntroModal';
import { useBlockchainData } from './useBlockchainData';
import { useBlockchainData2x2 } from './useBlockchainData2x2';
import './App.css';

export const DefaultMaxItems = 500;

function App() {
  // Parse URL parameters for theme, mode, view, and auto-skip modal
  const getURLParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;
    
    // Check for theme in query parameter (?theme=normal)
    const themeFromQuery = urlParams.get('theme');
    
    // Check for mode in query parameter (?mode=2x2)
    const modeFromQuery = urlParams.get('mode');
    const validModes = ['mainnet', '2x2'];
    const mode = validModes.includes(modeFromQuery) ? modeFromQuery : 'mainnet'; // Default to mainnet
    
    // Check for view in query parameter (?view=2d)
    const viewFromQuery = urlParams.get('view');
    const validViews = ['2d', '3d'];
    const view = validViews.includes(viewFromQuery) ? viewFromQuery : '3d'; // Default to 3d
    
    // Check for theme in pathname (/normal, /space, /tron, /quai)
    const themeFromPath = pathname.substring(1); // Remove leading slash
    const validThemes = ['normal', 'space', 'tron', 'quai'];
    const themeFromPathname = validThemes.includes(themeFromPath) ? themeFromPath : null;
    
    // Prefer query param over pathname, fallback to default
    const theme = themeFromQuery || themeFromPathname;
    const shouldSkipModal = !!(themeFromQuery || themeFromPathname || modeFromQuery || viewFromQuery);
    
    return { theme, mode, view, shouldSkipModal };
  };

  const { theme: urlTheme, mode: urlMode, view: urlView, shouldSkipModal } = getURLParams();
  
  const [currentView, setCurrentView] = useState(urlView);
  const [current3DMode, setCurrent3DMode] = useState(urlMode || 'mainnet'); // Use URL mode or default to 'mainnet'
  const [hasUserInteracted, setHasUserInteracted] = useState(shouldSkipModal);
  const [maxItems, setMaxItems] = useState(DefaultMaxItems); // Default max items to keep

  // Update URL when mode changes
  useEffect(() => {
    const updateURL = () => {
      const url = new URL(window.location);
      
      // Update or remove mode parameter
      if (current3DMode === 'mainnet') {
        url.searchParams.delete('mode'); // Remove mode param for default mainnet
      } else {
        url.searchParams.set('mode', current3DMode);
      }
      
      // Update the URL without reloading the page
      window.history.replaceState({}, '', url.toString());
    };
    
    updateURL();
  }, [current3DMode]);

  // Update URL when view changes
  useEffect(() => {
    const updateURL = () => {
      const url = new URL(window.location);
      
      // Update or remove view parameter
      if (currentView === '3d') {
        url.searchParams.delete('view'); // Remove view param for default 3d
      } else {
        url.searchParams.set('view', currentView);
      }
      
      // Update the URL without reloading the page
      window.history.replaceState({}, '', url.toString());
    };
    
    updateURL();
  }, [currentView]);

  // Centralized blockchain data management - only load data for active mode after user interaction
  const shouldLoadMainnet = hasUserInteracted && (currentView === '2d' || (currentView === '3d' && current3DMode === 'mainnet'));
  const shouldLoad2x2 = hasUserInteracted && currentView === '3d' && current3DMode === '2x2';
  
  const blockchainData = useBlockchainData(shouldLoadMainnet, maxItems);
  const blockchainData2x2 = useBlockchainData2x2(shouldLoad2x2, maxItems);

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const handle3DModeChange = (mode) => {
    setCurrent3DMode(mode);
  };

  const handleModalConnect = () => {
    setHasUserInteracted(true);
  };

  // Select appropriate blockchain data based on current mode
  const getActiveBlockchainData = () => {
    if (currentView === '3d' && current3DMode === '2x2') {
      return blockchainData2x2;
    }
    return blockchainData;
  };

  return (
    <div className="App">
      {!hasUserInteracted && currentView === '3d' && (
        <IntroModal onConnect={handleModalConnect} />
      )}
      <NavigationBar 
        currentView={currentView} 
        onViewChange={handleViewChange} 
        blockchainData={getActiveBlockchainData()}
        current3DMode={current3DMode}
        on3DModeChange={handle3DModeChange}
      />
      <div className="app-content">
        {currentView === '2d' ? 
          <ChainVisualizer blockchainData={blockchainData} /> : 
          <ChainVisualizer3D 
            blockchainData={getActiveBlockchainData()} 
            mode={current3DMode}
            hasUserInteracted={hasUserInteracted}
            urlTheme={urlTheme}
            maxItems={maxItems}
            onMaxItemsChange={setMaxItems}
          />
        }
      </div>
    </div>
  );
}

export default App;