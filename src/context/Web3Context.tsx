import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

interface Web3ContextType {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  connectWallet: () => Promise<void>;
  isConnected: boolean;
  networkName: string | null;
  chainId: number | null;
  balance: string | null;
  isLoading: boolean;
  error: string | null;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const useWeb3 = (): Web3ContextType => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [networkName, setNetworkName] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return Boolean(window.ethereum);
  };

  // Connect wallet
  const connectWallet = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isMetaMaskInstalled()) {
        throw new Error('MetaMask is not installed');
      }

      // Request account access
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send('eth_requestAccounts', []);
      const userAccount = accounts[0];
      
      // Get provider and signer
      const userSigner = await browserProvider.getSigner();
      
      // Get network information
      const network = await browserProvider.getNetwork();
      const userChainId = Number(network.chainId);
      
      // Get account balance
      const userBalance = await browserProvider.getBalance(userAccount);
      const formattedBalance = ethers.formatEther(userBalance);

      // Update state
      setAccount(userAccount);
      setProvider(browserProvider);
      setSigner(userSigner);
      setIsConnected(true);
      setNetworkName(network.name);
      setChainId(userChainId);
      setBalance(formattedBalance);
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          setAccount(null);
          setIsConnected(false);
          setBalance(null);
        } else if (accounts[0] !== account) {
          // Account changed
          setAccount(accounts[0]);
          // Update balance for the new account
          if (provider) {
            provider.getBalance(accounts[0]).then((balance) => {
              setBalance(ethers.formatEther(balance));
            });
          }
        }
      };

      const handleChainChanged = (_chainId: string) => {
        // Reload the page when the chain changes
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Auto-connect if previously connected
      const checkConnection = async () => {
        if (window.ethereum.isConnected()) {
          try {
            await connectWallet();
          } catch (err) {
            console.error('Auto-connect failed:', err);
          }
        }
      };
      checkConnection();

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [account, provider]);

  const value = {
    account,
    provider,
    signer,
    connectWallet,
    isConnected,
    networkName,
    chainId,
    balance,
    isLoading,
    error
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};