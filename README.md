# Decentralized Book Rental Platform

A trustless book rental platform built on Ethereum where users can list books for rent, borrow books, and automatically handle deposits and refunds through smart contracts.

## Features

- **List Books:** Owners can list books with title, daily price, and deposit amount
- **Rent Books:** Users can rent available books by paying a deposit and daily fee
- **Return Books:** Return rented books and receive deposit refund minus rental fees
- **Automatic Calculations:** Smart contract handles all payment calculations
- **Security:** Implementation of reentrancy protection and proper access controls

## Tech Stack

- Solidity (Smart Contracts)
- Truffle & Ganache (Testing)
- React (Frontend)
- Ethers.js (Blockchain Integration)
- TailwindCSS (Styling)

## Project Structure

```
├── contracts/          # Smart contract source files
├── migrations/         # Truffle migration scripts
├── src/                # React frontend
│   ├── components/     # UI components
│   ├── context/        # React context providers
│   ├── contracts/      # Contract ABIs
│   └── pages/          # Application pages
└── test/               # Smart contract tests
```

## Smart Contract Details

The BookRental contract includes:

- **Data Structures:** Efficient storage using structs and mappings
- **Core Functions:**
  - `listBook`: List a book with details and set availability
  - `rentBook`: Rent a book with deposit and first day's payment
  - `returnBook`: Return a book and calculate refund
- **View Functions:**
  - `getAllBooks`: Get all listed books
  - `getUserRentals`: Get books rented by a specific user
  - `getBookDetails`: Get detailed information about a book
- **Events:**
  - BookListed: Emitted when a book is listed
  - BookRented: Emitted when a book is rented
  - BookReturned: Emitted when a book is returned

## Getting Started

### Prerequisites

- Node.js and npm
- MetaMask or another Ethereum wallet
- Ganache for local Ethereum development

### Installation

1. Clone the repository
   ```
   git clone https://github.com/drstrox/Decentralised-Book-Rental-System.git
   cd Decentralised-Book-Rental-System
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start Ganache (local Ethereum blockchain)
   ```
   npx ganache-cli
   ```

4. Compile and deploy the smart contracts
   ```
   npx truffle compile
   npx truffle migrate
   ```

5. Start the development server
   ```
   npm run dev
   ```

### Testing

Run the test suite with:
```
npm test
```

## Usage

1. **Connect Wallet**: Connect MetaMask to the application
2. **List a Book**: Navigate to the "List a Book" page and fill in the details
3. **Rent a Book**: Browse the marketplace and rent a book by paying the deposit and fee
4. **Return a Book**: Return a book from the "My Rentals" page to get your refund

