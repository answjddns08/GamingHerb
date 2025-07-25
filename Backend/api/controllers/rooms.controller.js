/**
 * a array to store roomNames and their details
 * @type {Object.<gameId : string, Object.<roomName : string, settings: object>>}
 * @description This object will hold room names in specific game as keys and their details as values.
 */
const rooms = {};

/* Example structure of rooms object:
{
	"Gomoku": {
		"roomName": { "settings": { "maxPlayers": 4, "private": false } },
		"roomName2": { "settings": { "maxPlayers": 2, "private": true } }
	},
	"Chess": {
		"roomName3": { "settings": { "maxPlayers": 2, "private": false } }
	}
} */

/**
 * Create a new room
 * @param {import("express").Request} req - Express request object
 * @param {import("express").Response} res - Express response object
 */
function createRoom(req, res) {
	const newRoom = req.body;

	console.log("Creating room:", newRoom);

	if (!rooms[newRoom.gameId]) {
		rooms[newRoom.gameId] = {};
	}

	const roomExists = newRoom.roomName in rooms[newRoom.gameId];

	if (roomExists) {
		console.log(`Room name ${newRoom.settings.roomName} already exists.`);
		return res.status(409).json({ message: "Room name already exists" });
	}

	rooms[newRoom.gameId][newRoom.settings.roomName] = {
		gameId: newRoom.gameId,
		settings: newRoom.settings,
	};

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
	res.json({ message: "List of rooms" });
}

export { createRoom, listRooms };
