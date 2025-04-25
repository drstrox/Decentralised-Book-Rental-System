import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { useBookRental } from '../context/BookRentalContext';
import BookCard from '../components/BookCard';
import { BookOpen } from 'lucide-react';

const MyRentals: React.FC = () => {
  const { isConnected } = useWeb3();
  const { userRentals, loadUserRentals, isLoading, error } = useBookRental();

  useEffect(() => {
    if (isConnected) {
      loadUserRentals();
    }
  }, [isConnected, loadUserRentals]);

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Connect Your Wallet</h2>
        <p className="text-gray-600 mb-6">
          Please connect your wallet to view your rented books.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-indigo-900 mb-6">My Rented Books</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading your rentals...</p>
        </div>
      ) : userRentals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userRentals.map((book) => {
            // Calculate the rental cost based on rentedAt and dailyPrice
            const rentedAt = book.rentedAt ? book.rentedAt : 0;
            const daysRented = Math.ceil((Math.floor(Date.now() / 1000) - rentedAt) / 86400); // in days
            const currentRentalCost = (parseFloat(book.dailyPrice) * daysRented).toFixed(4);

            return (
              <BookCard
                key={book.id}
                id={book.id}
                title={book.title}
                dailyPrice={book.dailyPrice}
                deposit={book.deposit}
                owner={book.owner}
                isAvailable={false}  // Since the book is rented
                isRented={true}
                rentedAt={rentedAt}
                currentRentalCost={currentRentalCost}  // Pass the calculated cost to BookCard
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <BookOpen className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Rented Books</h3>
          <p className="text-gray-500 mb-6">
            You haven't rented any books yet.
          </p>
          <Link
            to="/marketplace"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
          >
            Browse Books
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyRentals;
