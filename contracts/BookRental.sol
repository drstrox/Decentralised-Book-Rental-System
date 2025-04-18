// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BookRental is ReentrancyGuard {
    // Struct to store book information
    struct Book {
        string title;
        uint256 dailyPrice; // in wei
        uint256 deposit; // in wei
        address owner;
        address renter;
        uint256 rentedAt; // timestamp when book was rented
        bool isAvailable;
    }
    
    // Mapping from book ID to Book struct
    mapping(uint256 => Book) public books;
    
    // Counter for book IDs
    uint256 private _bookIdCounter;
    
    // Mapping to track user's rented books
    mapping(address => uint256[]) private userRentals;
    
    // Events
    event BookListed(uint256 indexed bookId, string title, uint256 dailyPrice, uint256 deposit, address owner);
    event BookRented(uint256 indexed bookId, address renter, uint256 rentedAt, uint256 deposit);
    event BookReturned(uint256 indexed bookId, address renter, uint256 returnedAt, uint256 refundAmount);
    
    /**
     * @dev List a book for rental
     * @param _title Title of the book
     * @param _dailyPrice Daily rental price in wei
     * @param _deposit Deposit amount in wei
     */
    function listBook(string memory _title, uint256 _dailyPrice, uint256 _deposit) external {
        require(_dailyPrice > 0, "Daily price must be greater than 0");
        require(_deposit > 0, "Deposit must be greater than 0");
        
        uint256 bookId = _bookIdCounter;
        _bookIdCounter++;
        
        books[bookId] = Book({
            title: _title,
            dailyPrice: _dailyPrice,
            deposit: _deposit,
            owner: msg.sender,
            renter: address(0),
            rentedAt: 0,
            isAvailable: true
        });
        
        emit BookListed(bookId, _title, _dailyPrice, _deposit, msg.sender);
    }
    
    /**
     * @dev Rent a book
     * @param _bookId ID of the book to rent
     */
    function rentBook(uint256 _bookId) external payable nonReentrant {
        Book storage book = books[_bookId];
        
        require(book.owner != address(0), "Book does not exist");
        require(book.isAvailable, "Book is not available for rent");
        require(msg.sender != book.owner, "Owner cannot rent their own book");
        require(msg.value >= book.deposit + book.dailyPrice, "Insufficient payment");
        
        // Update book status
        book.renter = msg.sender;
        book.rentedAt = block.timestamp;
        book.isAvailable = false;
        
        // Add to user's rentals
        userRentals[msg.sender].push(_bookId);
        
        // Send first day's payment to the owner
        (bool success, ) = payable(book.owner).call{value: book.dailyPrice}("");
        require(success, "Failed to send payment to owner");
        
        emit BookRented(_bookId, msg.sender, block.timestamp, book.deposit);
    }
    
    /**
     * @dev Return a rented book
     * @param _bookId ID of the book to return
     */
    function returnBook(uint256 _bookId) external nonReentrant {
        Book storage book = books[_bookId];
        
        require(book.owner != address(0), "Book does not exist");
        require(!book.isAvailable, "Book is not rented");
        require(msg.sender == book.renter, "Only the renter can return the book");
        
        // Calculate rental period in days (rounded up)
        uint256 rentalDays = (block.timestamp - book.rentedAt + 86399) / 86400; // 86400 seconds = 1 day
        if (rentalDays == 0) {
            rentalDays = 1; // Minimum 1 day rental
        }
        
        // Calculate total rental cost (first day already paid)
        uint256 remainingRentalCost = book.dailyPrice * (rentalDays - 1);
        
        // Calculate refund amount (deposit minus remaining rental cost)
        uint256 refundAmount = book.deposit;
        if (remainingRentalCost < refundAmount) {
            refundAmount -= remainingRentalCost;
            
            // Send remaining rental cost to owner
            (bool ownerSuccess, ) = payable(book.owner).call{value: remainingRentalCost}("");
            require(ownerSuccess, "Failed to send payment to owner");
        } else {
            // Rental cost exceeds deposit, no refund for renter
            refundAmount = 0;
            
            // Send entire deposit to owner
            (bool ownerSuccess, ) = payable(book.owner).call{value: book.deposit}("");
            require(ownerSuccess, "Failed to send payment to owner");
        }
        
        // Reset book status
        book.isAvailable = true;
        
        // Remove from user's rentals
        removeFromUserRentals(msg.sender, _bookId);
        
        // Send refund to renter if applicable
        if (refundAmount > 0) {
            (bool renterSuccess, ) = payable(msg.sender).call{value: refundAmount}("");
            require(renterSuccess, "Failed to send refund to renter");
        }
        
        emit BookReturned(_bookId, msg.sender, block.timestamp, refundAmount);
        
        // Reset rental data
        book.renter = address(0);
        book.rentedAt = 0;
    }
    
    /**
     * @dev Helper function to remove a book from user's rentals array
     * @param _user Address of the user
     * @param _bookId ID of the book to remove
     */
    function removeFromUserRentals(address _user, uint256 _bookId) private {
        uint256[] storage rentals = userRentals[_user];
        for (uint256 i = 0; i < rentals.length; i++) {
            if (rentals[i] == _bookId) {
                // Replace with the last element
                rentals[i] = rentals[rentals.length - 1];
                // Remove the last element
                rentals.pop();
                break;
            }
        }
    }
    
    /**
     * @dev Get all books
     * @return Array of book IDs, titles, daily prices, deposits, owners, and availability status
     */
    function getAllBooks() external view returns (
        uint256[] memory,
        string[] memory,
        uint256[] memory,
        uint256[] memory,
        address[] memory,
        bool[] memory
    ) {
        uint256[] memory ids = new uint256[](_bookIdCounter);
        string[] memory titles = new string[](_bookIdCounter);
        uint256[] memory dailyPrices = new uint256[](_bookIdCounter);
        uint256[] memory deposits = new uint256[](_bookIdCounter);
        address[] memory owners = new address[](_bookIdCounter);
        bool[] memory availability = new bool[](_bookIdCounter);
        
        for (uint256 i = 0; i < _bookIdCounter; i++) {
            Book storage book = books[i];
            ids[i] = i;
            titles[i] = book.title;
            dailyPrices[i] = book.dailyPrice;
            deposits[i] = book.deposit;
            owners[i] = book.owner;
            availability[i] = book.isAvailable;
        }
        
        return (ids, titles, dailyPrices, deposits, owners, availability);
    }
    
    /**
     * @dev Get user's rented books
     * @param _user Address of the user
     * @return Array of rented book IDs
     */
    function getUserRentals(address _user) external view returns (uint256[] memory) {
        return userRentals[_user];
    }
    
    /**
     * @dev Get book details
     * @param _bookId ID of the book
     * @return Book details (title, daily price, deposit, owner, renter, rentedAt, availability)
     */
    function getBookDetails(uint256 _bookId) external view returns (
        string memory,
        uint256,
        uint256,
        address,
        address,
        uint256,
        bool
    ) {
        Book storage book = books[_bookId];
        return (
            book.title,
            book.dailyPrice,
            book.deposit,
            book.owner,
            book.renter,
            book.rentedAt,
            book.isAvailable
        );
    }
}