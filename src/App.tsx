import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ListBook from './pages/ListBook';
import Marketplace from './pages/Marketplace';
import MyRentals from './pages/MyRentals';
import { Web3Provider } from './context/Web3Context';
import { BookRentalProvider } from './context/BookRentalContext';

function App() {
  return (
    <Web3Provider>
      <BookRentalProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/list" element={<ListBook />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/my-rentals" element={<MyRentals />} />
              </Routes>
            </main>
          </div>
        </Router>
      </BookRentalProvider>
    </Web3Provider>
  );
}

export default App;