import "./assets/tail.css";

import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import { useUserStore } from "./stores/user";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Initialize the user first, and then mount the Vue app.
// This ensures that user data is available before any components are rendered.
async function initializeApp() {
  const userStore = useUserStore();
  await userStore.initializeUser();
  app.mount("#app");
}

initializeApp();
