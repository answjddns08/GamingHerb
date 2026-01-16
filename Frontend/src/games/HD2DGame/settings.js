/**
 * @file HD2DGame/settings.js
 * @description HD2D 턴제 전략 게임의 기본 설정을 정의합니다.
 */

/**
 * @type {Object}
 * @property {boolean} timerEnabled - 타이머 사용 여부
 * @property {Object} turnTimeLimit - 턴당 제한 시간 설정
 * @property {number} turnTimeLimit.value - 제한 시간 (초)
 * @property {number} turnTimeLimit.min - 최소 설정 가능 시간
 * @property {number} turnTimeLimit.max - 최대 설정 가능 시간
 * @property {number} turnTimeLimit.step - 시간 조절 단위
 * @property {string} turnTimeLimit.unit - 시간 단위 표시
 * @property {boolean} allowSpectator - 관전 허용 여부
 * @property {string} teamMode - 팀 모드 ('1v1', '2v2')
 */
export const gameSettings = {
  timerEnabled: false, // 타이머 기능 비활성화 (추후 구현)
  turnTimeLimit: {
    // 턴당 시간 제한 (초)
    value: 60,
    min: 30,
    max: 180,
    step: 10,
    unit: "초",
  },
  allowSpectator: true, // 관전자 모드 활성화
  teamMode: "1v1", // 1대1 모드 (추후 2v2 추가 가능)
};

/**
 * @type {number} HD2D 게임의 최대 플레이어 수
 */
export const maxPlayers = 2;

// 호환성을 위한 default export
export default {
  settings: gameSettings,
  maxPlayers: maxPlayers,
};
