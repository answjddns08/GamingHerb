import fetch from "node-fetch";

/**
 * Get token from discord API
 * @param {import("express").Request} req - Express request object
 * @param {import("express").Response} res - Express response object
 */
async function getToken(req, res) {
	// Exchange the code for an access_token
	const response = await fetch(`https://discord.com/api/oauth2/token`, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			client_id: process.env.VITE_DISCORD_CLIENT_ID,
			client_secret: process.env.VITE_DISCORD_CLIENT_SECRET,
			grant_type: "authorization_code",
			code: req.body.code,
		}),
	});

	const discordResponse = await response.json();
	const { access_token } = discordResponse;

	if (!access_token) {
		console.error("Discord token error:", discordResponse);
		return res
			.status(400)
			.json({ error: "Failed to get access token", details: discordResponse });
	}

	// Return the access_token to our client as { access_token: "..."}
	res.send({ access_token });
}

export { getToken };
