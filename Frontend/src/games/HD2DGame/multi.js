/**
 * @file HD2DGame/multi.js
 * @description 멀티플레이어 관련 기능 구현
 */

import { useSocketStore } from "@/stores/socket";
import { useUserStore } from "@/stores/user.js";

function useMulti() {
  const socketStore = useSocketStore();
  const userStore = useUserStore();
  /**
   * @type {String|null} 현재 게임 ID
   */
  let gameId = null;
  /**
   * @type {String|null} 방 ID
   */
  let roomName = null;

  /**
   * @type {Function|null} 팀 선택 후 실행할 콜백 함수
   * @param {string} teamName - 선택된 팀 이름
   */
  let teamSelectedCallback = null; // 팀 선택 후 실행할 콜백 함수

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

  function registerHandlers() {
    socketStore.registerHandler("game:selectTeam", oppositeTeamSelected);
  }

  function unregisterHandlers() {
    socketStore.unregisterHandler("game:selectTeam", oppositeTeamSelected);
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
   */
  function oppositeTeamSelected(payload) {
    teamSelectedCallback && teamSelectedCallback(payload.selectedTeams);
  }

  /**
   *
   * @param {Function<string>} callback - 팀 선택 후 실행할 콜백 함수
   */
  function setTeamSelectedCallback(callback) {
    teamSelectedCallback = callback;
  }

  return {
    registerHandlers,
    unregisterHandlers,
    SendGameAction,
    getIDs,
    setTeamSelectedCallback,
  };
}

export default useMulti;
