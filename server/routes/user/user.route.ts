import express from "express";
import userController from "./user.controller";
import { authenticateJWT } from "../../middleware/auth";

const router = express.Router();

// Public routes (no auth required)
router.route("/checkName").get(userController.checkUsernameAvailability);
router.route("/login").post(userController.login);

// Protected routes (JWT auth required)
router.route("/profile").get(authenticateJWT, userController.getCurrentUserProfile);
router.route("/update").put(authenticateJWT, userController.updateUser);
router.route("/:telegramId/setChatId/:chatId").put(authenticateJWT, userController.setUserChatId);

export default router;
