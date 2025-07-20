import gamesConfig from "../config/games.json";
import { markdownToHtml } from "./markdownConvert";

/**
 * Game Object
 * @typedef {Object} Game
 * @property {string} name - 게임 이름
 * @property {string} summary - 게임 설명
 * @property {string} path - 게임 컴포넌트 경로
 * @property {string} desPath - 게임 설명 경로
 * @property {string} configPath - 게임 설정 경로
 * @property {Array<string>} categories - 게임 카테고리
 * @property {Array<string>} platforms - 게임 플랫폼
 * @property {string} difficulty - 게임 난이도
 * @property {string} estimatedTime - 걸리는 시간
 * @property {string} author - 게임 제작자
 * @property {string} version - 게임 버전
 */

/**
 * 특정 게임의 정보를 가져오는 함수
 * @param {string} gameId - 게임 ID
 * @returns {Game|null} 게임 정보 또는 null
 */
export function getGameInfo(gameId) {
  return gamesConfig.games[gameId] || null;
}

/**
 * 특정 게임의 설정을 가져오는 함수
 * @param {string} gameId - 게임 ID
 * @returns {Promise<Object>} 게임 설정 객체
 */
export async function getGameConfig(gameId) {
  const gameInfo = getGameInfo(gameId);
  if (!gameInfo || !gameInfo.configPath) {
    throw new Error(`게임 ID "${gameId}"에 해당하는 설정을 찾을 수 없습니다.`);
  }
  try {
    const configModule = await import(/* @vite-ignore */ gameInfo.configPath);
    return configModule.default;
  } catch (error) {
    throw new Error(`게임 설정 로드 실패: ${error.message}`);
  }
}

/**
 * 특정 게임의 설명을 가져오는 함수
 * @param {string} gameId - 게임 ID
 * @returns {Promise<string>} 게임 설명 HTML
 */
export async function getGameDescription(gameId) {
  const gameInfo = getGameInfo(gameId);

  const descriptionPath = gameInfo ? gameInfo.desPath : null;

  if (!descriptionPath) {
    throw new Error(`게임 ID "${gameId}"에 해당하는 설명을 찾을 수 없습니다.`);
  }

  try {
    const response = await fetch(descriptionPath);
    if (!response.ok) {
      throw new Error(`설명 파일 로드 실패: ${response.statusText}`);
    }
    const markdown = await response.text();
    return markdownToHtml(markdown);
  } catch (error) {
    console.error("설명 파일 로드 실패:", error);
    return `<h2>${gameInfo.name} 게임 설명</h2>
      <p>게임 설명을 불러오는 데 실패했습니다. 나중에 다시 시도해주세요.</p>`;
  }
}

/**
 * 게임 컴포넌트를 동적으로 로드하는 함수
 * @param {string} gameId - 게임 ID
 * @returns {Promise<Object>} 게임 컴포넌트
 */
export async function loadGameComponent(gameId) {
  const gameInfo = getGameInfo(gameId);

  if (!gameInfo) {
    throw new Error(`게임 ID "${gameId}"에 해당하는 게임을 찾을 수 없습니다.`);
  }

  try {
    // 동적 import를 사용하여 게임 컴포넌트 로드
    const gameModule = await import(/* @vite-ignore */ gameInfo.path);
    return gameModule.default;
  } catch (error) {
    throw new Error(`게임 컴포넌트 로드 실패: ${error.message}`);
  }
}

/**
 * 사용 가능한 모든 게임 목록을 가져오는 함수
 * @returns {Array} 게임 목록
 */
export function getAvailableGames() {
  return Object.entries(gamesConfig.games).map(([id, info]) => ({
    id,
    ...info,
  }));
}

/**
 * 카테고리별 게임 목록을 가져오는 함수
 * @param {string} category - 게임 카테고리
 * @returns {Array} 해당 카테고리의 게임 목록
 */
export function getGamesByCategory(category) {
  return getAvailableGames().filter((game) => game.category === category);
}
