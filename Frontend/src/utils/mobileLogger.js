class MobileLogger {
  constructor() {
    this.logs = [];
    this.container = null;
    this.isVisible = false;
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
    };

    this.init();
  }

  init() {
    // Override console methods
    console.log = (...args) => {
      this.originalConsole.log(...args);
      this.addLog("log", args);
    };

    console.error = (...args) => {
      this.originalConsole.error(...args);
      this.addLog("error", args);
    };

    console.warn = (...args) => {
      this.originalConsole.warn(...args);
      this.addLog("warn", args);
    };

    console.info = (...args) => {
      this.originalConsole.info(...args);
      this.addLog("info", args);
    };

    // Catch unhandled errors
    window.addEventListener("error", (event) => {
      this.addLog("error", [`${event.filename}:${event.lineno} - ${event.message}`]);
    });

    // Catch unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.addLog("error", [`Unhandled Promise Rejection: ${event.reason}`]);
    });

    this.createUI();
  }

  addLog(type, args) {
    const timestamp = new Date().toLocaleTimeString();
    const message = args
      .map((arg) => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)))
      .join(" ");

    this.logs.push({ type, message, timestamp });

    // Keep only last 100 logs
    if (this.logs.length > 100) {
      this.logs.shift();
    }

    this.updateUI();
  }

  createUI() {
    // Create toggle button
    const toggleBtn = document.createElement("button");
    toggleBtn.innerHTML = "🐛";
    toggleBtn.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 10000;
      background: #007acc;
      color: white;
      border: none;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      font-size: 20px;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      touch-action: manipulation;
    `;

    toggleBtn.addEventListener("click", () => this.toggle());
    document.body.appendChild(toggleBtn);

    // Create console container
    this.container = document.createElement("div");
    this.container.style.cssText = `
      position: fixed;
      top: 70px;
      right: 10px;
      width: 90%;
      max-width: 400px;
      height: 50vh;
      max-height: 400px;
      background: #1e1e1e;
      color: #d4d4d4;
      border: 1px solid #555;
      border-radius: 8px;
      z-index: 9999;
      display: none;
      flex-direction: column;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    `;

    // Create header
    const header = document.createElement("div");
    header.style.cssText = `
      padding: 8px 12px;
      background: #2d2d30;
      border-bottom: 1px solid #555;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 8px 8px 0 0;
    `;
    header.innerHTML = `
      <span style="font-weight: bold;">Mobile Console</span>
      <div>
        <button id="clearBtn" style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 3px; margin-right: 5px; cursor: pointer; font-size: 11px;">Clear</button>
        <button id="closeBtn" style="background: #6c757d; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;">×</button>
      </div>
    `;

    // Create log display area
    this.logArea = document.createElement("div");
    this.logArea.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 8px;
      scrollbar-width: thin;
      scrollbar-color: #555 #2d2d30;
    `;

    // Custom scrollbar for webkit browsers
    const style = document.createElement("style");
    style.textContent = `
      .mobile-logger-logs::-webkit-scrollbar {
        width: 6px;
      }
      .mobile-logger-logs::-webkit-scrollbar-track {
        background: #2d2d30;
      }
      .mobile-logger-logs::-webkit-scrollbar-thumb {
        background: #555;
        border-radius: 3px;
      }
      .mobile-logger-logs::-webkit-scrollbar-thumb:hover {
        background: #777;
      }
    `;
    document.head.appendChild(style);
    this.logArea.className = "mobile-logger-logs";

    this.container.appendChild(header);
    this.container.appendChild(this.logArea);
    document.body.appendChild(this.container);

    // Add event listeners
    header.querySelector("#clearBtn").addEventListener("click", () => this.clear());
    header.querySelector("#closeBtn").addEventListener("click", () => this.hide());

    // Make draggable on desktop
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    header.addEventListener("mousedown", (e) => {
      isDragging = true;
      dragOffset.x = e.clientX - this.container.offsetLeft;
      dragOffset.y = e.clientY - this.container.offsetTop;
      document.addEventListener("mousemove", handleDrag);
      document.addEventListener("mouseup", stopDrag);
    });

    const handleDrag = (e) => {
      if (isDragging) {
        this.container.style.left = `${e.clientX - dragOffset.x}px`;
        this.container.style.top = `${e.clientY - dragOffset.y}px`;
        this.container.style.right = "auto";
      }
    };

    const stopDrag = () => {
      isDragging = false;
      document.removeEventListener("mousemove", handleDrag);
      document.removeEventListener("mouseup", stopDrag);
    };
  }

  updateUI() {
    if (!this.logArea) return;

    this.logArea.innerHTML = this.logs
      .map((log) => {
        const colorMap = {
          log: "#d4d4d4",
          error: "#f48771",
          warn: "#dcdcaa",
          info: "#9cdcfe",
        };

        const color = colorMap[log.type] || "#d4d4d4";
        const bgColor =
          {
            log: "rgba(212, 212, 212, 0.05)",
            error: "rgba(244, 135, 113, 0.1)",
            warn: "rgba(220, 220, 170, 0.1)",
            info: "rgba(156, 220, 254, 0.1)",
          }[log.type] || "rgba(255,255,255,0.05)";

        return `
        <div style="margin-bottom: 4px; padding: 6px; border-left: 3px solid ${color}; background: ${bgColor}; border-radius: 0 4px 4px 0;">
          <div style="font-size: 10px; opacity: 0.7; margin-bottom: 3px; font-weight: bold;">[${log.timestamp}] ${log.type.toUpperCase()}</div>
          <pre style="margin: 0; white-space: pre-wrap; word-break: break-word; font-size: 11px; line-height: 1.3;">${log.message}</pre>
        </div>
      `;
      })
      .join("");

    // Auto scroll to bottom
    this.logArea.scrollTop = this.logArea.scrollHeight;
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    this.container.style.display = "flex";
    this.isVisible = true;
    this.updateUI(); // Refresh UI when showing
  }

  hide() {
    this.container.style.display = "none";
    this.isVisible = false;
  }

  clear() {
    this.logs = [];
    this.updateUI();
  }

  destroy() {
    // Restore original console methods
    console.log = this.originalConsole.log;
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.info = this.originalConsole.info;

    // Remove UI elements
    if (this.container) {
      this.container.remove();
    }

    const toggleBtn = document.querySelector(
      'button[style*="position: fixed"][style*="right: 10px"]',
    );
    if (toggleBtn) {
      toggleBtn.remove();
    }
  }

  // Utility method to log Vue component data
  logVueData(componentName, data) {
    this.addLog("info", [`[Vue ${componentName}]`, data]);
  }

  // Utility method to log Vue ref values
  logRef(label, ref) {
    const isRef = ref && typeof ref === "object" && ref.__v_isRef === true;
    if (isRef) {
      this.addLog("info", [`[Vue Ref] ${label}:`, ref.value]);
    } else {
      this.addLog("warn", [`[Vue Ref] ${label} is not a ref:`, ref]);
    }
  }

  // Utility method to log multiple Vue refs at once
  logRefs(refs) {
    Object.entries(refs).forEach(([key, ref]) => {
      this.logRef(key, ref);
    });
  }

  // Utility method to log Vue reactive data
  logReactive(label, reactive) {
    this.addLog("info", [`[Vue Reactive] ${label}:`, reactive]);
  }

  // Utility method to log API responses
  logApiResponse(url, response) {
    this.addLog("info", [`[API Response] ${url}:`, response]);
  }

  // Utility method to log WebSocket messages
  logWebSocket(direction, message) {
    this.addLog("info", [`[WebSocket ${direction}]`, message]);
  }
}

// Export singleton instance
export const mobileLogger = new MobileLogger();

// Export class for manual instantiation if needed
export { MobileLogger };
