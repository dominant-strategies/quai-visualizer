import React, { useState, useEffect, useCallback } from 'react';
import './SoapCountdown.css';

const SOAP_TARGET_PRIME_BLOCK = 1171500;
const SECONDS_PER_PRIME_BLOCK = 23.14;
const RPC_URL = 'https://rpc.quai.network/cyprus1';

const SoapCountdown = ({ isViewMode }) => {
  const [zoneBlock, setZoneBlock] = useState(null);
  const [primeBlock, setPrimeBlock] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  const fetchBlockData = useCallback(async () => {
    try {
      // Fetch the latest block to get zone block number
      const response = await fetch(RPC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'quai_getBlockByNumber',
          params: ['latest', false]
        })
      });

      const data = await response.json();

      if (data.result) {
        // Zone block number from woHeader
        const zoneBlockNum = parseInt(data.result.woHeader?.number, 16);
        setZoneBlock(zoneBlockNum);

        // Prime block number from header.number[0] (first element is prime block)
        const primeBlockNum = data.result.header?.number?.[0]
          ? parseInt(data.result.header.number[0], 16)
          : null;
        setPrimeBlock(primeBlockNum);

        if (primeBlockNum !== null) {
          if (primeBlockNum >= SOAP_TARGET_PRIME_BLOCK) {
            setIsLive(true);
            setTimeLeft(0);
          } else {
            const blocksRemaining = SOAP_TARGET_PRIME_BLOCK - primeBlockNum;
            const secondsRemaining = blocksRemaining * SECONDS_PER_PRIME_BLOCK;
            setTimeLeft(secondsRemaining);
            setIsLive(false);
          }
        }

        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching block data for SOAP countdown:', error);
    }
  }, []);

  // Poll for block data every 5 seconds
  useEffect(() => {
    fetchBlockData();
    const interval = setInterval(fetchBlockData, 5000);
    return () => clearInterval(interval);
  }, [fetchBlockData]);

  // Countdown timer that decrements every second
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || isLive) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsLive(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isLive]);

  const formatTimeLeft = (seconds) => {
    if (seconds === null) return '--:--'; // Shorter format when no data

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    // Seconds are removed

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `<1m`; // Show less than 1 minute
    }
  };

  const formatNumber = (num) => {
    if (num === null) return '---';
    return num.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className={`soap-countdown ${isViewMode ? 'view-mode' : ''}`}>
        <div className="soap-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`soap-countdown ${isViewMode ? 'view-mode' : ''} ${isLive ? 'is-live' : ''}`}>
      {isLive ? (
        <div className="soap-live">
          <span className="soap-live-badge">LIVE</span>
          <span className="soap-title">Project SOAP is LIVE!</span>
        </div>
      ) : (
        <>
          <div className="soap-title">Project SOAP Countdown</div>
          <div className="soap-time">{formatTimeLeft(timeLeft)}</div>
          <div className="soap-blocks">
            <div className="soap-block-info">
              <span className="soap-label">Zone Block</span>
              <span className="soap-value">{formatNumber(zoneBlock)}</span>
            </div>
            <div className="soap-block-info">
              <span className="soap-label">CURRENT PRIME BLOCK</span>
              <span className="soap-value">{formatNumber(primeBlock)}</span>
            </div>
            <div className="soap-block-info">
              <span className="soap-label">PRIME FORK BLOCK</span>
              <span className="soap-value">{formatNumber(SOAP_TARGET_PRIME_BLOCK)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SoapCountdown;
