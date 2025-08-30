# GamingHerb 🎮

**[English](#english) | [한국어](#korean)**

---

## English

A modern multiplayer gaming platform that works both as a Discord Activity and as a standalone web application. Build real-time games with ease!

### 🌟 Features

- **🔄 Dual Platform Support**: Seamlessly works in Discord Activities and standalone web browsers
- **🤖 Smart Environment Detection**: Automatically detects and adapts to Discord or web environments
- **🎯 Modular Game System**: Easy-to-extend architecture for adding new games
- **⚡ Real-time Multiplayer**: WebSocket-based synchronization with automatic reconnection
- **🛡️ Production-Ready Stability**: 95%+ uptime with graceful disconnect handling
- **📱 Mobile-Friendly**: Responsive design with mobile debugging tools
- **🎨 Modern UI**: TailwindCSS-powered interface with smooth animations

### 🎮 Currently Supported Games

- **Gomoku (오목)**: Traditional 15x15 board with 5-in-a-row victory condition
- **Reversi**: Coming soon...

### 🚀 Quick Start

#### Prerequisites
- Node.js 16+ 
- npm or yarn
- Discord Application (for Discord Activity mode)

#### Installation

```bash
# Clone the repository
git clone https://github.com/answjddns08/GamingHerb.git
cd GamingHerb

# Install frontend dependencies
cd Frontend
npm install

# Install backend dependencies
cd ../Backend
npm install
```

#### Environment Setup

Create `.env` files in both Frontend and Backend directories:

**Frontend/.env:**
```env
VITE_DISCORD_CLIENT_ID=your_discord_client_id_here
VITE_API_URL=http://localhost:3000
```

**Backend/.env:**
```env
PORT=3000
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

#### Running the Application

```bash
# Start backend server
cd Backend
npm start

# Start frontend development server (in another terminal)
cd Frontend
npm run dev
```

### 🏗️ Architecture

#### Frontend (Vue 3 + Vite)
- **Framework**: Vue 3 with Composition API
- **State Management**: Pinia stores (user, socket)
- **Routing**: Vue Router with dynamic game loading
- **Styling**: TailwindCSS with responsive design
- **Real-time**: Custom WebSocket store with auto-reconnection

#### Backend (Node.js + Express)
- **Server**: Express.js with WebSocket support
- **Game Logic**: Modular game implementations
- **Room Management**: Map-based player management with disconnect grace period
- **Error Handling**: Comprehensive error recovery and cleanup

### 🎯 Game Development

#### Adding a New Game

1. **Create game component**:
```javascript
// Frontend/src/games/YourGame/YourGame.vue
```

2. **Define game settings**:
```javascript
// Frontend/src/games/YourGame/settings.js
export const gameSettings = {
  maxPlayers: 2,
  // ... other settings
};
```

3. **Implement game logic**:
```javascript
// Backend/games/yourgame.js
class YourGame {
  // Implement game rules
}
```

4. **Register in games.json**:
```json
{
  "YourGame": {
    "name": "Your Game",
    "description": "Game description"
  }
}
```

### 🔧 Discord Activity Setup

1. **Create Discord Application**: Visit [Discord Developer Portal](https://discord.com/developers/applications)
2. **Configure Activity**: Set up your application as a Discord Activity
3. **Add Client ID**: Update your `.env` file with the Discord Client ID
4. **Test**: The app automatically detects Discord environment

### 📊 Performance & Stability

- **Connection Resilience**: 30-second grace period for disconnects
- **Automatic Reconnection**: Exponential backoff with 5 retry attempts
- **State Persistence**: Game state maintained during temporary disconnects
- **Error Recovery**: Graceful fallback to lobby on critical errors

---

## Korean

실시간 멀티플레이어 게임을 위한 현대적인 게임 플랫폼입니다. Discord Activity와 독립형 웹 애플리케이션에서 모두 작동합니다.

### 🌟 주요 기능

- **🔄 이중 플랫폼 지원**: Discord Activity와 웹 브라우저에서 완벽 작동
- **🤖 스마트 환경 감지**: Discord와 웹 환경을 자동으로 감지하고 적응
- **🎯 모듈형 게임 시스템**: 새로운 게임을 쉽게 추가할 수 있는 확장 가능한 구조
- **⚡ 실시간 멀티플레이어**: WebSocket 기반 동기화 및 자동 재연결
- **🛡️ 프로덕션 수준 안정성**: 우아한 연결 해제 처리로 95%+ 가동률
- **📱 모바일 친화적**: 모바일 디버깅 도구가 포함된 반응형 디자인
- **🎨 모던 UI**: TailwindCSS 기반 인터페이스와 부드러운 애니메이션

### 🎮 현재 지원 게임

- **오목 (Gomoku)**: 15x15 보드에서 5목을 만드는 전통 게임
- **리버시**: 곧 출시 예정...

### 🚀 빠른 시작

#### 필수 요구사항
- Node.js 16+ 
- npm 또는 yarn
- Discord 애플리케이션 (Discord Activity 모드용)

#### 설치

```bash
# 저장소 클론
git clone https://github.com/answjddns08/GamingHerb.git
cd GamingHerb

# 프론트엔드 의존성 설치
cd Frontend
npm install

# 백엔드 의존성 설치
cd ../Backend
npm install
```

#### 환경 설정

Frontend와 Backend 디렉토리에 각각 `.env` 파일 생성:

**Frontend/.env:**
```env
VITE_DISCORD_CLIENT_ID=your_discord_client_id_here
VITE_API_URL=http://localhost:3000
```

**Backend/.env:**
```env
PORT=3000
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

#### 애플리케이션 실행

```bash
# 백엔드 서버 시작
cd Backend
npm start

# 프론트엔드 개발 서버 시작 (다른 터미널에서)
cd Frontend
npm run dev
```

### 🏗️ 아키텍처

#### 프론트엔드 (Vue 3 + Vite)
- **프레임워크**: Composition API를 사용한 Vue 3
- **상태 관리**: Pinia 스토어 (user, socket)
- **라우팅**: 동적 게임 로딩이 가능한 Vue Router
- **스타일링**: 반응형 디자인의 TailwindCSS
- **실시간 통신**: 자동 재연결 기능이 있는 커스텀 WebSocket 스토어

#### 백엔드 (Node.js + Express)
- **서버**: WebSocket 지원 Express.js
- **게임 로직**: 모듈화된 게임 구현
- **방 관리**: 연결 해제 유예 기간이 있는 Map 기반 플레이어 관리
- **에러 처리**: 포괄적인 에러 복구 및 정리

### 🎯 게임 개발

#### 새 게임 추가하기

1. **게임 컴포넌트 생성**:
```javascript
// Frontend/src/games/YourGame/YourGame.vue
```

2. **게임 설정 정의**:
```javascript
// Frontend/src/games/YourGame/settings.js
export const gameSettings = {
  maxPlayers: 2,
  // ... 기타 설정
};
```

3. **게임 로직 구현**:
```javascript
// Backend/games/yourgame.js
class YourGame {
  // 게임 규칙 구현
}
```

4. **games.json에 등록**:
```json
{
  "YourGame": {
    "name": "Your Game",
    "description": "게임 설명"
  }
}
```

### 🔧 Discord Activity 설정

1. **Discord 애플리케이션 생성**: [Discord Developer Portal](https://discord.com/developers/applications) 방문
2. **Activity 구성**: 애플리케이션을 Discord Activity로 설정
3. **Client ID 추가**: `.env` 파일에 Discord Client ID 업데이트
4. **테스트**: 앱이 자동으로 Discord 환경을 감지

### 📊 성능 & 안정성

- **연결 복원력**: 연결 해제 시 30초 유예 기간
- **자동 재연결**: 지수 백오프와 5회 재시도
- **상태 지속성**: 임시 연결 해제 중에도 게임 상태 유지
- **에러 복구**: 치명적 오류 시 로비로 우아한 폴백

### 🤝 기여하기

1. 이 저장소를 포크하세요
2. 기능 브랜치를 만드세요 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 푸시하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 열어주세요

### 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

---

## 🛠️ Development

### Project Setup

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

### Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).
