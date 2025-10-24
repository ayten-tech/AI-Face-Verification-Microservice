//defines route and endpoint mapping 
//in our case we have 2 endpoints: /encode and /compare
const express = require('express');
const { encodeFaceController, compareFaceController } = require('../controllers/faceController');

const router = express.Router();

// Endpoint for face registration/enrollment
router.post('/encode', encodeFaceController);

// Endpoint for face verification/comparison
router.post('/compare', compareFaceController);

//export router to be used in server.js
module.exports = router;