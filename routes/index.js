// const fs = require('fs');
// const path = require('path');
const express = require('express');
const router = express.Router();


router.get('/', (req, res) => {
  res.render('index');
});
// router.get('/static/*', (req, res) => {
  // const html = fs.readFileSync(path.resolve(__dirname, '../public/wx/index.html'), 'utf-8')
  // res.send(html);
// });

module.exports = router;