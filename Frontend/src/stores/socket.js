import { ref, computed } from "vue";
import { defineStore } from "pinia";

export const useSocketStore = defineStore("socket", () => {
  const socket = ref(null);
  const messageHandlers = ref({});
  const isReconnecting = ref(false);
  const reconnectAttempts = ref(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3초

  let lastUrl = null;

  function connect(url) {
    lastUrl = url;

    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      console.log("WebSocket is already connected.");
      return;
    }

    socket.value = new WebSocket(url);

    socket.value.onopen = () => {
      console.log("WebSocket connected");
      reconnectAttempts.value = 0; // 연결 성공 시 재시도 카운트 리셋
      isReconnecting.value = false;
    };

    socket.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received message:", data);

        // Find and call the handler for the message type
        if (data.type && messageHandlers.value[data.type]) {
          messageHandlers.value[data.type](data.payload || data);
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };

    socket.value.onclose = (event) => {
      console.log("WebSocket disconnected", event.code, event.reason);
      socket.value = null;

      // 의도적 종료가 아닌 경우에만 재연결 시도
      if (!event.wasClean && reconnectAttempts.value < maxReconnectAttempts) {
        attemptReconnect();
      }
    };

    socket.value.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }

  function attemptReconnect() {
    if (isReconnecting.value || !lastUrl) return;

    isReconnecting.value = true;
    reconnectAttempts.value++;

    console.log(`Attempting to reconnect... (${reconnectAttempts.value}/${maxReconnectAttempts})`);

    setTimeout(() => {
      if (reconnectAttempts.value <= maxReconnectAttempts) {
        connect(lastUrl);
      } else {
        console.error("Max reconnection attempts reached");
        isReconnecting.value = false;
        // 에러 핸들러 호출 가능
        if (messageHandlers.value["connectionFailed"]) {
          messageHandlers.value["connectionFailed"]();
        }
      }
    }, reconnectDelay);
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
    reconnectAttempts.value = maxReconnectAttempts + 1; // 재연결 방지
    if (socket.value) {
      socket.value.close(1000, "Manual disconnect"); // 의도적 종료임을 명시
      socket.value = null;
      messageHandlers.value = {};
      console.log("WebSocket disconnected by client.");
    }
  }

  return {
    socket,
    isReconnecting,
    messageHandlers,
    connect,
    sendMessage,
    registerHandler,
    unregisterHandler,
    disconnect,
    isConnected: computed(() => socket.value?.readyState === WebSocket.OPEN),
  };
});
