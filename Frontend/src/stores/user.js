import { defineStore } from "pinia";

export const useUserStore = defineStore("user", {
  state: () => ({
    id: null,
    name: null,
    isDiscordUser: false,
  }),

  getters: {
    isLoggedIn: (state) => state.id !== null,
    displayName: (state) => state.name || "Anonymous",
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
     * MOCK: In a real scenario, you would use the Discord SDK here.
     * This function checks if the app is running inside Discord.
     */
    isDiscordEmbedded() {
      // For testing purposes, you can simulate being in Discord
      // by adding ?discord=true to the URL.
      // return window.location.search.includes('discord=true');
      return false;
    },

    /**
     * MOCK: This function simulates fetching user data from the Discord SDK.
     */
    async getDiscordUserInfo() {
      console.log("Fetching Discord user info...");
      // In a real implementation, this would be an async call to the Discord SDK
      return Promise.resolve({
        id: "discord-user-12345",
        global_name: "DiscordUser",
      });
    },

    /**
     * Initializes the user profile, either from Discord, localStorage, or by generating a new one.
     */
    async initializeUser() {
      let userId = localStorage.getItem("userId");
      let userName = localStorage.getItem("userName");

      if (this.isDiscordEmbedded()) {
        try {
          const discordUser = await this.getDiscordUserInfo();
          this.id = discordUser.id;
          this.name = discordUser.global_name;
          this.isDiscordUser = true;
          // Note: We don't save Discord info to localStorage for privacy.
          // It will be fetched on each load when in the Discord client.
        } catch (error) {
          console.error("Failed to fetch Discord user info, falling back to local user.", error);
          // If Discord auth fails, fall back to localStorage or generate a new user
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
        }
      } else {
        // Standard web browser flow
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
      }

      console.log(`User initialized: ${this.name} (${this.id})`);
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
