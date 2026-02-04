const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth/authenticate');
const messagesController = require('../../controllers/messagesController');

router.use(authenticate);

router.post('/', messagesController.sendMessage);
router.get('/conversations', messagesController.listConversations);
router.get('/conversation/:userId', messagesController.getConversation);

module.exports = router;
