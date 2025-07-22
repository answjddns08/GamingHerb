import { getToken } from "../controllers/token.controller";
import { Router } from "express";

const router = Router();

router.post("/", getToken);

export default router;
