import { getToken } from "../controllers/token.controller.js";
import { Router } from "express";

const router = Router();

router.post("/", getToken);

export default router;
