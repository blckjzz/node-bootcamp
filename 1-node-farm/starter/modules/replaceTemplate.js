module.exports = (pageTemplate, product) => {
  let cards = pageTemplate;
  cards = cards.replace(/{%product-name%}/g, product.productName);
  cards = cards.replace(/{%product-description%}/g, product.description);
  cards = cards.replace(/{%product-image%}/g, product.image);
  cards = cards.replace(/{%product-quantity%}/g, product.quantity);
  cards = cards.replace(/{%product-nutrients%}/g, product.nutrients);
  cards = cards.replace(/{%product-price%}/g, product.price);
  cards = cards.replace(/{%product-id%}/g, product.id);
  cards = cards.replace(/{%product-from%}/g, product.from);
  if (!product.organic)
    cards = cards.replace(/{%NOT_ORGANIC%}/g, 'not-organic'); // console.log(pageTemplate);
  return cards;
};
