/**
 * @file GomokuGame/settings.js
 * @description 오목 게임의 기본 설정을 정의합니다.
 *              이 설정은 방 생성 시 기본값으로 사용되며, 유저가 값을 변경할 수 있습니다.
 */

/**
 * @type {Object}
 * @property {boolean} timerEnabled - 타이머 사용 여부 (현재 미사용)
 * @property {Object} playerTimeLimit - 플레이어당 제한 시간 설정
 * @property {number} playerTimeLimit.value - 제한 시간 (초)
 * @property {number} playerTimeLimit.min - 최소 설정 가능 시간
 * @property {number} playerTimeLimit.max - 최대 설정 가능 시간
 * @property {number} playerTimeLimit.step - 시간 조절 단위
 * @property {string} playerTimeLimit.unit - 시간 단위 표시
 * @property {boolean} allowSpectator - 관전 허용 여부
 */
export const gameSettings = {
  timerEnabled: true, // 타이머 기능 활성화
  playerTimeLimit: {
    // 플레이어당 시간 제한 (초)
    value: 60,
    min: 10,
    max: 300,
    step: 5,
    unit: "초",
  },
  allowSpectator: true, // 관전자 모드 활성화
};

/**
 * @type {number} 오목 게임의 최대 플레이어 수
 */
export const maxPlayers = 2;

// 호환성을 위한 default export
export default {
  settings: gameSettings,
  maxPlayers: maxPlayers,
};
