import { Router } from "express";
import {
	createRoom,
	listRooms,
	quitRoom,
	joinRoom,
} from "../controllers/rooms.controller.js";

const roomsRouter = Router();

// list all rooms
roomsRouter.get("/list/:gameId", listRooms);

roomsRouter.patch("/join/:gameId/:roomName", joinRoom);

roomsRouter.patch("/quit/:gameId/:roomName", quitRoom);

// create a new room
roomsRouter.post("/create", createRoom);

export default roomsRouter;
