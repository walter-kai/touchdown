import express, { Request, Response, NextFunction } from 'express';
import { sendMessageController, createTopicController, getChatIdController } from './telegram.controller';

const router = express.Router();

// ...existing routes...

router.post('/sendMessage', (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(sendMessageController(req, res))
	.catch(next);
});

router.post('/getChatId', (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(getChatIdController(req, res))
	.catch(next);
});

router.post('/createTopic', (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(createTopicController(req, res))
	.catch(next);
});

export default router;