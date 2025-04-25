import React from 'react';
import { Link } from 'react-router-dom';
import { Book } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';

const Navbar: React.FC = () => {
  const { account, connectWallet, isConnected, balance } = useWeb3();
  
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <nav className="bg-indigo-900 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Book className="h-8 w-8 text-yellow-400" />
            <Link to="/" className="text-2xl font-bold tracking-tight">
              BookChain
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="hover:text-yellow-300 transition-colors duration-200">
              Home
            </Link>
            <Link to="/marketplace" className="hover:text-yellow-300 transition-colors duration-200">
              Marketplace
            </Link>
            <Link to="/list" className="hover:text-yellow-300 transition-colors duration-200">
              List a Book
            </Link>
            <Link to="/my-rentals" className="hover:text-yellow-300 transition-colors duration-200">
              My Rentals
            </Link>
          </div>
          
          <div>
            {isConnected ? (
              <div className="flex items-center space-x-2">
                <div className="bg-indigo-800 rounded-full px-4 py-1 text-sm">
                  {balance && `${parseFloat(balance).toFixed(4)} ETH`}
                </div>
                <div className="bg-indigo-800 rounded-full px-4 py-1 text-sm">
                  {account && shortenAddress(account)}
                </div>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="bg-yellow-500 hover:bg-yellow-600 text-indigo-900 font-bold py-2 px-4 rounded-full transition-colors duration-200"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-indigo-800">
        <div className="container mx-auto px-4 py-2">
          <div className="flex justify-between">
            <Link to="/" className="text-center py-2 flex-1 hover:bg-indigo-800 rounded-md">
              Home
            </Link>
            <Link to="/marketplace" className="text-center py-2 flex-1 hover:bg-indigo-800 rounded-md">
              Browse
            </Link>
            <Link to="/list" className="text-center py-2 flex-1 hover:bg-indigo-800 rounded-md">
              List
            </Link>
            <Link to="/my-rentals" className="text-center py-2 flex-1 hover:bg-indigo-800 rounded-md">
              Rentals
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;