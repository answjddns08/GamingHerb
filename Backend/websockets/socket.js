import { joinRoom, getRoomDetails } from "../utils/roomManage.js";

/**
 * WebSocket server setup for handling game rooms and in-game actions.
 * @param {WebSocket.Server} wss
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

				if (joinRoom(gameId, roomName, userId, userName)) {
					ws.send(JSON.stringify({ success: true }));
				} else {
					ws.send(JSON.stringify({ error: "Failed to join room" }));
				}
			} else if (data.type === "waiting") {
				// Handle waiting state
			} else if (data.type === "inGame") {
				// in-game actions
			} else if (data.type === "quit") {
				// quit a room

				const { gameId, roomName, userId } = data;
				const room = getRoomDetails(gameId, roomName);

				if (room) {
					room.Players = room.Players.filter(
						(player) => player.userId !== userId
					);
					ws.send(JSON.stringify({ success: true }));
				} else {
					ws.send(JSON.stringify({ error: "Room not found" }));
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
