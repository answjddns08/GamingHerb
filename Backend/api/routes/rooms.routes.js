import { Router } from "express";
import { createRoom, listRooms } from "../controllers/rooms.controller.js";

const roomsRouter = Router();

// list all rooms
roomsRouter.get("/list/:gameId", listRooms);

// create a new room
roomsRouter.post("/create", createRoom);

export default roomsRouter;
