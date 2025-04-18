import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { useBookRental } from '../context/BookRentalContext';

const ListBook: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected } = useWeb3();
  const { listBook, isLoading, error } = useBookRental();
  
  const [title, setTitle] = useState('');
  const [dailyPrice, setDailyPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [formError, setFormError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    try {
      // Basic validation
      if (!title.trim()) {
        setFormError('Please enter a book title');
        return;
      }
      
      if (!dailyPrice || parseFloat(dailyPrice) <= 0) {
        setFormError('Please enter a valid daily price');
        return;
      }
      
      if (!deposit || parseFloat(deposit) <= 0) {
        setFormError('Please enter a valid deposit amount');
        return;
      }
      
      // Submit transaction
      await listBook(title, dailyPrice, deposit);
      
      // Success message
      setSuccess(true);
      
      // Reset form
      setTitle('');
      setDailyPrice('');
      setDeposit('');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/marketplace');
      }, 2000);
    } catch (err) {
      console.error('Error listing book:', err);
      setFormError('Failed to list book. Please try again.');
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Connect Your Wallet</h2>
        <p className="text-gray-600 mb-6">
          Please connect your wallet to list a book for rental.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-indigo-900 mb-6">List Your Book</h1>
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          <p>Book listed successfully! Redirecting to marketplace...</p>
        </div>
      )}
      
      {(error || formError) && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{formError || error}</p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
              Book Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter the title of your book"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="dailyPrice" className="block text-gray-700 font-medium mb-2">
              Daily Rental Price (ETH)
            </label>
            <input
              type="number"
              id="dailyPrice"
              value={dailyPrice}
              onChange={(e) => setDailyPrice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0.01"
              step="0.0001"
              min="0.0001"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Set a fair daily price for renting your book.
            </p>
          </div>
          
          <div className="mb-6">
            <label htmlFor="deposit" className="block text-gray-700 font-medium mb-2">
              Deposit Amount (ETH)
            </label>
            <input
              type="number"
              id="deposit"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0.1"
              step="0.001"
              min="0.001"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              This amount will be held as security deposit while the book is rented.
            </p>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 ${
              isLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Processing...' : 'List Book'}
          </button>
        </form>
        
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Listing Guidelines</h3>
          <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
            <li>Set a reasonable deposit amount relative to the book's value.</li>
            <li>Daily price should be competitive to attract renters.</li>
            <li>Once listed, your book will be visible in the marketplace.</li>
            <li>You can't rent your own book.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ListBook;