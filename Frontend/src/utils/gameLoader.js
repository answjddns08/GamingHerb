import gamesConfig from "../config/games.json";

/**
 * 게임 설정을 가져오는 함수
 * @returns {Object} 게임 설정 객체
 */
export function getGamesConfig() {
  return gamesConfig.games;
}

/**
 * 특정 게임의 정보를 가져오는 함수
 * @param {string} gameId - 게임 ID
 * @returns {Object|null} 게임 정보 또는 null
 */
export function getGameInfo(gameId) {
  return gamesConfig.games[gameId] || null;
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
