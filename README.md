# GamingHerb

A gaming platform that works both as a Discord Activity and as a standalone web application.

## Features

- **Dual Platform Support**: Works in Discord Activities and standalone web browsers
- **Automatic Environment Detection**: Automatically detects Discord environment
- **Game Integration**: Supports multiple games (currently includes Gomoku/Othello)
- **Real-time Communication**: WebSocket-based game rooms

## Discord Activity Setup

### Prerequisites

1. Create a Discord Application at [Discord Developer Portal](https://discord.com/developers/applications)
2. Configure your application as a Discord Activity
3. Get your Discord Client ID

### Environment Configuration

1. Copy the Discord Client ID from your Discord application
2. Update the `.env` file in the project root:
   ```
   VITE_DISCORD_CLIENT_ID=your_discord_client_id_here
   ```

### Discord Activity Detection

The application automatically detects if it's running inside Discord by checking:

- URL parameters (`frame_id`, `instance_id`, `platform`, etc.)
- iframe context
- User Agent strings
- Referrer information
- Activity-specific environment variables

### Development Testing

You can test Discord mode in development using the browser console:

```javascript
// Access the user store
const userStore = useUserStore();

// Check current environment detection
console.log(userStore.getEnvironmentInfo());

// Force Discord mode for testing (dev only)
userStore.forceDiscordMode(true);
```

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## Architecture

### Frontend (Vue 3 + Vite)

- **Framework**: Vue 3 with Composition API
- **State Management**: Pinia
- **Routing**: Vue Router
- **Styling**: TailwindCSS
- **Build Tool**: Vite

### Backend (Node.js + Express)

- **Server**: Express.js
- **WebSockets**: Socket.io for real-time communication
- **Game Logic**: Modular game implementations

### Discord Integration

- **SDK**: @discord/embedded-app-sdk
- **Dynamic Loading**: SDK is only loaded when running in Discord
- **Fallback Support**: Graceful degradation to web-only mode
