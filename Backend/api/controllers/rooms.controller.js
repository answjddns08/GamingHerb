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
 * @param {string} req.query.gameId - The ID of the game for which the room is being created
 * @param {string} req.body.roomName - The name of the room to be created
 * @param {Object} req.body.settings - The settings for the room
 * @param {import("express").Response} res - Express response object
 */
function createRoom(req, res) {
	const newRoom = req.body;
	const gameId = req.query.gameId;

	console.log("Creating room:", newRoom);

	if (!rooms[gameId]) {
		rooms[gameId] = {};
	}

	const roomExists = newRoom.roomName in rooms[gameId];

	if (roomExists) {
		console.log(`Room name ${newRoom.roomName} already exists.`);
		return res.status(409).json({ message: "Room name already exists" });
	}

	rooms[gameId][newRoom.roomName] = {
		gameId: gameId,
		settings: newRoom.settings,
		host: newRoom.host,
		hostId: newRoom.hostId,
		status: newRoom.status,
		playerCount: newRoom.playerCount,
		maxPlayerCount: newRoom.maxPlayerCount,
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
	const { gameId } = req.params;

	if (rooms[gameId]) {
		console.log(`Rooms found for gameId ${gameId}:`, rooms[gameId]);
	}

	res.status(200).json({
		rooms: rooms[gameId] ? rooms[gameId] : {},
	});
}

export { createRoom, listRooms };
