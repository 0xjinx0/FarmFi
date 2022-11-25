import { loadStdlib } from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';
import { ask } from '@reach-sh/stdlib';

if (process.argv.length < 3 || ['farmer', 'buyer'].includes(process.argv[2]) == false) {
    console.log('Usage: reach run index [farmer|buyer]');
    process.exit(0);
  }
const role = process.argv[2];

console.log(`Your role is ${role}`);

const stdlib = loadStdlib(process.env);
const suStr = stdlib.standardUnit;
const toAU = (su) => stdlib.parseCurrency(su);
const toSU = (au) => stdlib.formatCurrency(au, 4);
const iBalance = toAU(1000);
const showBalance = async (acc) => console.log(`Your balance is ${toSU(await stdlib.balanceOf(acc))} ${suStr}.`);

const commonInteract = (role) => ({
    reportCancellation: () => { console.log(`${role == 'buyer' ? 'You' : 'The buyer'} cancelled the order.`); },
    reportTransfer: (payment) => { console.log(`The contract paid ${toSU(payment)} ${suStr} to ${role == 'farmer' ? 'you' : 'the farmer'}.`) },
    reportPayment: (payment) => { console.log(`${role == 'buyer' ? 'You' : 'The buyer'} paid ${toSU(payment)} ${suStr} to the contract.`) },
});

//Farmer
if (role === 'farmer') {
  const farmerInteract = {
    ...commonInteract (role),
    price: toAU(5),
    livestockData: await ask.ask('Enter a livestock name, or press Enter for default:', (s) => {
        let w = !s ? 'Cow' : s;
        if (!s) { console.log(w); }
        return w;
    }),

    reportReady: async (price) => {
        console.log(`Your livestock is for sale at ${toSU(price)} ${suStr}.`);
        console.log(`Contract info: ${JSON.stringify(await ctc.getInfo())}`);
    }
};

    const acc = await stdlib.newTestAccount(iBalance);
    await showBalance(acc);
    const ctc = acc.contract(backend);
    await ctc.participants.Farmer(farmerInteract);
    await showBalance(acc);

//Buyer
} else {
    const buyerInteract = {
        ...commonInteract (role),
        reportLivestock: (livestock) => console.log(`Your new livestock is "${livestock}"`),
        confirmPurchase: async (price) => await ask.ask(`Do you want to purchase livestock for ${toSU(price)} ${suStr}?`, ask.yesno),
    }
    const acc = await stdlib.newTestAccount(iBalance);
    const info = await ask.ask('Paste contract info:', (s) => JSON.parse(s));
    const ctc = acc.contract(backend, info);
    const price = await ctc.views.Main.price();
    console.log(`The price of livestock is ${price[0] == 'None' ? '0' : toSU(price[1])} ${suStr}.`);
    await showBalance(acc);
    await ctc.p.Buyer(buyerInteract);
    await showBalance(acc);
}

ask.done();