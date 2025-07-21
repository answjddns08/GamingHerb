export default {
  // 게임 관련 상수들
  BOARD_SIZE: 15,
  WIN_CONDITION: 5,

  /**
   * 솔로 모드 활성화 여부에 따른 플레이어 수 반환
   * @param {boolean} soloEnabled - 솔로 모드 활성화 여부
   * @returns {number} 플레이어 수 (솔로: 1, 멀티: 2)
   */
  getPlayerCount(soloEnabled = false) {
    return soloEnabled ? 1 : 2;
  },

  /**
   * 현재 설정을 기반으로 플레이어 수 반환
   * @returns {number} 현재 설정에 따른 플레이어 수
   */
  getCurrentPlayerCount() {
    return this.getPlayerCount(this.settings.soloEnabled);
  },

  /**
   * 게임 설정
   * @type {Object}
   * boolean → 토글 버튼
   * number  → 슬라이더
   */
  settings: {
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
  },
};
