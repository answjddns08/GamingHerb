import gamesConfig from "@/config/games.json";
import { markdownToHtml } from "@/utils/markdownConvert.js";

// Vite의 glob import를 사용하여 마크다운 파일들을 미리 로드
const markdownModules = import.meta.glob("@/games/**/*.md", {
  query: "?raw",
  import: "default",
  eager: false,
});

// Vite의 glob import를 사용하여 설정 파일들을 미리 로드
const settingsModules = import.meta.glob("@/games/**/settings.js", {
  eager: false,
});

// Vite의 glob import를 사용하여 게임 컴포넌트들을 미리 로드
const componentModules = import.meta.glob("@/games/**/*.vue", {
  eager: false,
});

// games.json에서 게임 설정을 가져와서 동적 import와 함께 구성
export const games = {};

// games.json의 각 게임에 대해 동적 컴포넌트 로더 추가
Object.entries(gamesConfig.games).forEach(([gameId, config]) => {
  games[gameId] = {
    ...config,
    // 동적 컴포넌트 로더 추가 (glob 사용)
    component: () => {
      // config.componentPath에서 파일명 추출
      const fileName = config.componentPath.split("/").pop();

      // glob에서 해당 파일을 찾기
      for (const [path, loader] of Object.entries(componentModules)) {
        if (path.includes(fileName) && path.includes(gameId)) {
          return loader();
        }
      }

      // 파일을 찾지 못한 경우 에러 throw
      return Promise.reject(new Error(`컴포넌트 파일을 찾을 수 없습니다: ${config.componentPath}`));
    },
    // 설정 파일이 있다면 glob에서 찾아서 추가
    ...(config.configPath && {
      settings: () => {
        // config.configPath에서 파일명 추출 (예: "settings.js")
        const fileName = config.configPath.split("/").pop();

        // glob에서 해당 파일을 찾기
        for (const [path, loader] of Object.entries(settingsModules)) {
          if (path.includes(fileName) && path.includes(gameId)) {
            return loader();
          }
        }

        // 파일을 찾지 못한 경우 에러 throw
        return Promise.reject(new Error(`설정 파일을 찾을 수 없습니다: ${config.configPath}`));
      },
    }),
    // 설명 파일이 있다면 glob에서 찾아서 추가
    ...(config.descriptionPath && {
      description: () => {
        // config.descriptionPath에서 파일명 추출 (예: "Description.md")
        const fileName = config.descriptionPath.split("/").pop();

        // glob에서 해당 파일을 찾기
        for (const [path, loader] of Object.entries(markdownModules)) {
          if (path.includes(fileName)) {
            return loader();
          }
        }

        // 파일을 찾지 못한 경우 기본값 반환
        return Promise.resolve(`# ${config.name}\n\n게임 설명을 불러올 수 없습니다.`);
      },
    }),
  };
});

// 게임 관련 유틸리티 함수들
export function getGameConfig(gameId) {
  return games[gameId] || null;
}

export function getAllGames() {
  return Object.values(games);
}

export function getGamesByCategory(category) {
  return getAllGames().filter((game) => game.category.includes(category));
}

export function getGamesByDifficulty(difficulty) {
  return getAllGames().filter((game) => game.difficulty.toLowerCase() === difficulty.toLowerCase());
}

export function getGamesByPlatform(platform) {
  return getAllGames().filter((game) => game.platform.includes(platform));
}

export function getGamesByFeature(feature) {
  return getAllGames().filter((game) => game.features && game.features[feature]);
}

export function getGamesWithAI() {
  return getGamesByFeature("ai");
}

export function getGamesWithChat() {
  return getGamesByFeature("chat");
}

export function getGamesWithTimer() {
  return getGamesByFeature("timer");
}

// 추가 유틸리티 함수들
export function getGameIds() {
  return Object.keys(games);
}

export function isValidGameId(gameId) {
  return gameId in games;
}

export function getGamesByPlayerCount(playerCount) {
  return getAllGames().filter(
    (game) => playerCount >= game.minPlayers && playerCount <= game.maxPlayers,
  );
}

export function searchGames(query) {
  const lowercaseQuery = query.toLowerCase();
  return getAllGames().filter(
    (game) =>
      game.name.toLowerCase().includes(lowercaseQuery) ||
      game.summary.toLowerCase().includes(lowercaseQuery) ||
      game.category.some((cat) => cat.toLowerCase().includes(lowercaseQuery)),
  );
}

// gameLoader.js와 호환성을 위한 별칭 함수들
export function getGameInfo(gameId) {
  return getGameConfig(gameId);
}

export function getAvailableGames() {
  return getAllGames().map((game) => ({
    id: game.id,
    ...game,
  }));
}

export async function loadGameComponent(gameId) {
  const gameConfig = getGameConfig(gameId);

  if (!gameConfig) {
    throw new Error(`게임 ID "${gameId}"에 해당하는 게임을 찾을 수 없습니다.`);
  }

  try {
    const gameModule = await gameConfig.component();
    return gameModule.default;
  } catch (error) {
    throw new Error(`게임 컴포넌트 로드 실패: ${error.message}`);
  }
}

export async function getGameSettings(gameId) {
  const gameConfig = getGameConfig(gameId);

  if (!gameConfig || !gameConfig.settings) {
    throw new Error(`게임 ID "${gameId}"에 해당하는 설정을 찾을 수 없습니다.`);
  }

  try {
    const settingsModule = await gameConfig.settings();
    // default export가 있으면 그것을 사용하고, 없으면 gameSettings를 사용
    return settingsModule.default || settingsModule.gameSettings || settingsModule;
  } catch (error) {
    throw new Error(`게임 설정 로드 실패: ${error.message}`);
  }
}

export async function getGameDescription(gameId) {
  const gameConfig = getGameConfig(gameId);

  if (!gameConfig) {
    return `<h2>게임을 찾을 수 없습니다</h2><p>게임 ID "${gameId}"에 해당하는 게임을 찾을 수 없습니다.</p>`;
  }

  if (!gameConfig.description) {
    return `<h2>${gameConfig.name} 게임 설명</h2><p>게임 설명을 찾을 수 없습니다.</p>`;
  }

  try {
    const markdownContent = await gameConfig.description();
    return markdownToHtml(markdownContent);
  } catch (error) {
    console.error("설명 파일 로드 실패:", error);
    return `<h2>${gameConfig.name} 게임 설명</h2><p>게임 설명을 불러오는 데 실패했습니다. 나중에 다시 시도해주세요.</p>`;
  }
}
