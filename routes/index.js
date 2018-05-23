var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('genes', { title: 'Genes' });
});

router.get('/proteins', function(req, res, next) {
  res.render('proteins', { title: 'Proteins' });
});

router.get('/genes', function(req, res, next) {
  res.render('genes', { title: 'Genes' });
});

module.exports = router;
