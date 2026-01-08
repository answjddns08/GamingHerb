/**
 * @file games/index.js
 * @description 게임 관련 모듈과 데이터를 동적으로 로드하고 관리하는 중앙 허브 역할을 합니다.
 *              Vite의 glob import 기능을 사용하여 게임 컴포넌트, 설정, 설명 파일을 효율적으로 처리합니다.
 *              또한, 다양한 기준에 따라 게임을 검색하고 필터링하는 유틸리티 함수들을 제공합니다.
 */

import gamesConfig from "@/config/games.json";
import { markdownToHtml } from "@/utils/markdownConvert.js";

// Vite의 glob import를 사용하여 마크다운 파일들을 동적으로 가져옵니다.
// eager: false는 해당 모듈이 필요할 때만 비동기적으로 로드되도록 합니다.
const markdownModules = import.meta.glob("@/games/**/*.md", {
  query: "?raw",
  import: "default",
  eager: false,
});

// Vite의 glob import를 사용하여 설정 파일들을 동적으로 가져옵니다.
const settingsModules = import.meta.glob("@/games/**/settings.js", {
  eager: false,
});

// Vite의 glob import를 사용하여 게임 컴포넌트(.vue) 파일들을 동적으로 가져옵니다.
const componentModules = import.meta.glob("@/games/**/*.vue", {
  eager: false,
});

/**
 * @type {Object.<string, Object>}
 * @description games.json 설정을 기반으로 구성된 게임 객체들의 맵입니다.
 *              각 게임 객체는 동적 로더 함수(component, settings, description)를 포함합니다.
 */
export const games = {};

// games.json의 각 게임에 대해 동적 로더를 포함한 객체를 생성합니다.
Object.entries(gamesConfig.games).forEach(([gameId, config]) => {
  games[gameId] = {
    ...config,
    /**
     * 게임 Vue 컴포넌트를 비동기적으로 로드합니다.
     * @returns {Promise<import('vue').Component>}
     */
    component: () => {
      const path = Object.keys(componentModules).find(p => p.includes(gameId));
      if (path) return componentModules[path]();
      return Promise.reject(new Error(`Component not found for ${gameId}`));
    },
    /**
     * 게임 설정 모듈을 비동기적으로 로드합니다.
     * @returns {Promise<Object>|undefined}
     */
    ...(config.configPath && {
      settings: () => {
        const path = Object.keys(settingsModules).find(p => p.includes(gameId));
        if (path) return settingsModules[path]();
        return Promise.reject(new Error(`Settings not found for ${gameId}`));
      },
    }),
    /**
     * 게임 설명(마크다운)을 비동기적으로 로드합니다.
     * @returns {Promise<string>|undefined}
     */
    ...(config.descriptionPath && {
      description: () => {
        const path = Object.keys(markdownModules).find(p => p.includes(gameId));
        if (path) return markdownModules[path]();
        return Promise.resolve(`# ${config.name}\n\nDescription not available.`);
      },
    }),
  };
});


// --- 게임 데이터 조회 유틸리티 ---

/**
 * 지정된 ID의 게임 설정을 가져옵니다.
 * @param {string} gameId - 게임의 고유 ID
 * @returns {Object|null} 해당 게임의 설정 객체 또는 null
 */
export function getGameConfig(gameId) {
  return games[gameId] || null;
}

/**
 * 모든 게임의 목록을 배열로 반환합니다.
 * @returns {Array<Object>} 모든 게임 객체의 배열
 */
export function getAllGames() {
  return Object.values(games);
}

/**
 * 이용 가능한 모든 게임의 목록을 반환합니다. (gameLoader.js 호환용)
 * @returns {Array<Object>} 각 게임의 ID와 설정이 포함된 객체의 배열
 */
export function getAvailableGames() {
  return Object.keys(games).map(id => ({ id, ...games[id] }));
}


// --- 동적 로더 함수 ---

/**
 * 지정된 ID의 게임 Vue 컴포넌트를 비동기적으로 로드합니다.
 * @param {string} gameId - 로드할 게임의 ID
 * @returns {Promise<import('vue').Component>} 로드된 Vue 컴포넌트
 * @throws {Error} 게임 ID나 컴포넌트를 찾을 수 없을 때
 */
export async function loadGameComponent(gameId) {
  const gameConfig = getGameConfig(gameId);
  if (!gameConfig || !gameConfig.component) {
    throw new Error(`Game component loader not found for ID "${gameId}".`);
  }
  const gameModule = await gameConfig.component();
  return gameModule.default;
}

/**
 * 지정된 ID의 게임 설정 모듈을 비동기적으로 로드합니다.
 * @param {string} gameId - 로드할 게임의 ID
 * @returns {Promise<Object>} 로드된 설정 객체
 * @throws {Error} 게임 ID나 설정을 찾을 수 없을 때
 */
export async function getGameSettings(gameId) {
  const gameConfig = getGameConfig(gameId);
  if (!gameConfig || !gameConfig.settings) {
    // 설정이 없는 게임일 경우, 기본값 반환
    return { settings: {}, maxPlayers: 2 };
  }
  const settingsModule = await gameConfig.settings();
  return settingsModule.default || settingsModule;
}

/**
 * 지정된 ID의 게임 설명을 마크다운에서 HTML로 변환하여 비동기적으로 가져옵니다.
 * @param {string} gameId - 가져올 게임의 ID
 * @returns {Promise<string>} HTML로 변환된 게임 설명
 */
export async function getGameDescription(gameId) {
  const gameConfig = getGameConfig(gameId);
  if (!gameConfig) {
    return `<h2>Game Not Found</h2><p>Cannot find a game with ID "${gameId}".</p>`;
  }
  if (!gameConfig.description) {
    return `<h2>${gameConfig.name}</h2><p>No description available.</p>`;
  }
  try {
    const markdownContent = await gameConfig.description();
    return markdownToHtml(markdownContent);
  } catch (error) {
    console.error("Failed to load game description:", error);
    return `<h2>${gameConfig.name}</h2><p>Failed to load description.</p>`;
  }
}
