/**
 * @file HD2DGame/multi.js
 * @description 멀티플레이어 관련 기능 구현
 */

import { useSocketStore } from "@/stores/socket";
import { useUserStore } from "@/stores/user.js";

function useMulti() {
  const socketStore = useSocketStore();
  const userStore = useUserStore();
  const DEFAULT_WS_URL = "wss://gamingherb.redeyes.dev/api";
  /**
   * @type {String|null} 현재 게임 ID
   */
  let gameId = null;
  /**
   * @type {String|null} 방 ID
   */
  let roomName = null;

  /**
   * @type {(teamName: string, done: boolean)|null} 팀 선택 후 실행할 콜백 함수
   */
  let teamSelectedCallback = null; // 팀 선택 후 실행할 콜백 함수

  /**
   * @type {(payload: object) => void | null} 턴 해석 결과 콜백
   */
  let turnResolvedCallback = null;

  /**
   * @type {(payload: object) => void | null} 재시작 요청 콜백
   */
  let restartRequestedCallback = null;

  /**
   * @type {(() => void) | null} 재시작 확정 콜백
   */
  let restartConfirmedCallback = null;

  /**
   * @type {(payload: object) => void | null} 상대방 나감 콜백
   */
  let opponentLeftCallback = null;

  /**
   * get game and room IDs from URL(w. props)
   * @param {string} game
   * @param {string} room
   */
  function getIDs(game, room) {
    gameId = game;
    roomName = room;
    console.log("게임 ID:", gameId, "방 ID:", roomName);
  }

  function ensureConnected(url = DEFAULT_WS_URL) {
    if (socketStore.isConnected) return Promise.resolve(true);

    socketStore.connect(url);

    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 50;
      const checkConnection = () => {
        if (socketStore.isConnected) {
          resolve(true);
          return;
        }
        attempts += 1;
        if (attempts >= maxAttempts) {
          resolve(false);
          return;
        }
        setTimeout(checkConnection, 100);
      };

      checkConnection();
    });
  }

  function registerHandlers() {
    socketStore.registerHandler("game:selectTeam", oppositeTeamSelected);
    socketStore.registerHandler("game:turnResolved", handleTurnResolved);
    socketStore.registerHandler("game:restartRequested", handleRestartRequested);
    socketStore.registerHandler("game:restartConfirmed", handleRestartConfirmed);
    socketStore.registerHandler("game:opponentLeft", handleOpponentLeft);
  }

  function unregisterHandlers() {
    socketStore.unregisterHandler("game:selectTeam", oppositeTeamSelected);
    socketStore.unregisterHandler("game:turnResolved", handleTurnResolved);
    socketStore.unregisterHandler("game:restartRequested", handleRestartRequested);
    socketStore.unregisterHandler("game:restartConfirmed", handleRestartConfirmed);
    socketStore.unregisterHandler("game:opponentLeft", handleOpponentLeft);
  }

  /**
   * 게임 관련 액션을 서버로 전송합니다.
   * @param {String} type - 액션 타입 (e.g., 'game:move')
   * @param {Object} [payload={}] - 액션에 필요한 추가 데이터
   */
  function SendGameAction(type, payload = {}) {
    socketStore.sendMessage("inGame", {
      gameId: gameId,
      roomName: roomName,
      userId: userStore.id,
      userName: userStore.name,
      action: { type, payload },
    });
  }

  /**
   *  상대 팀이 선택되었을 때 호출되는 핸들러
   * @param {object} payload
   * @param {string} payload.selectedTeams - 상대가 선택한 팀 이름
   * @param {boolean} [payload.done=false] - 팀 선택이 완료되었는지 여부
   */
  function oppositeTeamSelected(payload) {
    teamSelectedCallback && teamSelectedCallback(payload.selectedTeams, payload.done);
  }

  function handleTurnResolved(payload) {
    if (!turnResolvedCallback) return;
    turnResolvedCallback(payload);
  }

  function handleRestartRequested(payload) {
    if (!restartRequestedCallback) return;
    restartRequestedCallback(payload);
  }

  function handleRestartConfirmed() {
    if (!restartConfirmedCallback) return;
    restartConfirmedCallback();
  }

  function handleOpponentLeft(payload) {
    if (!opponentLeftCallback) return;
    opponentLeftCallback(payload);
  }

  /**
   *
   * @param {(teamName: string, done: boolean) => void} callback - 팀 선택 후 실행할 콜백 함수
   */
  function setTeamSelectedCallback(callback) {
    teamSelectedCallback = callback;
  }

  /**
   * @param {(payload: object) => void} callback
   */
  function setTurnResolvedCallback(callback) {
    turnResolvedCallback = callback;
  }

  /**
   * @param {(payload: object) => void} callback
   */
  function setRestartRequestedCallback(callback) {
    restartRequestedCallback = callback;
  }

  /**
   * @param {() => void} callback
   */
  function setRestartConfirmedCallback(callback) {
    restartConfirmedCallback = callback;
  }

  /**
   * @param {(payload: object) => void} callback
   */
  function setOpponentLeftCallback(callback) {
    opponentLeftCallback = callback;
  }

  return {
    registerHandlers,
    unregisterHandlers,
    SendGameAction,
    getIDs,
    ensureConnected,
    setTeamSelectedCallback,
    setTurnResolvedCallback,
    setRestartRequestedCallback,
    setRestartConfirmedCallback,
    setOpponentLeftCallback,
  };
}

export default useMulti;
