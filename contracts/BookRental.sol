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
        uint256 rentalPeriod; // rental period in seconds
        bool isAvailable;
        string metadataUri; // New field for metadata URI
    }
    
    // Mapping from book ID to Book struct
    mapping(uint256 => Book) public books;
    
    // Counter for book IDs
    uint128 private _bookIdCounter; // Gas optimization: use smaller type since we don't expect more than 2^128 books
    
    // Mapping to track user's rented books
    mapping(address => uint256[]) private userRentals;
    
    // Events
    event BookListed(uint256 indexed bookId, string title, uint256 dailyPrice, uint256 deposit, address owner, string metadataUri);
    event BookRented(uint256 indexed bookId, address renter, uint256 rentedAt, uint256 deposit);
    event BookReturned(uint256 indexed bookId, address renter, uint256 returnedAt, uint256 refundAmount, uint256 lateFee);

    /**
     * @dev List a book for rental
     * @param _title Title of the book
     * @param _dailyPrice Daily rental price in wei
     * @param _deposit Deposit amount in wei
     * @param _metadataUri URI containing metadata about the book
     */
    function listBook(string memory _title, uint256 _dailyPrice, uint256 _deposit, string memory _metadataUri) external {
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
            rentalPeriod: 0,
            isAvailable: true,
            metadataUri: _metadataUri
        });
        
        emit BookListed(bookId, _title, _dailyPrice, _deposit, msg.sender, _metadataUri);
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
        book.rentalPeriod = block.timestamp + 1 days; // Default rental period set to 1 day
        
        // Add to user's rentals
        userRentals[msg.sender].push(_bookId);
        
        // Send first day's payment to the owner
        (bool success, ) = payable(book.owner).call{value: book.dailyPrice}("");
        require(success, "Failed to send payment to owner");

        if (msg.value > book.deposit + book.dailyPrice) { // Gas optimization: check if excess payment exists using calculation, not by storing in a variable
            (bool renterSuccess, ) = payable(msg.sender).call{value: msg.value - (book.deposit + book.dailyPrice)}("");
            require(renterSuccess, "Failed to refund excess payment to renter");
        }

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

        uint256 rentalDays = (block.timestamp - book.rentedAt + 86399) / 86400; // 86400 seconds = 1 day
        if (rentalDays == 0) {
            rentalDays = 1; // Minimum 1 day rental
        }
        
        // Calculate the late fee (if any)
        uint256 lateFee = 0;
        if (block.timestamp > book.rentalPeriod) {
            uint256 lateDays = (block.timestamp - book.rentalPeriod + 86399) / 86400; // Calculate how many days late
            lateFee = book.dailyPrice * lateDays;
        }
        
        // Calculate total rental cost (first day already paid)
        uint256 totalRentalCost = book.dailyPrice * (rentalDays - 1) + lateFee;
        
        uint256 refundAmount = book.deposit - totalRentalCost;

        if (totalRentalCost < book.deposit) {
            // Send rental fee to the owner
            (bool ownerSuccess, ) = payable(book.owner).call{value: totalRentalCost}("");
            require(ownerSuccess, "Failed to send payment to owner");

            // Refund the renter if applicable
            if (refundAmount > 0) {
                (bool renterSuccess, ) = payable(msg.sender).call{value: refundAmount}("");
                require(renterSuccess, "Failed to send refund to renter");
            }
        } else {
            // Send entire deposit to the owner in case of no refund
            (bool ownerSuccess, ) = payable(book.owner).call{value: book.deposit}("");
            require(ownerSuccess, "Failed to send deposit to owner");
        }

        // Reset book status
        book.isAvailable = true;
        
        // Remove from user's rentals
        removeFromUserRentals(msg.sender, _bookId);
        
        emit BookReturned(_bookId, msg.sender, block.timestamp, refundAmount, lateFee);
        
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
    uint256 length = rentals.length;
    
    // Fix: Loop indexing was incorrect
    for (uint256 i = 0; i < length;) {
        if (rentals[i] == _bookId) {
            // Replace with the last element
            rentals[i] = rentals[length - 1];
            // Remove the last element
            rentals.pop();
            break;
        }
        unchecked {
            ++i;
        }
    }
}

    /**
     * @dev Get all books
     * @return Array of book IDs, titles, daily prices, deposits, owners, availability status, and metadata URIs
     */
    function getAllBooks() external view returns (
        uint256[] memory,
        string[] memory,
        uint256[] memory,
        uint256[] memory,
        address[] memory,
        bool[] memory,
        string[] memory // Metadata URI array
    ) {
        uint256[] memory ids = new uint256[](_bookIdCounter);
        string[] memory titles = new string[](_bookIdCounter);
        uint256[] memory dailyPrices = new uint256[](_bookIdCounter);
        uint256[] memory deposits = new uint256[](_bookIdCounter);
        address[] memory owners = new address[](_bookIdCounter);
        bool[] memory availability = new bool[](_bookIdCounter);
        string[] memory metadataUris = new string[](_bookIdCounter);

        for (uint256 i = 0; i < _bookIdCounter; i++) {
            Book memory book = books[i]; // Gas optimization: load book once in memory instead of storage
            ids[i] = i;
            titles[i] = book.title;
            dailyPrices[i] = book.dailyPrice;
            deposits[i] = book.deposit;
            owners[i] = book.owner;
            availability[i] = book.isAvailable;
            metadataUris[i] = book.metadataUri; // Adding metadata URI
        }

        return (ids, titles, dailyPrices, deposits, owners, availability, metadataUris);
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
     * @return Book details (title, daily price, deposit, owner, renter, rentedAt, availability, metadataUri)
     */
    function getBookDetails(uint256 _bookId) external view returns (
        string memory,
        uint256,
        uint256,
        address,
        address,
        uint256,
        bool,
        string memory // metadataUri added
    ) {
        Book storage book = books[_bookId];
        return (
            book.title,
            book.dailyPrice,
            book.deposit,
            book.owner,
            book.renter,
            book.rentedAt,
            book.isAvailable,
            book.metadataUri
        );
    }
}
