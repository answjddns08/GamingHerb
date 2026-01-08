/**
 * @file ReversiGame/settings.js
 * @description 리버시 게임의 기본 설정을 정의합니다.
 *              현재 리버시는 별도 설정이 없지만, 향후 확장을 위해 파일을 유지합니다.
 */

/**
 * @type {Object} 리버시 게임의 설정 객체 (현재 비어 있음)
 */
export const gameSettings = {};

/**
 * @type {number} 리버시 게임의 최대 플레이어 수
 */
export const maxPlayers = 2;

// 호환성을 위한 default export
export default {
  settings: gameSettings,
  maxPlayers: maxPlayers,
};

