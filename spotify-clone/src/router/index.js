import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SearchView from '../views/SearchView.vue'
import LibraryView from '../views/LibraryView.vue'
import CallbackView from '../views/CallbackView.vue'
import LoginView from '../views/LoginView.vue'
import AlbumView from '../views/AlbumView.vue'
import CategoryView from '../views/CategoryView.vue'
import PlaylistView from '../views/PlaylistView.vue'
import TrackView from '../views/TrackView.vue'
import ArtistView from '../views/ArtistView.vue'
import { useAuthStore } from '../stores/auth'
import { getStoredToken } from '../services/spotifyAuth'  // Correct import

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: HomeView,
      meta: { requiresAuth: true }
    },
    {
      path: '/search',
      component: SearchView,
      meta: { requiresAuth: true }
    },
    {
      path: '/library',
      component: LibraryView,
      meta: { requiresAuth: true }
    },
    {
      path: '/callback',
      component: CallbackView
    },
    {
      path: '/login',
      component: LoginView,
      meta: { requiresAuth: false }
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/album/:id',
      name: 'Album',
      component: AlbumView,
      meta: { requiresAuth: true }
    },
    {
      path: '/artist/:id',
      name: 'Artist',
      component: ArtistView,
      meta: { requiresAuth: true }
    },
    {
      path: '/category/:id',
      name: 'category',
      component: CategoryView,
      meta: { requiresAuth: true }
    },
    {
      path: '/playlist/:id',
      name: 'playlist',
      component: PlaylistView,
      meta: { requiresAuth: true }
    },
    {
      path: '/track/:id',
      name: 'track',
      component: TrackView,
      meta: { requiresAuth: true }
}
  ]
})

router.beforeEach((to) => {
  const isAuthenticated = !!getStoredToken();
  console.log("isAuthenticated = ",isAuthenticated);
  console.log("to.meta.requiresAuth = ",to.meta.requiresAuth);
  if (to.meta.requiresAuth && (isAuthenticated==false)) {
    console.log("hadchi tdar");
    return '/login';
  }
});


export default router