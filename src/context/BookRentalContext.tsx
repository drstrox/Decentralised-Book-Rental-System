import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './Web3Context';
import BookRentalABI from '../contracts/BookRental.json';

const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Replace with actual

interface Book {
  id: number;
  title: string;
  dailyPrice: string;
  deposit: string;
  owner: string;
  renter: string;
  rentedAt: number;
  rentalPeriod: number;
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

  useEffect(() => {
    if (provider && signer) {
      const initContract = new ethers.Contract(CONTRACT_ADDRESS, BookRentalABI.abi, signer);
      setContract(initContract);
    }
  }, [provider, signer]);

  const formatBook = (
    id: number,
    title: string,
    dailyPrice: bigint,
    deposit: bigint,
    owner: string,
    renter: string,
    rentedAt: bigint,
    rentalPeriod: bigint,
    isAvailable: boolean
  ): Book => ({
    id,
    title,
    dailyPrice: ethers.formatEther(dailyPrice),
    deposit: ethers.formatEther(deposit),
    owner,
    renter,
    rentedAt: Number(rentedAt),
    rentalPeriod: Number(rentalPeriod),
    isAvailable
  });

  const loadBooks = async () => {
    if (!contract) return;
    setIsLoading(true);
    setError(null);
    try {
      const [ids, titles, dailyPrices, deposits, owners, availability] = await contract.getAllBooks();

      const fetchedBooks: Book[] = await Promise.all(
        ids.map(async (id: bigint, idx: number) => {
          const details = await contract.getBookDetails(id);
          return formatBook(
            Number(id),
            titles[idx],
            dailyPrices[idx],
            deposits[idx],
            owners[idx],
            details[4],
            details[5],
            details[6],
            availability[idx]
          );
        })
      );

      setBooks(fetchedBooks);
    } catch (err) {
      console.error(err);
      setError('Failed to load books');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserRentals = async () => {
    if (!contract || !account) return;
    setIsLoading(true);
    setError(null);
    try {
      const ids = await contract.getUserRentals(account);
      const rentals: Book[] = await Promise.all(
        ids.map(async (id: bigint) => {
          const bookId = Number(id);
          const details = await contract.getBookDetails(bookId);
          return formatBook(
            bookId,
            details[0],
            details[1],
            details[2],
            details[3],
            details[4],
            details[5],
            details[6],
            details[7]
          );
        })
      );
      setUserRentals(rentals);
    } catch (err) {
      console.error(err);
      setError('Failed to load user rentals');
    } finally {
      setIsLoading(false);
    }
  };

  const listBook = async (title: string, dailyPrice: string, deposit: string) => {
    if (!contract) return;
    setIsLoading(true);
    setError(null);
    try {
      const tx = await contract.listBook(
        title,
        ethers.parseEther(dailyPrice),
        ethers.parseEther(deposit)
      );
      await tx.wait();
      await loadBooks();
    } catch (err) {
      console.error(err);
      setError('Failed to list book');
    } finally {
      setIsLoading(false);
    }
  };

  const rentBook = async (bookId: number, totalPayment: string) => {
    if (!contract) return;
    setIsLoading(true);
    setError(null);
    try {
      const tx = await contract.rentBook(bookId, {
        value: ethers.parseEther(totalPayment)
      });
      await tx.wait();
      await Promise.all([loadBooks(), loadUserRentals()]);
    } catch (err) {
      console.error(err);
      setError('Failed to rent book');
    } finally {
      setIsLoading(false);
    }
  };

  const returnBook = async (bookId: number) => {
    if (!contract) return;
    setIsLoading(true);
    setError(null);
    try {
      const tx = await contract.returnBook(bookId);
      await tx.wait();
      await Promise.all([loadBooks(), loadUserRentals()]);
    } catch (err) {
      console.error(err);
      setError('Failed to return book');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (contract && isConnected) {
      loadBooks();
      loadUserRentals();
    }
  }, [contract, isConnected, account]);

  const value: BookRentalContextType = {
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
