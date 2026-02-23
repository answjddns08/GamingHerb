/**
 * @file HD2DGame/multi.js
 * @description 멀티플레이어 관련 기능 구현
 */

import { useSocketStore } from "@/stores/socket";
import { useUserStore } from "@/stores/user.js";
import { wsh } from "globals";

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
   * @type {(myTeam: string|null, opponentTeam: string|null, done: boolean) => void | null}
   */
  let teamSelectedCallback = null;

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
   *  팀 선택 핸들러
   * @param {object} payload
   * @param {string} [payload.team] - 상대가 선택한 팀 (done=false일 때)
   * @param {Object<string, string>} [payload.teams] - 모든 플레이어의 팀 매핑 (done=true일 때)
   * @param {boolean} payload.done - 팀 선택이 완료되었는지 여부
   */
  function oppositeTeamSelected(payload) {
    if (!teamSelectedCallback) return;

    if (payload.done) {
      // 모두 선택 완료: teams 객체에서 자신과 상대 팀 찾기
      const myTeam = payload.teams[userStore.id];
      const opponentTeam = Object.entries(payload.teams).find(([id]) => id !== userStore.id)?.[1];

      teamSelectedCallback(myTeam, opponentTeam, true);
    } else {
      // 상대만 선택: 상대 팀만 전달
      teamSelectedCallback(null, payload.team, false);
    }
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

  function giveUp() {
    SendGameAction("game:surrender");
  }

  /**
   * 팀 선택 콜백 등록
   * @param {(myTeam: string|null, opponentTeam: string|null, done: boolean) => void} callback
   * - myTeam: 내 팀 (done=true일 때만 유효)
   * - opponentTeam: 상대 팀
   * - done: 모두 선택 완료 여부
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
    giveUp,
  };
}

export default useMulti;
