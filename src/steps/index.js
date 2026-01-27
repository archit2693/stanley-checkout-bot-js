const { openHome } = require('./openHome');
const { openShopMenu } = require('./openShopMenu');
const { selectAnyTumblerOrCup } = require('./selectAnyTumblerOrCup');
const { addToCart } = require('./addToCart');
const { goToCheckout } = require('./goToCheckout');
const { fillContactAndShipping } = require('./fillContactAndShipping');
const { continueToPayment } = require('./continueToPayment');
const { fillPayment } = require('./fillPayment');
const { submitOrderAttempt } = require('./submitOrderAttempt');

module.exports = {
  openHome,
  openShopMenu,
  selectAnyTumblerOrCup,
  addToCart,
  goToCheckout,
  fillContactAndShipping,
  continueToPayment,
  fillPayment,
  submitOrderAttempt,
};

