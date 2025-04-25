import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { useBookRental } from '../context/BookRentalContext';
import { uploadMetadataToIPFS } from '../utils/uploadMetadata';

const ListBook: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, account } = useWeb3();
  const { listBook, isLoading, error } = useBookRental();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [dailyPrice, setDailyPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [formError, setFormError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [coverUrl, setCoverUrl] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccess(false);

    if (!title.trim()) return setFormError('Please enter a book title');
    if (!author.trim()) return setFormError('Please enter the author name');
    if (!description.trim()) return setFormError('Please enter book description');
    if (!dailyPrice || parseFloat(dailyPrice) <= 0) return setFormError('Enter a valid daily price');
    if (!deposit || parseFloat(deposit) <= 0) return setFormError('Enter a valid deposit amount');

    try {
      const metadataCID = await uploadMetadataToIPFS(title, author, description);
      const metadataUri = `ipfs://${metadataCID}`;

      const cover = `https://ipfs.io/ipfs/${metadataCID}/image`;
      setCoverUrl(cover);

      await listBook(title, dailyPrice, deposit, metadataUri);

      setSuccess(true);
      setTitle('');
      setDescription('');
      setAuthor('');
      setDailyPrice('');
      setDeposit('');

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

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label htmlFor="title" className="block font-medium mb-1">Book Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label htmlFor="author" className="block font-medium mb-1">Author Name</label>
          <input
            type="text"
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block font-medium mb-1">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            rows={4}
            required
          />
        </div>

        <div>
          <label htmlFor="dailyPrice" className="block font-medium mb-1">Daily Rental Price (ETH)</label>
          <input
            type="number"
            id="dailyPrice"
            value={dailyPrice}
            onChange={(e) => setDailyPrice(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            step="0.0001"
            min="0.0001"
            required
          />
        </div>

        <div>
          <label htmlFor="deposit" className="block font-medium mb-1">Deposit Amount (ETH)</label>
          <input
            type="number"
            id="deposit"
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            step="0.001"
            min="0.001"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition ${
            isLoading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Processing...' : 'List Book'}
        </button>
      </form>

      {coverUrl && (
        <div className="mt-6 text-center">
          <p className="font-medium text-gray-700">Fetched Book Cover:</p>
          <img src={coverUrl} alt="Book Cover" className="w-40 mx-auto mt-2 rounded shadow" />
        </div>
      )}
    </div>
  );
};

export default ListBook;
