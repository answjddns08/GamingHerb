import { getRoomsForGame, makeRoom } from "../../utils/roomManage.js";

/**
 * Create a new room
 * @param {import("express").Request} req - Express request object
 * @param {string} req.query.gameId - The ID of the game for which the room is being created
 * @param {string} req.body.roomName - The name of the room to be created
 * @param {Object} req.body.settings - The settings for the room
 * @param {import("express").Response} res - Express response object
 */
function createRoom(req, res) {
	const newRoom = req.body;
	const gameId = req.query.gameId;

	console.log("Received request to create room for game:", gameId);
	console.log("Creating room:", newRoom);

	if (
		!newRoom.roomName ||
		!newRoom.settings ||
		!newRoom.host ||
		!newRoom.hostId
	) {
		console.error("Missing required room details:", newRoom);
		return res.status(400).json({ message: "Missing required room details" });
	}

	newRoom.settings.maxPlayerCount = newRoom.maxPlayerCount;

	makeRoom(
		gameId,
		newRoom.roomName,
		newRoom.settings,
		newRoom.host,
		newRoom.hostId
	);

	res.status(201).json({
		message: "Room created successfully",
		roomName: newRoom.roomName,
	});
}

/** * List all rooms
 * @param {import("express").Request} req - Express request object
 * @param {import("express").Response} res - Express response object
 */
function listRooms(req, res) {
	const { gameId } = req.params;

	res.status(200).json({
		rooms: getRoomsForGame(gameId),
	});
}

export { createRoom, listRooms };
