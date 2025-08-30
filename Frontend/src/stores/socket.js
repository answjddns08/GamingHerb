import { ref } from "vue";
import { defineStore } from "pinia";

export const useSocketStore = defineStore("socket", () => {
  const socket = ref(null);
  const messageHandlers = ref({});

  function connect(url) {
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      console.log("WebSocket is already connected.");
      return;
    }

    socket.value = new WebSocket(url);

    socket.value.onopen = () => {
      console.log("WebSocket connected");
    };

    socket.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received message:", data);

        // Find and call the handler for the message type
        if (data.type && messageHandlers.value[data.type]) {
          messageHandlers.value[data.type](data.payload);
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };

    socket.value.onclose = () => {
      console.log("WebSocket disconnected");
      socket.value = null;
    };

    socket.value.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  function sendMessage(type, payload) {
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, ...payload });
      socket.value.send(message);
    } else {
      console.error("WebSocket is not connected.");
    }
  }

  function registerHandler(type, handler) {
    messageHandlers.value[type] = handler;
  }

  function unregisterHandler(type) {
    delete messageHandlers.value[type];
  }

  function disconnect() {
    if (socket.value) {
      socket.value.close();
      socket.value = null;
      messageHandlers.value = {};
      console.log("WebSocket disconnected by client.");
    }
  }

  return {
    socket,
    connect,
    sendMessage,
    registerHandler,
    unregisterHandler,
    disconnect,
  };
});
