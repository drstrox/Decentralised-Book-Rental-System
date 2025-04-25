import React from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useBookRental } from '../context/BookRentalContext';

interface BookCardProps {
  id: number;
  title: string;
  dailyPrice: string;
  deposit: string;
  owner: string;
  isAvailable: boolean;
  isRented?: boolean;
  rentedAt?: number;
  author?: string;
  description?: string;
  cover?: string;
}

const BookCard: React.FC<BookCardProps> = ({
  id,
  title,
  dailyPrice,
  deposit,
  owner,
  isAvailable,
  isRented = false,
  rentedAt = 0,
  author,
  description,
  cover
}) => {
  const { account } = useWeb3();
  const { rentBook, returnBook } = useBookRental();

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const calculateRentalDuration = () => {
    if (!rentedAt) return 0;

    const now = Math.floor(Date.now() / 1000);
    const secondsRented = now - rentedAt;
    return Math.ceil(secondsRented / 86400);
  };

  const calculateTotalCost = () => {
    return (parseFloat(dailyPrice) + parseFloat(deposit)).toFixed(4);
  };

  const handleRent = async () => {
    await rentBook(id, calculateTotalCost());
  };

  const handleReturn = async () => {
    await returnBook(id);
  };

  const daysRented = calculateRentalDuration();
  const currentRentalCost = daysRented > 0
    ? (parseFloat(dailyPrice) * daysRented).toFixed(4)
    : dailyPrice;

  const isOwner = account?.toLowerCase() === owner.toLowerCase();

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transform transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {cover && (
        <img
          src={cover}
          alt={title}
          className="w-full h-56 object-cover"
        />
      )}

      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          {isAvailable ? (
            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">
              Available
            </span>
          ) : (
            <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded">
              Rented
            </span>
          )}
        </div>

        {author && (
          <p className="text-sm text-gray-500 mb-1 italic">by {author}</p>
        )}

        {description && (
          <p className="text-gray-700 mb-4">{description}</p>
        )}

        <p className="text-gray-600 mb-2">Owner: {shortenAddress(owner)}</p>

        <div className="mb-4">
          <p className="text-gray-700">
            <span className="font-medium">Daily Price:</span>{' '}
            <span className="text-indigo-600 font-bold">{dailyPrice} ETH</span>
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Deposit:</span>{' '}
            <span className="text-indigo-600 font-bold">{deposit} ETH</span>
          </p>
        </div>

        {isRented && (
          <div className="mb-4 p-3 bg-indigo-50 rounded-md">
            <p className="text-gray-700">
              <span className="font-medium">Days Rented:</span> {daysRented}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Current Cost:</span>{' '}
              <span className="text-indigo-600 font-bold">{currentRentalCost} ETH</span>
            </p>
          </div>
        )}

        {account && (
          <div className="mt-4">
            {isAvailable && !isOwner ? (
              <button
                onClick={handleRent}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
              >
                Rent for {calculateTotalCost()} ETH
              </button>
            ) : isRented ? (
              <button
                onClick={handleReturn}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
              >
                Return Book
              </button>
            ) : isOwner ? (
              <p className="text-center text-gray-500 italic">You own this book</p>
            ) : (
              <button
                disabled
                className="w-full bg-gray-300 text-gray-500 font-bold py-2 px-4 rounded-md cursor-not-allowed"
              >
                Not Available
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookCard;
