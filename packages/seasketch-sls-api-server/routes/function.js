var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.json({ project: req.params.project, function: req.params.function });
});

module.exports = router;
