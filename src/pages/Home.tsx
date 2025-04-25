import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, BookMarked, BookKey } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto py-8">
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-indigo-900 mb-4">
          Decentralized Book Rental Platform
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          A trustless platform to rent and lend books securely with automated deposits and returns
        </p>
        
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/marketplace"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-md transition-colors duration-200"
          >
            Browse Books
          </Link>
          <Link
            to="/list"
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-md transition-colors duration-200"
          >
            List Your Book
          </Link>
        </div>
      </section>
      
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-indigo-900 mb-8 text-center">How It Works</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="flex justify-center mb-4">
              <BookOpen className="h-12 w-12 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">List Your Books</h3>
            <p className="text-gray-600">
              Set a daily rental price and deposit amount for each book you want to lend out.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="flex justify-center mb-4">
              <BookMarked className="h-12 w-12 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Rent Books</h3>
            <p className="text-gray-600">
              Browse available books and rent them by paying a deposit plus rental fee.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="flex justify-center mb-4">
              <BookKey className="h-12 w-12 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Return & Get Refund</h3>
            <p className="text-gray-600">
              Return books and automatically receive your deposit minus the rental fees.
            </p>
          </div>
        </div>
      </section>
      
      <section className="bg-indigo-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-indigo-900 mb-4 text-center">Why Use BookChain?</h2>
        
        <div className="grid md:grid-cols-2 gap-8 mt-6">
          <div>
            <h3 className="text-xl font-bold text-indigo-800 mb-2">Trustless Transactions</h3>
            <p className="text-gray-700">
              Smart contracts automatically handle deposits and returns without intermediaries.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-indigo-800 mb-2">Secure Deposits</h3>
            <p className="text-gray-700">
              Your deposit is locked securely in the contract until you return the book.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-indigo-800 mb-2">Fair Pricing</h3>
            <p className="text-gray-700">
              Pay only for the exact duration you keep the book, calculated to the day.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-indigo-800 mb-2">Community Sharing</h3>
            <p className="text-gray-700">
              Share your knowledge by making your books available to others in the community.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;