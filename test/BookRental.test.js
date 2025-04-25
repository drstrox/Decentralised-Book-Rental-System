const BookRental = artifacts.require("BookRental");
const truffleAssert = require('truffle-assertions');
const { time } = require('@openzeppelin/test-helpers');


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

      truffleAssert.eventEmitted(tx, 'BookListed', (ev) => {
        return ev.title === bookTitle &&
               ev.dailyPrice.toString() === dailyPrice.toString() &&
               ev.deposit.toString() === deposit.toString() &&
               ev.owner === owner;
      });

      const bookDetails = await bookRental.getBookDetails(0);
      assert.equal(bookDetails[0], bookTitle);
      assert.equal(bookDetails[1].toString(), dailyPrice);
      assert.equal(bookDetails[2].toString(), deposit);
      assert.equal(bookDetails[3], owner);
      assert.equal(bookDetails[6], true);
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

      truffleAssert.eventEmitted(tx, 'BookRented', (ev) => {
        return ev.bookId.toNumber() === 0 &&
               ev.renter === renter &&
               ev.deposit.toString() === deposit.toString();
      });

      const bookDetails = await bookRental.getBookDetails(0);
      assert.equal(bookDetails[4], renter);
      assert.equal(bookDetails[6], false);

      const userRentals = await bookRental.getUserRentals(renter);
      assert.equal(userRentals.length, 1);
      assert.equal(userRentals[0].toNumber(), 0);
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

      await bookRental.rentBook(0, { from: renter, value: payment });

      await truffleAssert.reverts(
        bookRental.rentBook(0, { from: thirdParty, value: payment }),
        "Book is not available for rent"
      );
    });
  });

  describe("Returning books", () => {
    let payment;

    beforeEach(async () => {
      await bookRental.listBook(bookTitle, dailyPrice, deposit, { from: owner });
      payment = web3.utils.toBN(deposit).add(web3.utils.toBN(dailyPrice));
      await bookRental.rentBook(0, { from: renter, value: payment });
    });

    it("should allow the renter to return a book on time", async () => {
      const tx = await bookRental.returnBook(0, { from: renter });

      truffleAssert.eventEmitted(tx, 'BookReturned', (ev) => {
        return ev.bookId.toNumber() === 0 &&
               ev.renter === renter &&
               ev.refundAmount.toString() > "0" &&
               ev.lateFee.toString() === "0";
      });

      const bookDetails = await bookRental.getBookDetails(0);
      assert.equal(bookDetails[4], "0x0000000000000000000000000000000000000000");
      assert.equal(bookDetails[6], true);

      const userRentals = await bookRental.getUserRentals(renter);
      assert.equal(userRentals.length, 0);
    });

    it("should reject return by non-renter", async () => {
      await truffleAssert.reverts(
        bookRental.returnBook(0, { from: thirdParty }),
        "Only the renter can return the book"
      );
    });

    it("should deduct late fees for late returns", async () => {
      // Artificially manipulate blockchain time
      const timeJump = 2 * 24 * 60 * 60; // +2 days
      await time.increase(timeJump);

      const tx = await bookRental.returnBook(0, { from: renter });

      truffleAssert.eventEmitted(tx, 'BookReturned', (ev) => {
        return ev.bookId.toNumber() === 0 &&
               ev.renter === renter &&
               web3.utils.toBN(ev.lateFee).gt(web3.utils.toBN(0));
      });

      const bookDetails = await bookRental.getBookDetails(0);
      assert.equal(bookDetails[6], true);
    });

    it("should allow re-renting a book after it is returned", async () => {
      await bookRental.returnBook(0, { from: renter });
    
      const bookAfterReturn = await bookRental.getBookDetails(0);
      assert.equal(bookAfterReturn[6], true, "Book should be available after return");
    
      const newPayment = web3.utils.toBN(deposit).add(web3.utils.toBN(dailyPrice));
      const tx = await bookRental.rentBook(0, { from: thirdParty, value: newPayment });
    
      truffleAssert.eventEmitted(tx, 'BookRented', (ev) => {
        return ev.bookId.toNumber() === 0 &&
               ev.renter === thirdParty &&
               ev.deposit.toString() === deposit.toString();
      });
    
      const bookAfterReRent = await bookRental.getBookDetails(0);
      assert.equal(bookAfterReRent[4], thirdParty);
      assert.equal(bookAfterReRent[6], false, "Book should be marked as unavailable after re-renting");
    
      // Assert rentedAt > 0 and rentalPeriod = rentedAt + 1 day (86400 seconds)
      const rentedAt = web3.utils.toBN(bookAfterReRent[5]);
      const rentalPeriod = await bookRental.books(0).then(book => web3.utils.toBN(book.rentalPeriod));
      
      assert(rentedAt.gt(web3.utils.toBN(0)), "rentedAt should be set");
      assert(rentalPeriod.eq(rentedAt.add(web3.utils.toBN(86400))), "rentalPeriod should be rentedAt + 1 day");
    
      const newUserRentals = await bookRental.getUserRentals(thirdParty);
      assert.equal(newUserRentals.length, 1);
      assert.equal(newUserRentals[0].toNumber(), 0);
    });
    
    
  });
});