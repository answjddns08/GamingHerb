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
      path: "/games/:gameId/ready",
      name: "make-room",
      component: () => import("../views/MakeRoom.vue"),
      props: true,
    },
  ],
});

// 라우터 에러 핸들링 추가
router.onError((error) => {
  console.error("Router error:", error);
});

export default router;
