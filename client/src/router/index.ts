import { createRouter, createWebHistory } from 'vue-router'
import GameView from '../views/GameView.vue'
import LobbyView from '../views/LobbyView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'lobby',
      component: LobbyView
    },
    {
      path: '/game/player:id',
      name: 'game',
      component: GameView
    },
  ]
})

export default router
