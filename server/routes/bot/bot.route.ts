import express from "express";
import botController from "./bot.controller";
import { authenticateJWT } from "../../middleware/auth";

const router = express.Router();

const asyncHandler = (fn: any) => (req: express.Request, res: express.Response, next: express.NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// All bot routes require JWT authentication since they're user-specific
router.route("/").delete(authenticateJWT, asyncHandler(botController.killBot));
router.route("/").post(authenticateJWT, asyncHandler(botController.createBot));
router.route("/mine").get(authenticateJWT, asyncHandler(botController.getMyBots));
router.route("/start").put(authenticateJWT, asyncHandler(botController.startBot));
router.route("/stop").put(authenticateJWT, asyncHandler(botController.stopBot));

export default router;