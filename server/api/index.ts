import express from "express";

import telegramRoute from "./telegram/telegram.route";

import linkRoute from "./link/link.route";
import userRoute from "./user/user.route";
import picksRoute from "./picks/picks.route";
import playByPlayRoute from "./playbyplay/playbyplay.route";

const router = express.Router();

type RouteObj = {
  path: string;
  route: express.Router;
};

const defaultRoutes: ReadonlyArray<RouteObj> = [
  {
    path: "/user",
    route: userRoute,
  },
  {
    path: "/picks",
    route: picksRoute,
  },
  {
    path: "/telegram",
    route: telegramRoute,
  },
  {
    path: "/link",
    route: linkRoute,
  },
  {
    path: "/playbyplay",
    route: playByPlayRoute,
  }
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
