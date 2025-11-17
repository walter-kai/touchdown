import express from "express";
import botRoute from "./bot/bot.route";
import userRoute from "./user/user.route";
import telegramRoute from "./telegram/telegram.route";
import socialNewsRoute from "./socialNews/socialNews.route";
import sentimentRoute from "./sentiment/sentiment.route";
import linkRoute from "./link/link.route";
import authRoute from "./auth/auth.route";

const router = express.Router();

type RouteObj = {
  path: string;
  route: express.Router;
};

const defaultRoutes: ReadonlyArray<RouteObj> = [
  {
    path: "/auth",
    route: authRoute,
  },
  {
    path: "/bot",
    route: botRoute,
  },
  {
    path: "/user",
    route: userRoute,
  },
  {
    path: "/telegram",
    route: telegramRoute,
  },
  {
    path: "/social-news",
    route: socialNewsRoute,
  },
  {
    path: "/sentiment",
    route: sentimentRoute,
  },
  {
    path: "/link",
    route: linkRoute,
  }
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
