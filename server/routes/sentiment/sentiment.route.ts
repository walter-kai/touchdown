import express, { Request, Response, NextFunction } from "express";
import { getSentiments } from "./sentiment.controller";

const router = express.Router();

router.get("/all", (req: Request, res: Response, next: NextFunction) => {
  // Ensure getSentiments is called with the correct types
  // If getSentiments returns a promise, handle it properly
  Promise.resolve(getSentiments(req, res))
	.then(result => {
	  if (result !== undefined) {
		res.json(result);
	  }
	})
	.catch(next);
});

export default router;
