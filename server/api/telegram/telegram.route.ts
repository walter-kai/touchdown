import express, { Request, Response, NextFunction } from 'express';
import { sendMessageController } from './telegram.controller';

const router = express.Router();

// ...existing routes...

router.post('/sendMessage', (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(sendMessageController(req, res))
	.catch(next);
});

export default router;