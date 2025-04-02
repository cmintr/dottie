import express from 'express';
import { chatController } from '../controllers/chatController';

const router = express.Router();

/**
 * POST /api/chat
 * Handle chat requests from the frontend
 */
router.post('/', chatController.handleChatRequest);

/**
 * GET /api/chat/history
 * Get chat history for a user (placeholder for future implementation)
 */
router.get('/history', (req, res) => {
  // TODO: Implement chat history retrieval
  res.status(200).json({ messages: [] });
});

export default router;
