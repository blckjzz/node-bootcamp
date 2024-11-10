const fs = require('fs');
const http = require('http');
const url = require('url');

// console.log(`Hello world!`);

// fs.readFsafaile('./txt/input.txt',).then((data, error) => {
//   console.log(`${(data, error)}`);
// }); //(err, data) => console.log(data));
// // const textOutput = `An amazing string text: ${inputFile}`;
// // console.log(inputFile);
// // fs.writeFileSync('./txt/output.txt', textOutput);
// // console.log(textOutput);

const data = fs.readFileSync(`${__dirname}/dev-data/data.json`, 'utf-8');

const overviewPage = fs.readFileSync(
  `${__dirname}/templates/overview.html`,
  'utf-8'
);
const templateCards = fs.readFileSync(
  `${__dirname}/templates/template-cards.html`,
  'utf-8'
);
// const productData = JSON.parse(data);
const productData = JSON.parse(data);

const renderDataToHtml = (pageTemplate, product) => {
  let cards = pageTemplate;
  cards = cards.replace(/{%product-name%}/g, product.productName);
  cards = cards.replace(/{%product-description%}/g, product.description);
  cards = cards.replace(/{%product-image%}/g, product.image);
  cards = cards.replace(/{%product-quantity%}/g, product.quantity);
  cards = cards.replace(/{%product-price%}/g, product.price);
  cards = cards.replace(/{%product-id%}/g, product.id);
  if (!product.organic)
    cards = cards.replace(/{%NOT_ORGANIC%}/g, 'not-organic'); // console.log(pageTemplate);
  return cards;
};

// const options = {
//   port: 80,
// };

const server = http.createServer((req, res) => {
  const pathName = req.url;
  console.log(`Request on: ${pathName}`);
  if (pathName === '/' || pathName === 'overview') {
    let newHtmlWithCards = productData
      .map(
        product => renderDataToHtml(templateCards, product)
        // console.log(renderDataToHtml(templateCards, product));
      )
      .join('');
    // console.log(newHtmlWithCards);

    let newTemplateWithData = overviewPage.replace(
      /{%CARDS_ELEMENT%}/,
      newHtmlWithCards
    );
    // console.log(newHtmlWithCards);
    // res.end(output);
    res.writeHead(200, {
      'Content-Type': 'text/html',
    });
    res.end(newTemplateWithData);
  } else if (pathName === '/product') {
    res.end('products');
  } else if (pathName === '/api') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
    });
    res.end(productData);
  } else {
    res.writeHead(404, {
      'content-type': 'text/html',
    });
    res.end('page Not found');
  }
  //   const { query, pathname } = url.parse(req.url, true);
});

server.listen(8000, '127.0.0.1', () => {
  console.log('Listening to requests on port 8000');
});

// const req = http.request(options, res => {
//   console.log(`STATUS: ${res.statusCode}`);
//   console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
//   res.setEncoding('utf8');
//   res.on('data', chunk => {
//     console.log(`BODY: ${chunk}`);
//   });
//   res.on('end', () => {
//     console.log('No more data in response.');
//   });
// });
