'reach 0.1'

// const modal = new bootstrap.Modal(document.getElementById('confirm-modal'), {})
// modal.show();
//Requirements
// 1. Wisdom for Sale requires two participants, a Buyer and a Seller.
// 2. Functions for Buyer (Person who buys livestock from the Seller)
//  2.1 a pay function that allows the Buyer to pay the Seller
//  2.2 a function that displays the bought livestock
// 3. Functions for Seller (Person who sells livestock to the Buyer)
//  3.1 a function that allows the Seller to list livestock for sale
//  3.2 a function that allows the Seller to input the livestock details
// 4. Both participants will be publishing information: the farmer will be publishing the livestock for sale, and the buyer will be publishing their decision to buy the livestock.
// 5. The buyer needs to be able to decide not to buy the livestock, so there needs to be a function that allows the buyer to cancel the transaction.
// 6. The buyer needs to be able to pay the seller, so there needs to be a function that allows the buyer to pay the seller.

//Application initialization defines participants and their views

const commonInteract = {
    reportCancellation: Fun([], Null),
    reportPayment: Fun([UInt], Null),
    reportTransfer: Fun([UInt], Null)
};

const farmerInteract = {
    ...commonInteract,
    price: UInt,
    reportReady: Fun([UInt], Null),
    livestockData: Bytes(128)
};

const buyerInteract = {
    ...commonInteract,
    confirmPurchase: Fun([UInt], Bool),
    reportLivestock: Fun([Bytes(128)], Null)
    
};

export const main = Reach.App(() => {
    const Farmer = Participant('Farmer', farmerInteract);
    const Buyer = Participant('Buyer', buyerInteract);
    const V = View('Main', { price: UInt });
    init(); //transitions form the program from App Init to Step

    Farmer.only(() => { const price = declassify(interact.price); });
    Farmer.publish(price);
    Farmer.interact.reportReady(price);
    V.price.set(price);
    commit();

    Buyer.only(() => { const willBuy = declassify(interact.confirmPurchase(price)); });
    Buyer.publish(willBuy);
    if (!willBuy) {
      commit();
      each([Farmer, Buyer], () => interact.reportCancellation());
      exit();
    } else {
      commit();
    }

    Buyer.pay(price);
    each([Farmer, Buyer], () => interact.reportPayment(price));
    commit();

    Farmer.only(() => { const livestockData = declassify(interact.livestockData); });
    Farmer.publish(livestockData);
    transfer(price).to(Farmer);
    commit();

    each([Farmer, Buyer], () => interact.reportTransfer(price));
    Buyer.interact.reportLivestock(livestockData);

    exit()
});
