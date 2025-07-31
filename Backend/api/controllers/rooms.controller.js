/**
 * a array to store roomNames and their details
 * @type {Object.<gameId : string, Object.<roomName : string, settings: object>>}
 * @description This object will hold room names in specific game as keys and their details as values.
 */
const rooms = {};

/* Example structure of rooms object:
{
	"Gomoku": {
		"roomName1": { "settings": { "maxPlayers": 2, "soloMode": false }, Players : ["user1", "user2"], host: "user1", hostId: "12345", status: "waiting", playerCount: 2, maxPlayerCount: 2 },
		"roomName2": { "settings": { "maxPlayers": 4, "soloMode": true }, Players : ["user3", "user4"], host: "user3, hostId: "67890", status: "waiting", playerCount: 2, maxPlayerCount: 4 }
	},
	"Chess": {
		"roomName3": { "settings": { "maxPlayers": 2, "soloMode": false } }
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

	newRoom.settings.maxPlayerCount = newRoom.maxPlayerCount;

	rooms[gameId][newRoom.roomName] = {
		gameId: gameId,
		settings: newRoom.settings,
		host: newRoom.host,
		hostId: newRoom.hostId,
		status: newRoom.status,
		playerCount: newRoom.playerCount,
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

	res.status(200).json({
		rooms: rooms[gameId] ? rooms[gameId] : {},
	});
}

/**
 * Join a room
 * @param {import("express").Request} req - Express request object
 * @param {string} req.params.gameId - The ID of the game
 * @param {string} req.params.roomName - The name of the room to join
 * @param {import("express").Response} res - Express response object
 */
function joinRoom(req, res) {
	const { gameId, roomName } = req.params;

	const { userId, userName } = req.body; // Assuming userId and userName are sent in the request body

	const room = rooms[gameId]?.[roomName];

	if (!room) {
		return res.status(404).json({ message: "Room not found" });
	}

	room.playerCount += 1;
	res.status(200).json({
		message: "Successfully joined the room",
		playerCount: room.playerCount,
		maxPlayerCount: room.maxPlayerCount,
	});
}

/**
 * Leave a room
 * @param {import("express").Request} req - Express request object
 * @param {string} req.params.gameId - The ID of the game
 * @param {string} req.params.roomName - The name of the room to leave
 * @param {import("express").Response} res - Express response object
 */
function quitRoom(req, res) {
	const { gameId, roomName } = req.params;
	const room = rooms[gameId]?.[roomName]; // Assuming rooms is a global object storing all rooms

	if (!room) {
		return res.status(404).json({ message: "Room not found" });
	}

	rooms[gameId][roomName].playerCount -= 1;

	if (rooms[gameId][roomName].playerCount <= 0) {
		console.log(`No players left in room ${roomName}, removing it.`);
		delete rooms[gameId][roomName]; // Remove the room if no players left
	}

	res.status(200).json({ message: "Successfully left the room" });
}

export { createRoom, listRooms, quitRoom, joinRoom };
