function setupWebsocket(wss) {
	wss.on("connection", (ws, request) => {
		console.log("WebSocket client connected");

		ws.on("message", (message) => {
			console.log("received: %s", message);
			// Echo message back to client
			ws.send(`Hello, you sent -> ${message}`);
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
