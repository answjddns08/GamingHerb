import express from "express";
import cors from "cors";
import tokenRouter from "./api/routes/token.routes.js";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const app = express();

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

app.listen(PORT, () => {
	console.log(`Server is listening on port ${PORT}`);
});
