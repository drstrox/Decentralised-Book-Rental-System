import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './Web3Context';
import BookRentalABI from '../contracts/BookRental.json';

// Contract address - will be set after deployment
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Replace with actual address after deployment

interface Book {
  id: number;
  title: string;
  dailyPrice: string;
  deposit: string;
  owner: string;
  renter: string;
  rentedAt: number;
  isAvailable: boolean;
}

interface BookRentalContextType {
  contract: ethers.Contract | null;
  books: Book[];
  userRentals: Book[];
  loadBooks: () => Promise<void>;
  loadUserRentals: () => Promise<void>;
  listBook: (title: string, dailyPrice: string, deposit: string) => Promise<void>;
  rentBook: (bookId: number, totalPayment: string) => Promise<void>;
  returnBook: (bookId: number) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const BookRentalContext = createContext<BookRentalContextType | undefined>(undefined);

export const useBookRental = (): BookRentalContextType => {
  const context = useContext(BookRentalContext);
  if (!context) {
    throw new Error('useBookRental must be used within a BookRentalProvider');
  }
  return context;
};

interface BookRentalProviderProps {
  children: ReactNode;
}

export const BookRentalProvider: React.FC<BookRentalProviderProps> = ({ children }) => {
  const { provider, signer, account, isConnected } = useWeb3();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [userRentals, setUserRentals] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize contract
  useEffect(() => {
    const initializeContract = async () => {
      if (provider && signer) {
        try {
          // Create contract instance
          const contractInstance = new ethers.Contract(
            CONTRACT_ADDRESS,
            BookRentalABI.abi,
            signer
          );
          setContract(contractInstance);
        } catch (err) {
          console.error('Error initializing contract:', err);
          setError('Failed to initialize contract');
        }
      }
    };

    initializeContract();
  }, [provider, signer]);

  // Load books
  const loadBooks = async () => {
    if (!contract) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await contract.getAllBooks();
      const [ids, titles, dailyPrices, deposits, owners, availability] = result;
      
      const formattedBooks: Book[] = [];
      
      for (let i = 0; i < ids.length; i++) {
        // Get complete book details for each book
        const details = await contract.getBookDetails(ids[i]);
        
        formattedBooks.push({
          id: Number(ids[i]),
          title: titles[i],
          dailyPrice: ethers.formatEther(dailyPrices[i]),
          deposit: ethers.formatEther(deposits[i]),
          owner: owners[i],
          renter: details[4],
          rentedAt: Number(details[5]),
          isAvailable: availability[i]
        });
      }
      
      setBooks(formattedBooks);
    } catch (err) {
      console.error('Error loading books:', err);
      setError('Failed to load books');
    } finally {
      setIsLoading(false);
    }
  };

  // Load user's rented books
  const loadUserRentals = async () => {
    if (!contract || !account) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const rentalIds = await contract.getUserRentals(account);
      
      const rentals: Book[] = [];
      
      for (let i = 0; i < rentalIds.length; i++) {
        const bookId = Number(rentalIds[i]);
        const details = await contract.getBookDetails(bookId);
        
        rentals.push({
          id: bookId,
          title: details[0],
          dailyPrice: ethers.formatEther(details[1]),
          deposit: ethers.formatEther(details[2]),
          owner: details[3],
          renter: details[4],
          rentedAt: Number(details[5]),
          isAvailable: details[6]
        });
      }
      
      setUserRentals(rentals);
    } catch (err) {
      console.error('Error loading user rentals:', err);
      setError('Failed to load your rented books');
    } finally {
      setIsLoading(false);
    }
  };

  // List a book
  const listBook = async (title: string, dailyPrice: string, deposit: string) => {
    if (!contract) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const dailyPriceWei = ethers.parseEther(dailyPrice);
      const depositWei = ethers.parseEther(deposit);
      
      const tx = await contract.listBook(title, dailyPriceWei, depositWei);
      await tx.wait();
      
      await loadBooks();
    } catch (err) {
      console.error('Error listing book:', err);
      setError('Failed to list book');
    } finally {
      setIsLoading(false);
    }
  };

  // Rent a book
  const rentBook = async (bookId: number, totalPayment: string) => {
    if (!contract) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const paymentWei = ethers.parseEther(totalPayment);
      
      const tx = await contract.rentBook(bookId, { value: paymentWei });
      await tx.wait();
      
      await Promise.all([loadBooks(), loadUserRentals()]);
    } catch (err) {
      console.error('Error renting book:', err);
      setError('Failed to rent book');
    } finally {
      setIsLoading(false);
    }
  };

  // Return a book
  const returnBook = async (bookId: number) => {
    if (!contract) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const tx = await contract.returnBook(bookId);
      await tx.wait();
      
      await Promise.all([loadBooks(), loadUserRentals()]);
    } catch (err) {
      console.error('Error returning book:', err);
      setError('Failed to return book');
    } finally {
      setIsLoading(false);
    }
  };

  // Load books when contract is initialized
  useEffect(() => {
    if (contract && isConnected) {
      loadBooks();
      loadUserRentals();
    }
  }, [contract, isConnected, account]);

  const value = {
    contract,
    books,
    userRentals,
    loadBooks,
    loadUserRentals,
    listBook,
    rentBook,
    returnBook,
    isLoading,
    error
  };

  return <BookRentalContext.Provider value={value}>{children}</BookRentalContext.Provider>;
};