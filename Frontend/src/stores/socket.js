import { ref, computed } from "vue";
import { defineStore } from "pinia";

export const useSocketStore = defineStore("socket", () => {
  const socket = ref(null);
  // 타입별로 여러 핸들러를 보관하기 위해 Set 사용
  // 구조: { [type: string]: Set<Function> }
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

        // 수신 타입에 등록된 모든 핸들러 호출
        if (data.type) {
          const handlers = messageHandlers.value[data.type];
          const payload = data.payload || data;
          // 과거 단일 핸들러 형태와의 하위 호환
          if (typeof handlers === "function") {
            try {
              handlers(payload, data);
            } catch (e) {
              console.error(e);
            }
          } else if (handlers && handlers instanceof Set) {
            for (const fn of handlers) {
              try {
                fn(payload, data);
              } catch (e) {
                console.error(e);
              }
            }
          }
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
        // 에러 핸들러 호출 가능 (등록된 모든 핸들러 호출)
        const handlers = messageHandlers.value["connectionFailed"];
        if (typeof handlers === "function") {
          try {
            handlers();
          } catch (e) {
            console.error(e);
          }
        } else if (handlers && handlers instanceof Set) {
          for (const fn of handlers) {
            try {
              fn();
            } catch (e) {
              console.error(e);
            }
          }
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
    const current = messageHandlers.value[type];
    if (!current) {
      messageHandlers.value[type] = new Set([handler]);
    } else if (current instanceof Set) {
      current.add(handler);
    } else if (typeof current === "function") {
      // 과거 단일 핸들러에서 Set으로 승격
      const s = new Set([current, handler]);
      messageHandlers.value[type] = s;
    } else {
      // 예외적인 형태 방어적 처리
      messageHandlers.value[type] = new Set([handler]);
    }

    // 편의: 해제 함수 반환
    return () => unregisterHandler(type, handler);
  }

  function unregisterHandler(type, handler) {
    const current = messageHandlers.value[type];
    if (!current) return;

    if (handler) {
      if (current instanceof Set) {
        current.delete(handler);
        if (current.size === 0) delete messageHandlers.value[type];
      } else if (typeof current === "function") {
        // 단일 핸들러였고 동일 레퍼런스인 경우만 제거
        if (current === handler) delete messageHandlers.value[type];
      }
    } else {
      // handler 미지정 시 해당 타입 모두 제거 (하위 호환)
      delete messageHandlers.value[type];
    }
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
