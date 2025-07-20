export default {
  // 게임 관련 상수들
  BOARD_SIZE: 15,
  WIN_CONDITION: 5,

  Players: 2, // 플레이어 수(솔로 모드 활성화 시 1)

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
