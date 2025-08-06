import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/games/:gameId",
      name: "game-rooms",
      component: () => import("../views/GameRooms.vue"),
      props: true,
    },
    {
      path: "/games/:gameId/room/:roomId",
      name: "waiting-room",
      component: () => import("../views/WaitingRoom.vue"),
      props: true,
    },
    {
      path: "/games/:gameId/newRoom",
      name: "make-room",
      component: () => import("../views/MakeRoom.vue"),
      props: true,
    },
    {
      // 게임 프론트 개발 & 테스트용 라우트(임시)
      path: "/gameTest",
      name: "game-test",
      component: () => import("../games/GomokuGame/GomokuGame.vue"),
      props: true,
    },
  ],
});

// 라우터 에러 핸들링 추가
router.onError((error) => {
  console.error("Router error:", error);
});

export default router;
