// library imports
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import WebSocket from "ws";
import setupWebsocket from "./websockets/socket.js";

// routes
import tokenRouter from "./api/routes/token.routes.js";
import roomsRouter from "./api/routes/rooms.routes.js";

dotenv.config({ path: "../.env" });

const app = express();

const wss = new WebSocket.Server({ noServer: true });

const PORT = process.env.PORT || 3001;

console.log(`Environment: ${process.env.NODE_ENV || "development"}`);

// CORS settings
app.use(
	cors({
		origin: [
			"https://gamingherb.redeyes.dev",
			"http://localhost:5173",
			"https://redeyes.dev",
		],
		methods: ["GET", "POST", "DELETE", "PUT"],
	})
);

// JSON body parser with increased limit
app.use(express.json({ limit: "50mb" }));

// 요청 로그
if (process.env.NODE_ENV !== "production") {
	app.use((req, res, next) => {
		console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
		next();
	});
}

app.use("/api/token", tokenRouter);
app.use("/api/rooms", roomsRouter);

const server = app.listen(PORT, () => {
	console.log(`Server is listening on port ${PORT}`);
});

server.on("upgrade", (request, socket, head) => {
	// TODO: 인증 로직 추가
	wss.handleUpgrade(request, socket, head, (ws) => {
		wss.emit("connection", ws, request);
	});
});

setupWebsocket(wss);
