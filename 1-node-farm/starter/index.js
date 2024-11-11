const fs = require('fs');
const http = require('http');
const url = require('url');
const slugify = require('slugify');

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
const templateProduct = fs.readFileSync(
  `${__dirname}/templates/product.html`,
  'utf-8'
);
const templateCards = fs.readFileSync(
  `${__dirname}/templates/template-cards.html`,
  'utf-8'
);
// const productData = JSON.parse(data);
const productData = JSON.parse(data);

const renderDataToHtml = require('./modules/replaceTemplate');

// slugifying product

const slugs = productData.map(product =>
  slugify(product.productName, { lower: true })
);

console.log(slugs);

const server = http.createServer((req, res) => {
  const { query, pathname } = url.parse(req.url, true);

  console.log(`Request on: ${pathname}`);
  if (pathname === '/' || pathname === '/overview') {
    let newHtmlWithCards = productData
      .map(
        product => renderDataToHtml(templateCards, product)
        // console.log(renderDataToHtml(templateCards, product));
      )
      .join('');

    let newTemplateWithData = overviewPage.replace(
      /{%CARDS_ELEMENT%}/,
      newHtmlWithCards
    );

    res.writeHead(200, {
      'Content-Type': 'text/html',
    });
    res.end(newTemplateWithData);
  } else if (pathname === '/product') {
    console.log(query);
    res.writeHead(200, {
      'Content-Type': 'text/html',
    });

    if (productData.find(t => t.id === +query.id)) {
      let product = productData.find(t => t.id === +query.id);
      // console.log(product);
      let newPageHtml = renderDataToHtml(templateProduct, product);
      res.end(newPageHtml);
    } else {
      let message = `Could not find product with id: ${query.id}`;
      console.log(message);
      let newTemplateWithData = overviewPage.replace(
        /{%CARDS_ELEMENT%}/,
        message
      );
      res.end(newTemplateWithData);
    }
  } else if (pathname === '/api') {
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
