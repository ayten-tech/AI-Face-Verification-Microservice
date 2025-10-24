//defines route and endpoint mapping 
//in our case it's a single route having 1 endpoint /encode
const express = require('express');
const { encodeFaceController } = require('../controllers/faceController');

const router = express.Router();

// Endpoint for face registration/enrollment
router.post('/encode', encodeFaceController);

//export router to be used in server.js
module.exports = router;