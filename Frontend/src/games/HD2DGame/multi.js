/**
 * @file HD2DGame/multi.js
 * @description 멀티플레이어 관련 기능 구현
 */

import { useSocketStore } from "@/stores/socket";

function useMulti() {
  const socketStore = useSocketStore();
  /**
   * @type {String|null} 현재 게임 ID
   */
  let gameId = null;
  /**
   * @type {String|null} 방 ID
   */
  let roomId = null;

  /**
   * get game and room IDs from URL(w. props)
   * @param {string} game
   * @param {string} room
   */
  function getIDs(game, room) {
    gameId = game;
    roomId = room;
    console.log("게임 ID:", gameId, "방 ID:", roomId);
  }

  function registerHandlers() {
    socketStore.registerHandler("teamSelect", oppositeTeamSelected);
  }

  function unregisterHandlers() {
    socketStore.unregisterHandler("teamSelect", oppositeTeamSelected);
  }

  /**
   * 게임 관련 액션을 서버로 전송합니다.
   * @param {String} type - 액션 타입 (e.g., 'game:move')
   * @param {Object} [payload={}] - 액션에 필요한 추가 데이터
   */
  function SendGameAction(type, payload = {}) {
    socketStore.send("gameAction", { type, payload });
  }

  function oppositeTeamSelected(payload) {
    console.log("상대 팀 선택 완료:", payload);
  }

  return {
    registerHandlers,
    unregisterHandlers,
    SendGameAction,
    getIDs,
  };
}

export default useMulti;
