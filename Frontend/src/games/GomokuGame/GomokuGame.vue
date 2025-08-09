<template>
  <main class="layout">
    <div class="status-container">
      <h2>Status</h2>
      <!-- Status content goes here -->
    </div>
    <div class="enemy-info">
      <h2>Enemy Info</h2>
      <!-- Enemy info content goes here -->
    </div>
    <div class="board">
      <div class="board-container">
        <tbody class="display">
          <tr v-for="row in 15" :key="row">
            <td v-for="col in 15" :key="col"></td>
          </tr>
        </tbody>
        <tbody class="interaction">
          <tr v-for="row in 16" :key="`interaction-row-${row}`">
            <td v-for="col in 16" :key="`interaction-col-${col}`" class="cell"></td>
          </tr>
        </tbody>
      </div>
    </div>
    <div class="player-info">
      <h2>Player Info</h2>
      <!-- Player info content goes here -->
    </div>
    <div class="chat-container">
      <h2>Chat</h2>
      <!-- Chat content goes here -->
    </div>
  </main>
</template>

<script setup></script>

<style scoped>
.layout {
  display: grid;

  width: 100%;
  height: 100vh;

  gap: 10px;

  grid-template-areas:
    ". enemy-info chat"
    "status gomoku chat"
    ". player-info chat";
}

.status-container {
  grid-area: status;
  background-color: lightgray;
}

.enemy-info {
  grid-area: enemy-info;

  background-color: lightgray;
}

.player-info {
  grid-area: player-info;

  background-color: lightgray;
}

.chat-container {
  grid-area: chat;
  background-color: lightgray;
}

.board {
  grid-area: gomoku;

  display: flex;
  justify-content: center;
  align-items: center;
}

.board-container {
  position: relative;
  background: #d4a574;
  padding: 30px;

  border-radius: 8px;

  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);

  border-collapse: collapse;
}

.display {
  border: 2px solid #333;
}

.display td {
  width: 40px;
  height: 40px;

  border: 1px solid #333;

  text-align: center;
  vertical-align: middle;
}

.interaction {
  position: absolute;
  top: 0%;
  left: 0%;
  width: 100%;
  height: 100%;

  padding: 10px;
}

.cell {
  width: 40px;
  height: 40px;
  text-align: center;
  vertical-align: middle;

  border-radius: 50%;

  cursor: pointer;
}

.cell:hover {
  background-color: #e0e0e0a1;
}
</style>
