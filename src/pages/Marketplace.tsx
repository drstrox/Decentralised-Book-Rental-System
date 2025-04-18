import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useBookRental } from '../context/BookRentalContext';
import BookCard from '../components/BookCard';
import { BookX } from 'lucide-react';

const Marketplace: React.FC = () => {
  const { isConnected } = useWeb3();
  const { books, loadBooks, isLoading, error } = useBookRental();
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    if (isConnected) {
      loadBooks();
    }
  }, [isConnected, loadBooks]);
  
  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const availableBooks = filteredBooks.filter(book => book.isAvailable);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-indigo-900 mb-6">Book Marketplace</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}
      
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search for books..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      
      {isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading books...</p>
        </div>
      ) : availableBooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableBooks.map((book) => (
            <BookCard
              key={book.id}
              id={book.id}
              title={book.title}
              dailyPrice={book.dailyPrice}
              deposit={book.deposit}
              owner={book.owner}
              isAvailable={book.isAvailable}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <BookX className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Available Books</h3>
          <p className="text-gray-500">
            {searchTerm 
              ? `No books matching "${searchTerm}" were found.` 
              : "There are no books available for rent right now."}
          </p>
          <p className="text-gray-500 mt-1">
            Check back later or list your own book for others to rent.
          </p>
        </div>
      )}
    </div>
  );
};

export default Marketplace;