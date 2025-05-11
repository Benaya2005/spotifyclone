import { defineStore } from 'pinia';
import { spotifyApi, setAuthToken, getStoredToken, logout as spotifyLogout } from '../services/spotifyAuth';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    user: null,
    isAuthenticated: false,
  }),
  actions: {
    async initialize() {
      const token = getStoredToken();
      if (token) {
        this.token = token;
        spotifyApi.setAccessToken(token);
        await this.fetchUser();
        this.isAuthenticated = true;
      }
    },
    async fetchUser() {
      try {
        const user = await spotifyApi.getMe();
        this.user = user;
      } catch (error) {
        console.error('Error fetching user:', error);
        this.logout();
      }
    },
    setToken(token) {
      this.token = token;
      setAuthToken(token);
      this.isAuthenticated = true;
      this.fetchUser();
    },
    logout() {
      spotifyLogout();
      this.token = null;
      this.user = null;
      this.isAuthenticated = false;
    },
  },
  persist: true,
});