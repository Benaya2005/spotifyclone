<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { exchangeCodeForToken, setAuthToken } from '../services/spotifyAuth';

const router = useRouter();

onMounted(async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (code) {
        try {
            const accessToken = await exchangeCodeForToken(code);
            setAuthToken(accessToken);  // Store the token
            window.location.href = '/'; // Redirect to the homepage or any other page
        } catch (error) {
            console.error('Error during token exchange:', error);
        }
    } else {
        console.error('No authorization code found.');
        window.location.href = '/login';  // Redirect to login if no code found
    }
});
</script>

<template>
  <div class="auth-processing">
    <p>Completing authentication...</p>
  </div>
</template>

<style>
.auth-processing {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
</style>