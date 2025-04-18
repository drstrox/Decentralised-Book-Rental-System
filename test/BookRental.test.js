const BookRental = artifacts.require("BookRental");
const truffleAssert = require('truffle-assertions');

contract("BookRental", accounts => {
  const [owner, renter, thirdParty] = accounts;
  let bookRental;
  
  const bookTitle = "The Catcher in the Rye";
  const dailyPrice = web3.utils.toWei("0.01", "ether");
  const deposit = web3.utils.toWei("0.1", "ether");
  
  beforeEach(async () => {
    bookRental = await BookRental.new({ from: owner });
  });
  
  describe("Listing books", () => {
    it("should allow listing a book", async () => {
      const tx = await bookRental.listBook(bookTitle, dailyPrice, deposit, { from: owner });
      
      // Check event emission
      truffleAssert.eventEmitted(tx, 'BookListed', (ev) => {
        return ev.title === bookTitle &&
               ev.dailyPrice.toString() === dailyPrice.toString() &&
               ev.deposit.toString() === deposit.toString() &&
               ev.owner === owner;
      });
      
      // Check book details
      const bookDetails = await bookRental.getBookDetails(0);
      assert.equal(bookDetails[0], bookTitle, "Title does not match");
      assert.equal(bookDetails[1].toString(), dailyPrice, "Daily price does not match");
      assert.equal(bookDetails[2].toString(), deposit, "Deposit does not match");
      assert.equal(bookDetails[3], owner, "Owner does not match");
      assert.equal(bookDetails[6], true, "Book should be available");
    });
    
    it("should reject listing with zero price or deposit", async () => {
      await truffleAssert.reverts(
        bookRental.listBook(bookTitle, 0, deposit, { from: owner }),
        "Daily price must be greater than 0"
      );
      
      await truffleAssert.reverts(
        bookRental.listBook(bookTitle, dailyPrice, 0, { from: owner }),
        "Deposit must be greater than 0"
      );
    });
  });
  
  describe("Renting books", () => {
    beforeEach(async () => {
      await bookRental.listBook(bookTitle, dailyPrice, deposit, { from: owner });
    });
    
    it("should allow renting a book with sufficient payment", async () => {
      const payment = web3.utils.toBN(deposit).add(web3.utils.toBN(dailyPrice));
      const tx = await bookRental.rentBook(0, { from: renter, value: payment });
      
      // Check event emission
      truffleAssert.eventEmitted(tx, 'BookRented', (ev) => {
        return ev.bookId.toNumber() === 0 &&
               ev.renter === renter &&
               ev.deposit.toString() === deposit.toString();
      });
      
      // Check book status
      const bookDetails = await bookRental.getBookDetails(0);
      assert.equal(bookDetails[4], renter, "Renter address does not match");
      assert.equal(bookDetails[6], false, "Book should not be available");
      
      // Check user rentals
      const userRentals = await bookRental.getUserRentals(renter);
      assert.equal(userRentals.length, 1, "User should have 1 rental");
      assert.equal(userRentals[0].toNumber(), 0, "User should have rented book 0");
    });
    
    it("should reject renting with insufficient payment", async () => {
      const insufficientPayment = web3.utils.toBN(deposit).sub(web3.utils.toBN("1"));
      
      await truffleAssert.reverts(
        bookRental.rentBook(0, { from: renter, value: insufficientPayment }),
        "Insufficient payment"
      );
    });
    
    it("should reject renting by the owner", async () => {
      const payment = web3.utils.toBN(deposit).add(web3.utils.toBN(dailyPrice));
      
      await truffleAssert.reverts(
        bookRental.rentBook(0, { from: owner, value: payment }),
        "Owner cannot rent their own book"
      );
    });
    
    it("should reject renting an already rented book", async () => {
      const payment = web3.utils.toBN(deposit).add(web3.utils.toBN(dailyPrice));
      
      // First rental
      await bookRental.rentBook(0, { from: renter, value: payment });
      
      // Second rental attempt
      await truffleAssert.reverts(
        bookRental.rentBook(0, { from: thirdParty, value: payment }),
        "Book is not available for rent"
      );
    });
  });
  
  describe("Returning books", () => {
    beforeEach(async () => {
      await bookRental.listBook(bookTitle, dailyPrice, deposit, { from: owner });
      
      const payment = web3.utils.toBN(deposit).add(web3.utils.toBN(dailyPrice));
      await bookRental.rentBook(0, { from: renter, value: payment });
    });
    
    it("should allow the renter to return a book", async () => {
      const tx = await bookRental.returnBook(0, { from: renter });
      
      // Check event emission
      truffleAssert.eventEmitted(tx, 'BookReturned');
      
      // Check book status
      const bookDetails = await bookRental.getBookDetails(0);
      assert.equal(bookDetails[4], "0x0000000000000000000000000000000000000000", "Renter should be reset");
      assert.equal(bookDetails[6], true, "Book should be available again");
      
      // Check user rentals
      const userRentals = await bookRental.getUserRentals(renter);
      assert.equal(userRentals.length, 0, "User should have 0 rentals");
    });
    
    it("should reject return by non-renter", async () => {
      await truffleAssert.reverts(
        bookRental.returnBook(0, { from: thirdParty }),
        "Only the renter can return the book"
      );
    });
  });
});