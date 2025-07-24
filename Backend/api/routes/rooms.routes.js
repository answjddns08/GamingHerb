import { Router } from "express";
import { createRoom, listRooms } from "../controllers/rooms.controller.js";

const roomsRouter = Router();

// list all rooms
roomsRouter.get("/list", listRooms);

// create a new room
roomsRouter.post("/create", createRoom);

roomsRouter.get("/join/:roomId", (req, res) => {
	const { roomId } = req.params;
	res.json({ message: `Join room ${roomId}` });
});

export default roomsRouter;
