import React, { useState, useEffect, useCallback } from 'react';
import ChainVisualizer from './ChainVisualizer';
import ChainVisualizer3D from './ChainVisualizer3D';
import NavigationBar from './NavigationBar';
import IntroModal from './IntroModal';
import { useBlockchainData } from './useBlockchainData';
import { useBlockchainData2x2 } from './useBlockchainData2x2';
import './App.css';

// Default max items to keep in blockchain data hooks
export const DefaultMaxItems = 250;

// Valid themes for URL validation
const VALID_THEMES = ['normal', 'space', 'tron', 'quai'];

// Helper to get URL params
const getUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    viewMode: params.get('view') === 'true',
    theme: params.get('theme'),
    mode: params.get('mode') // mainnet or 2x2
  };
};

// Helper to update URL without reload
const updateUrl = (viewMode, theme, mode) => {
  const params = new URLSearchParams();
  if (viewMode) params.set('view', 'true');
  if (theme && VALID_THEMES.includes(theme)) params.set('theme', theme);
  if (mode) params.set('mode', mode);

  const newUrl = params.toString()
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;

  window.history.replaceState({}, '', newUrl);
};

// Fun Facts about Quai Network
const QUAI_FACTS = [
  "Quai Network is a Layer 1 blockchain that utilizes a hierarchical sharding model with a Prime Chain as the top-level coordinator, enabling asynchronous transaction processing across sub-networks.",
  "It employs Proof-of-Entropy-Minima (PoEM), a novel consensus mechanism that eliminates block contention for instant finality, achieving blocks approximately every 1.1 seconds.",
  "Quai supports merged mining, allowing miners to secure multiple chains simultaneously using algorithms like SHA256, Scrypt, and KawPow, enhancing overall network security.",
  "The network features a dual-token system: $QUAI as an account-based utility token for gas and governance, and $QI as a UTXO-based energy-backed flatcoin for stable value.",
  "Quai achieves scalability of over 255,000+ transactions per second (TPS) without compromising decentralization, expanding automatically with demand.",
  "It maintains low transaction fees under $0.01, making it suitable for everyday applications like peer-to-peer payments.",
  "Quai is fully EVM-compatible, supporting Solidity smart contracts and seamless migration from Ethereum tools.",
  "Quai's $QI token is emitted in direct proportion to the network's mining difficulty, serving as a decentralized oracle for global energy prices and creating a flatcoin backed by real-world energy expenditure.",
  "Quai's architecture includes a 3-layer hierarchy: Prime Chain for global coordination, Region Chains for mid-level operations, and Zone Chains for application-specific workloads.",
  "Cross-chain transactions are handled natively via External Transactions (ETXs), which are cryptographically atomic and route through the hierarchy without bridges.",
  "Security is shared across shards through merged mining, where miners protect Prime, Region, and at least one Zone chain simultaneously.",
  "PoEM consensus is deterministic, resolving all data to the same canonical head and shifting to single-shot communication for efficiency.",
  "Quai uses dynamic sharding, adding shards algorithmically as network usage grows to support infinite scalability.",
  "The $QI token provides cash-like privacy through fixed denominations and UTXO model, preventing address reuse.",
  "Mining is GPU-friendly with the ProgPoW algorithm, minimizing ASIC dominance for fairer rewards.",
  "Quai Network integrates Non-Interactive Proofs of Proof-of-Work (NiPoPoWs) to enable efficient, lightweight verification of blockchain state for applications and light clients without full node requirements.",
  "The Subsidized Open-market Acquisition Protocol (SOAP) redirects parent chain rewards to buy back and burn $QUAI, creating deflationary pressure.",
  "$QI is pegged to energy costs, using mining difficulty as an oracle for real-world energy prices.",
  "Quai supports parallel transaction processing across its braided multi-chain structure for high throughput.",
  "Quai's SOAP protocol routes 100% of parent chain coinbase outputs to a protocol-controlled address, which automates open-market purchases of $QUAI for buybacks and burns.",
  "SOAP enables merged mining with external chains by accepting shares from multiple algorithms like SHA-256 and Scrypt, enhancing Quai's security through integration with networks such as Bitcoin and Litecoin.",
  "PoEM improves single-chain confirmation delay by 28.5% and throughput by 16.3% compared to traditional PoW.",
  "Quai's energy-based model is the first of its kind approach to blockchain mining, where miners are rewarded with $QI tokens based on the energy they consume.",
  "The network is open-source, with extensive documentation and tools like quais.js SDK for developers.",
  "Quai enables limitless throughput by allowing nodes to maintain only a subset of chains while remaining trustless."
];

function App() {
  // Initialize state from URL params
  const urlParams = getUrlParams();
  const initialMode = urlParams.mode === '2x2' ? '2x2' : 'mainnet';
  const initialTheme = urlParams.theme && VALID_THEMES.includes(urlParams.theme)
    ? urlParams.theme
    : (initialMode === 'mainnet' ? 'space' : 'quai');

  const [currentView, setCurrentView] = useState('3d');
  const [current3DMode, setCurrent3DMode] = useState(initialMode);
  const [hasUserInteracted, setHasUserInteracted] = useState(urlParams.viewMode); // Auto-interact if view mode URL
  const [isViewMode, setIsViewMode] = useState(urlParams.viewMode);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [currentTheme, setCurrentTheme] = useState(initialTheme);

  // Update URL when state changes
  useEffect(() => {
    updateUrl(isViewMode, currentTheme, current3DMode);
  }, [isViewMode, currentTheme, current3DMode]);

  // Rotate facts every 8 seconds in view mode
  useEffect(() => {
    if (!isViewMode) return;

    const interval = setInterval(() => {
      setCurrentFactIndex(prev => (prev + 1) % QUAI_FACTS.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [isViewMode]);

  // Centralized blockchain data management - only load data for active mode after user interaction
  const shouldLoadMainnet = hasUserInteracted && (currentView === '2d' || (currentView === '3d' && current3DMode === 'mainnet'));
  const shouldLoad2x2 = hasUserInteracted && currentView === '3d' && current3DMode === '2x2';

  const blockchainData = useBlockchainData(shouldLoadMainnet);
  const blockchainData2x2 = useBlockchainData2x2(shouldLoad2x2);

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const handle3DModeChange = (mode) => {
    setCurrent3DMode(mode);
  };

  const handleThemeChange = useCallback((theme) => {
    if (VALID_THEMES.includes(theme)) {
      setCurrentTheme(theme);
    }
  }, []);

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

  const handleEnterViewMode = () => {
    setIsViewMode(true);
    setCurrentFactIndex(Math.floor(Math.random() * QUAI_FACTS.length));
  };

  const handleExitViewMode = () => {
    setIsViewMode(false);
  };

  return (
    <div className="App">
      {!hasUserInteracted && currentView === '3d' && (
        <IntroModal onConnect={handleModalConnect} />
      )}
      {!isViewMode && (
        <NavigationBar
          currentView={currentView}
          onViewChange={handleViewChange}
          blockchainData={getActiveBlockchainData()}
          current3DMode={current3DMode}
          on3DModeChange={handle3DModeChange}
        />
      )}
      <div className={`app-content ${isViewMode ? 'view-mode' : ''}`}>
        {currentView === 'normal' ?
          <ChainVisualizer blockchainData={blockchainData} /> :
          <ChainVisualizer3D
            blockchainData={getActiveBlockchainData()}
            mode={current3DMode}
            hasUserInteracted={hasUserInteracted}
            isViewMode={isViewMode}
            onEnterViewMode={handleEnterViewMode}
            onExitViewMode={handleExitViewMode}
            theme={currentTheme}
            onThemeChange={handleThemeChange}
          />
        }
      </div>

      {/* View Mode Overlay */}
      {isViewMode && (
        <>
          {/* Fun Fact Banner at Top */}
          <div className="view-mode-fact-banner">
            <div className="fact-content">
              <span className="fact-label">Did you know?</span>
              <p className="fact-text">{QUAI_FACTS[currentFactIndex]}</p>
            </div>
          </div>

          {/* Bottom Right Branding */}
          <div className="view-mode-branding">
            <span className="branding-text">Explore at</span>
            <a href="https://live.qu.ai" target="_blank" rel="noopener noreferrer" className="branding-link">
              live.qu.ai
            </a>
          </div>

          {/* Exit View Mode Button */}
          <button className="exit-view-mode-btn" onClick={handleExitViewMode}>
            Exit View Mode
          </button>
        </>
      )}
    </div>
  );
}

export default App;