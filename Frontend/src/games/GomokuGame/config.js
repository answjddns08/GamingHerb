export default {
  id: "GomokuGame",
  name: "오목 게임",
  shortDescription: "5개의 돌을 연속으로 놓아 승리하는 게임",
  minPlayers: 2,
  maxPlayers: 2,
  category: ["보드게임"],
  platform: ["web(PC)", "mobile"],
  difficulty: "Easy",
  estimatedTime: "10-30분",
  version: "1.0.0",
  author: "GamingHerb Team",

  // 게임 관련 상수들
  BOARD_SIZE: 15,
  WIN_CONDITION: 5,

  // 게임 설정
  settings: {
    allowUndo: true,
    timerEnabled: false,
    spectatorMode: true,
  },
};
