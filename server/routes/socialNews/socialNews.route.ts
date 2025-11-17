import express from "express";
import { Request, Response, NextFunction } from "express";
import { getSocialNews } from "./socialNews.controller";

const router = express.Router();
router.get("/posts", (req: Request, res: Response, next: NextFunction) => {
  getSocialNews(req, res).catch(next);
});

export default router;
