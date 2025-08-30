import "./assets/tail.css";

import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import { useUserStore } from "./stores/user";

// Import mobile logger for debugging on mobile devices
import { mobileLogger } from "./utils/mobileLogger";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Initialize the user first, and then mount the Vue app.
// This ensures that user data is available before any components are rendered.
async function initializeApp() {
  const userStore = useUserStore();
  await userStore.initializeUser();
  

  // Initialize mobile logger for development
  console.log("Mobile logger initialized for debugging");

  mobileLogger.show(); // Show the logger by default for easier access during development

  app.mount("#app");
}

initializeApp();
