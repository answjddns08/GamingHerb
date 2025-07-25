import { defineStore } from "pinia";

export const useUserStore = defineStore("user", {
  state: () => ({
    id: null,
    name: null,
    isDiscordUser: false,
    auth: null, // Discord authentication object
  }),

  getters: {
    isLoggedIn: (state) => state.id !== null,
    displayName: (state) => state.name || "Anonymous",
    apiPrefix: (state) => (state.isDiscordUser ? "/.proxy" : ""),
  },

  actions: {
    // A simple UUID generator for unique user IDs
    generateUUID() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    },

    // Generates a fun random nickname
    generateRandomNickname() {
      const adjectives = ["Happy", "Funny", "Clever", "Silent", "Brave", "Quick"];
      const nouns = ["Panda", "Tiger", "Lion", "Eagle", "Shark", "Wolf"];
      const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
      const randomNumber = Math.floor(Math.random() * 1000);
      return `${randomAdj}${randomNoun}${randomNumber}`;
    },

    /**
     * Detects if the app is running inside Discord Activity.
     * This function checks multiple indicators to determine Discord environment.
     * @returns {boolean} True if running in Discord, false otherwise.
     */
    isDiscordEmbedded() {
      try {
        // 1. Check URL parameters that Discord activities receive
        const urlParams = new URLSearchParams(window.location.search);
        const hasDiscordParams =
          urlParams.has("frame_id") ||
          urlParams.has("instance_id") ||
          urlParams.has("platform") ||
          urlParams.has("channel_id") ||
          urlParams.has("guild_id");

        // 2. Check if running in iframe (Discord activities run in iframes)
        const isInIframe = window !== window.top;

        // 3. Check for Discord-specific global objects or parent communication
        const hasDiscordGlobals =
          typeof window.DiscordSDK !== "undefined" || (window.parent && window.parent !== window);

        // 4. Check referrer for Discord domains (가장 신뢰할 수 있는 지표)
        const referrer = document.referrer || "";
        const isDiscordReferrer =
          referrer.includes("discord.com") ||
          referrer.includes("discord.gg") ||
          referrer.includes("discordapp.com");

        // 5. Check hostname for Discord-specific patterns
        const hostname = window.location.hostname || "";
        const isDiscordHostname =
          hostname.includes("discord") ||
          hostname.includes("cdn.discordapp.com") ||
          hostname.includes("discordapp.net");

        // 6. Additional Discord-specific checks
        const hasDiscordUrl = window.location.href.includes("discord");

        // Log detection results for debugging
        console.log("Discord Detection Results:", {
          hasDiscordParams,
          isInIframe,
          hasDiscordGlobals,
          isDiscordReferrer,
          isDiscordHostname,
          hasDiscordUrl,
          url: window.location.href,
          hostname: hostname,
          referrer: referrer,
        });

        // Improved detection logic with priority:
        // 1. Strong indicators: Discord params + iframe environment
        if (hasDiscordParams && isInIframe) {
          console.log("✅ Discord detected: URL params + iframe");
          return true;
        }

        // 2. Discord referrer + iframe (very reliable)
        if (isDiscordReferrer && isInIframe) {
          console.log("✅ Discord detected: Discord referrer + iframe");
          return true;
        }

        // 4. Multiple weak indicators combined
        const weakIndicatorCount = [hasDiscordUrl, isDiscordHostname, hasDiscordGlobals].filter(
          Boolean,
        ).length;

        if (isInIframe && weakIndicatorCount >= 2) {
          console.log("✅ Discord detected: iframe + multiple weak indicators");
          return true;
        }

        console.log("❌ Discord not detected: insufficient indicators");
        return false;
      } catch (error) {
        console.error("Error detecting Discord environment:", error);
        return false;
      }
    },

    /**
     * Initializes the user profile, either from Discord, localStorage, or by generating a new one.
     */
    async initializeUser() {
      let userId = localStorage.getItem("userId");
      let userName = localStorage.getItem("userName");

      // Check if running in Discord environment
      const isDiscord = this.isDiscordEmbedded();
      console.log(`Environment detected: ${isDiscord ? "Discord Activity" : "Web Browser"}`);

      if (isDiscord) {
        // Fast initialization: Set up temporary user first, then upgrade to Discord user
        this.initializeTempUser(userId, userName);

        // Initialize Discord in background (non-blocking)
        this.initializeDiscordUser();
      } else {
        // Standard web browser flow
        console.log("Running in standard web browser mode");
        this.initializeTempUser(userId, userName);
      }

      console.log(`User initialized: ${this.name} (${this.id}) - Discord: ${this.isDiscordUser}`);
    },

    /**
     * Initialize temporary user for immediate UI display
     */
    initializeTempUser(userId, userName) {
      if (!userId || !userName) {
        this.id = this.generateUUID();
        this.name = this.generateRandomNickname();
        localStorage.setItem("userId", this.id);
        localStorage.setItem("userName", this.name);
      } else {
        this.id = userId;
        this.name = userName;
      }
      this.isDiscordUser = false;
      console.log(`Temporary user initialized: ${this.name} (${this.id})`);
    },

    /**
     * Initialize Discord user in background (non-blocking)
     */
    async initializeDiscordUser() {
      try {
        // Check for required environment variables
        const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;

        if (!clientId) {
          throw new Error("Discord Client ID is not configured");
        }

        console.log(`Discord Client ID: ${clientId}`);

        console.log("Loading Discord SDK in background...");

        // Start Discord SDK import early
        const sdkImportPromise = import("@discord/embedded-app-sdk");

        // Dynamically import Discord SDK only when needed
        const { DiscordSDK } = await sdkImportPromise;

        console.log("Initializing Discord SDK...");

        // Discord SDK 초기화
        const discordSdk = new DiscordSDK(clientId);

        await discordSdk.ready();

        // Authorize with Discord Client
        const { code } = await discordSdk.commands.authorize({
          client_id: clientId,
          response_type: "code",
          state: "",
          prompt: "none",
          scope: ["identify", "guilds", "applications.commands", "activities.read"],
        });

        // Retrieve an access_token from your activity's server
        // Note: We need to prefix our backend `/api/token` route with `/.proxy` to stay compliant with the CSP.
        // Read more about constructing a full URL and using external resources at
        // https://discord.com/developers/docs/activities/development-guides#construct-a-full-url
        const apiPrefix = this.isDiscordUser ? "/.proxy" : "";
        const response = await fetch(`${apiPrefix}/api/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
          }),
        });

        const { access_token } = await response.json();

        // Authenticate with Discord client (using the access_token)
        this.auth = await discordSdk.commands.authenticate({
          access_token,
        });

        if (this.auth == null) {
          throw new Error("Authenticate command failed");
        }

        this.isDiscordUser = true;

        console.log(
          `Discord user loaded: ${this.name} (${this.id}), discord user: ${this.isDiscordUser}`,
        );
        // Note: We don't save Discord info to localStorage for privacy.
        // It will be fetched on each load when in the Discord client.
      } catch (error) {
        console.error("Failed to initialize Discord SDK:", error.message);
        console.log("Continuing with temporary user...");
        // Keep the temporary user we already set up
        this.isDiscordUser = false;
      }
    },

    /**
     * Updates the user's name and saves to localStorage (if not Discord user)
     */
    updateUserName(newName) {
      this.name = newName;
      if (!this.isDiscordUser) {
        localStorage.setItem("userName", newName);
      }
      console.log(`User name updated to: ${newName}`);
    },

    /**
     * Resets user data (useful for logout or profile reset)
     */
    resetUser() {
      this.id = null;
      this.name = null;
      this.isDiscordUser = false;
      localStorage.removeItem("userId");
      localStorage.removeItem("userName");
      console.log("User data reset");
    },
  },
});
