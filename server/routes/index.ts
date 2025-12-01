import express from "express";
import botRoute from "./bot/bot.route";

import telegramRoute from "./telegram/telegram.route";

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
    path: "/telegram",
    route: telegramRoute,
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
