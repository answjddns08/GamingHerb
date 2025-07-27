/**
 * 게임 설정
 * @type {Object}
 * boolean → 토글 버튼
 * number  → 슬라이더
 */
export const gameSettings = {
  soloEnabled: false, // 솔로 모드 비활성화
  timerEnabled: false, // 타이머 기능 비활성화
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
 * 플레이 가능 사용자 수를 계산하는 함수
 * @returns {number} 현재 설정에 따른 플레이 가능 사용자 수
 */
export function getMaxPlayerCount() {
  return gameSettings.soloEnabled ? 1 : 2;
}

// 호환성을 위한 기본 export
export default {
  settings: gameSettings,
  getMaxPlayerCount,
};
