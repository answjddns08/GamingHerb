export default {
  id: "AnotherTestGame",
  name: "또 다른 테스트 게임",
  shortDescription: "다양한 기능을 테스트할 수 있는 게임",
  minPlayers: 1,
  maxPlayers: 4,
  category: ["테스트"],
  platform: ["web(PC)", "mobile"],
  difficulty: "Beginner",
  estimatedTime: "5-15분",
  version: "1.0.0",
  author: "GamingHerb Team",

  // 게임 관련 상수들
  MAX_SCORE: 1000,
  SCORE_INCREMENT: 10,

  // 게임 설정
  settings: {
    soundEnabled: true,
    animationsEnabled: true,
    debugMode: true,
  },
};
