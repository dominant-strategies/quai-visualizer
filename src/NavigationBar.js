import React from 'react';
import './NavigationBar.css';

const NavigationBar = ({ currentView, onViewChange, blockchainData, current3DMode, on3DModeChange, isMenuOpen, setIsMenuOpen }) => {
  // const { items, isConnected, connectionStatus } = blockchainData; // No longer needed for display

  return (
    <nav className="navigation-bar">
      <div className="nav-container">
        <div className="nav-left">
          <img src="/quai-logo.png" alt="Quai Network" className="nav-logo-img" />
        </div>

        <div className="nav-right">
          {/* 3D Mode Selector - only show when in 3D view */}
          {currentView === '3d' && (
            <div className="nav-3d-mode-selector nav-button-group">
              <button
                className={`mode-button nav-button ${current3DMode === 'mainnet' ? 'active' : ''}`}
                onClick={() => on3DModeChange('mainnet')}
                title="Live Mainnet Data"
              >
                Mainnet
              </button>
              <button
                className={`mode-button nav-button ${current3DMode === '2x2' ? 'active' : ''}`}
                onClick={() => on3DModeChange('2x2')}
                title="2x2 Hierarchy Demo"
              >
                2x2 Demo
              </button>
            </div>
          )}

          <div className="nav-view-selector nav-button-group">
            <button
              className={`view-button nav-button ${currentView === '3d' ? 'active' : ''}`}
              onClick={() => onViewChange('3d')}
            >
              3D
            </button>
            <button
              className={`view-button nav-button ${currentView === 'normal' ? 'active' : ''}`}
              onClick={() => onViewChange('normal')}
            >
              2D
            </button>
          </div>

          {/* Menu Trigger */}
          <button
            className={`menu-trigger nav-button-group ${isMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span>MENU</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;