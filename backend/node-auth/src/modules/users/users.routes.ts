import { Router } from "express";
import { requireAuth } from "../../middleware/auth.ts";
import { LoginBody, RegisterBody } from "./users.schemas.ts";
import { usersService } from "./users.service.ts";

export const usersRouter = Router();

usersRouter.post("/register", async (req, res) => {
  const body = RegisterBody.parse(req.body);
  res.status(201).json(await usersService.register(body));
});

usersRouter.post("/login", async (req, res) => {
  const body = LoginBody.parse(req.body);
  res.json(await usersService.login(body));
});

usersRouter.get("/me", requireAuth, async (_req, res) => {
  res.json(await usersService.me(res.locals.user.sub));
});
