/**
 * @typedef {Object} Room
 * @property {Object} settings - The settings for the room
 * @property {Map<string, { userId: string, username: string, ws: WebSocket, isReady: boolean }> } players - A Map containing player details, keyed by userId
 * @property {string} host - The username of the room host
 * @property {string} hostId - The ID of the user who is the host
 * @property {string} status - The current status of the room (e.g., "waiting", "active")
 *
 */

/**
 * a object to store roomNames and their details
 * @type {Object.<gameId : string, Object.<roomName : string, Room>>}
 * @description This object will hold room names in specific game as keys and their details as values.
 */
const rooms = {}; // Assuming rooms is a global object to store room data

/* Example structure of rooms object:
{
  "Gomoku": {
	"roomName1": {
	  "settings": { "maxPlayers": 2, "soloMode": false },
	  "players": Map( [
		["user1", { userId: "user1", username: "User One" }],
		["user2", { userId: "user2", username: "User Two" }]
	  ] ),
	  "host": "user1",
	  "hostId": "12345",
	  "status": "waiting",
	},
  },
  "Chess": {
	"roomName2": {
	  "settings": { "maxPlayers": 2, "soloMode": false },
	  "players": Map([
		["user3", { userId: "user3", username: "User Three" }],
		["user4", { userId: "user4", username: "User Four" }]
	  ]),
	  "host": "user5",
	  "hostId": "13579",
	  "status": "waiting",
	}
  }
} */

/**
 * get all rooms for a specific game
 * @param {string} gameId - The ID of the game for which to retrieve rooms
 * @returns {Object} - An object containing all rooms for the specified game
 */
function getRoomsForGame(gameId) {
	return rooms[gameId] || {};
}

/**
 * get specific room details
 * @param {string} gameId - The ID of the game
 * @param {string} roomName - The name of the room to retrieve
 * @returns {Room|null} - The details of the room if it exists, otherwise null
 */
function getRoomDetails(gameId, roomName) {
	return rooms[gameId] ? rooms[gameId][roomName] || null : null;
}

/**
 * create a new room
 * @param {string} gameId - The ID of the game for which the room is being created
 * @param {string} roomName - The name of the room to be created
 * @param {Object} settings - The settings for the room
 * @param {string} host - The username of the room host
 * @param {string} hostId - The ID of the user who is the host
 */
function makeRoom(gameId, roomName, settings, host, hostId) {
	if (!rooms[gameId]) {
		rooms[gameId] = {};
	}
	rooms[gameId][roomName] = {
		settings: settings,
		players: [player],
    gameState: null, // 게임 상태를 저장할 속성 추가
		host: host,
		hostId: hostId,
		status: "waiting",
	};
}

/**
 * delete a room
 * @param {string} gameId - The ID of the game
 * @param {string} roomName - The name of the room to delete
 */
function deleteRoom(gameId, roomName) {
	if (rooms[gameId] && rooms[gameId][roomName]) {
		delete rooms[gameId][roomName];
	}
}

/**
 * Join a room
 * @param {string} gameId - The ID of the game
 * @param {string} roomName - The name of the room to join
 * @param {string} userId - The ID of the user joining the room
 * @param {string} username - The username of the user joining the room
 * @param {WebSocket} ws - The WebSocket connection of the user
 * @returns {boolean} - Returns true if the user successfully joined the room, false otherwise
 */
function joinRoom(gameId, roomName, userId, username, ws) {
	const room = getRoomDetails(gameId, roomName);

	if (!room) {
		return false;
	}

	room.players.set(userId, { userId, username, ws });

	return true;
}

/**
 * leave a room
 * @param {string} gameId - The ID of the game
 * @param {string} roomName - The name of the room to leave
 * @param {string} userId - The ID of the user leaving the room
 * @description deletes room if the user is the host or if the room is empty
 * @returns {boolean} - Returns true if the user successfully left the room, false otherwise
 */
function leaveRoom(gameId, roomName, userId) {
	const room = getRoomDetails(gameId, roomName);
	if (!room) {
		return false;
	}

	room.players.delete(userId);

	if (room.players.size === 0 || room.hostId === userId) {
		deleteRoom(gameId, roomName);
		return true;
	}
	return true;
}

/**
 * Broadcast a message to all players in a room
 * @param {string} gameId - The ID of the game
 * @param {string} roomName - The name of the room to which the message will be sent
 * @param {object} message - don't need to stringify, it will be done in the function
 * @param {WebSocket} ws - The WebSocket connection of the user sending the message
 */
function broadCastToRoom(gameId, roomName, message, ws = null) {
	const room = getRoomDetails(gameId, roomName);

	if (!room) return;

	room.players.forEach((player) => {
		if (ws && player.ws === ws) return; // Skip sending to the sender

		console.log(
			`Broadcasting to ${player.userId} in room ${roomName}:`,
			message
		);

		player.ws.send(JSON.stringify(message));
	});
}

/**
 * Find a player by their WebSocket connection
 * @param {WebSocket} ws - The WebSocket connection of the user
 * @returns {{ room: Room|null, gameId: string|null, userId: string|null }} - Returns the room and gameId if the player is found, otherwise null
 */
function findPlayerByWs(ws) {
	for (const gameId in rooms) {
		for (const roomName in rooms[gameId]) {
			const room = rooms[gameId][roomName];
			for (const [userId, player] of room.players) {
				if (player.ws === ws) {
					return userId, room, gameId; // Return the room if the WebSocket matches
				}
			}
		}
	}
	return null;
}

/**
 * Get the game state for a specific room
 * @param {string} gameId - The ID of the game
 * @param {string} roomName - The name of the room
 * @returns {object|null} - The game state object or null if not found
 */
function getGameState(gameId, roomName) {
	const room = getRoomDetails(gameId, roomName);
	return room ? room.gameState : null;
}

/**
 * Set the game state for a specific room
 * @param {string} gameId - The ID of the game
 * @param {string} roomName - The name of the room
 * @param {object} gameState - The new game state object
 */
function setGameState(gameId, roomName, gameState) {
	const room = getRoomDetails(gameId, roomName);
	if (room) {
		room.gameState = gameState;
	}
}

/**
 * Update the status of a specific room
 * @param {string} gameId - The ID of the game
 * @param {string} roomName - The name of the room
 * @param {string} status - The new status for the room
 */
function updateRoomStatus(gameId, roomName, status) {
    const room = getRoomDetails(gameId, roomName);
    if (room) {
        room.status = status;
    }
}

export {
	getRoomsForGame,
	getRoomDetails,
	makeRoom,
	deleteRoom,
	joinRoom,
	leaveRoom,
	broadCastToRoom,
	findPlayerByWs,
	getGameState,
	setGameState,
	updateRoomStatus,
};
