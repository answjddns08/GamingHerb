import { joinRoom, getRoomDetails, deleteRoom } from "../utils/roomManage.js";

/**
 * WebSocket server setup for handling game rooms and in-game actions.
 * @param {import("ws").Server} wss
 */
function setupWebsocket(wss) {
	wss.on("connection", (ws, request) => {
		console.log("WebSocket client connected");

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

				Object.keys(room.players).forEach((playerId) => {
					// Notify all players in the room about the new player

					if (playerId === userId) return;

					room.players[playerId].ws.send(
						JSON.stringify({
							message: "A new player has joined the room",
							player: { userId, userName },
						})
					);
				});

				if (response) {
					ws.send(JSON.stringify({ success: true }));
				} else {
					ws.send(JSON.stringify({ error: "Failed to join room" }));
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

				delete room.players[userId];

				Object.keys(room.players).forEach((playerId) => {
					if (playerId === userId) return;

					room.players[playerId].ws.send(
						JSON.stringify({
							message: "A player has left the room",
						})
					);
				});

				if (room.hostId === userId || Object.keys(room.players).length === 0) {
					// Notify the client that the room has been deleted
					Object.keys(room.players).forEach((playerId) => {
						room.players[playerId].ws.send(
							JSON.stringify({
								roomDeleted: true,
							})
						);
					});

					deleteRoom(gameId, roomName);

					ws.close();
				}
			}
		});

		ws.on("close", () => {
			console.log("WebSocket client disconnected");
		});

		ws.on("error", (error) => {
			console.error("WebSocket error:", error);
		});
	});
}

export default setupWebsocket;
