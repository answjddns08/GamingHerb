import {
	joinRoom,
	getRoomDetails,
	deleteRoom,
	broadCastToRoom,
	findPlayerByWs,
} from "../utils/roomManage.js";

/** @typedef {import('../utils/roomManage').Room} Room */

/**
 * WebSocket server setup for handling game rooms and in-game actions.
 * @param {import("ws").Server} wss
 */
function setupWebsocket(wss) {
	wss.on("connection", (ws, request) => {
		console.log("WebSocket client connected");

		let isNormalLeave = false;

		ws.on("message", (message) => {
			console.log("received: %s", message);

			let data;

			try {
				data = JSON.parse(message);
			} catch (error) {
				console.error("Invalid JSON received:", error);
				return;
			}

			if (data.type === "join") {
				// join a room

				const { gameId, roomName, userId, userName } = data;

				const response = joinRoom(gameId, roomName, userId, userName, ws);

				const room = getRoomDetails(gameId, roomName);

				if (!room) {
					ws.send(JSON.stringify({ error: "Room not found" }));
					return;
				}

				ws.send(
					// 방장이 설정한 방 설정 정보 전송
					JSON.stringify({
						type: "initialize",
						settings: room.settings,
						players: Array.from(room.players.values()),
					})
				);

				broadCastToRoom(
					gameId,
					roomName,
					{
						type: "playerJoined",
						message: "A new player has joined the room",
						player: { userId, userName },
					},
					ws
				);

				if (!response) {
					ws.send(JSON.stringify({ error: "Failed to join room" }));
					return;
				}
			} else if (data.type === "waiting") {
				// Handle waiting state
			} else if (data.type === "inGame") {
				// in-game actions
			} else if (data.type === "leave") {
				// quit a room

				const { gameId, roomName, userId } = data;
				const room = getRoomDetails(gameId, roomName);

				if (!room) {
					ws.send(JSON.stringify({ error: "Room not found" }));
					return;
				}

				isNormalLeave = true;

				room.players.delete(userId);

				broadCastToRoom(
					gameId,
					roomName,
					{
						type: "playerLeft",
						playerId: userId,
						message: "A player has left the room",
					},
					ws
				);

				if (room.hostId === userId || room.players.size === 0) {
					// Notify the client that the room has been deleted

					broadCastToRoom(
						gameId,
						roomName,
						{
							type: "roomDeleted",
							message: "The room has been deleted",
						},
						ws
					);

					deleteRoom(gameId, roomName);

					ws.close();
				}
			}
		});

		ws.on("close", () => {
			console.log("WebSocket client disconnected");

			if (!isNormalLeave) {
				// Handle abnormal disconnection
				console.log("Client disconnected unexpectedly");

				const response = findPlayerByWs(ws);

				if (!response) {
					console.log("No room found for the disconnected client");
					return;
				}

				broadCastToRoom(
					response.gameId,
					Object.keys(response.room),
					{
						type: "playerLeft",
						playerId: response.userId,
						message: "A player has left the room unexpectedly",
					},
					ws
				);

				// Remove the user from the room
				response.room.players.delete(response.userId);

				// If the room is empty or the host left, delete the room
				if (
					response.room.players.size === 0 ||
					response.room.hostId === response.userId
				) {
					deleteRoom(response.gameId, response.room.roomName);
				}
			}
		});

		ws.on("error", (error) => {
			console.error("WebSocket error:", error);
		});
	});
}

export default setupWebsocket;
