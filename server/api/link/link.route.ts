import express from "express";
import { linkPreviewController } from "./link.controller";

const router = express.Router();

router.get("/preview", (req, res, next) => {
  Promise.resolve(linkPreviewController(req, res)).catch(next);
});

export default router;
