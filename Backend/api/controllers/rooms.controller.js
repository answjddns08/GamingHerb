/**
 * a array to store roomNames and their details
 * @type {Object.<string, {gameId: string, settings: object}>}
 * @description This object will hold room names as keys and their details as values.
 */
const rooms = {};

/* Example structure of rooms object:
{
	"RoomName1": { gameId: "Gomoku", settings: { ... } },
	"RoomName2": { gameId: "Pong", settings: { ... } }
} */

/**
 * Create a new room
 * @param {import("express").Request} req - Express request object
 * @param {import("express").Response} res - Express response object
 */
function createRoom(req, res) {
	const newRoom = req.body;

	const roomExists = newRoom.settings.roomName in rooms;

	if (roomExists) {
		return res.status(409).json({ message: "Room name already exists" });
	}

	rooms[newRoom.settings.roomName] = {
		gameId: newRoom.gameId,
		settings: newRoom.settings,
	};

	res.status(201).json({
		message: "Room created successfully",
		roomName: newRoom.settings.roomName,
	});
}

/** * List all rooms
 * @param {import("express").Request} req - Express request object
 * @param {import("express").Response} res - Express response object
 */
function listRooms(req, res) {
	res.json({ message: "List of rooms" });
}

export { createRoom, listRooms };
