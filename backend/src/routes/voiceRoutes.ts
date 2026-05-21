import express from 'express';
import { protect } from '../middleware/auth';
import { processVoiceCommand } from '../controllers/voiceAssistantController';

const router = express.Router();

router.use(protect);

// POST /api/v1/ai/voice-command
router.post('/voice-command', processVoiceCommand);

export default router;
