<template>
        <div
            v-if="randColor.color"
            :style="`background-color: ${randColor.color};`"
            class="
                contrast-[2] 
                brightness-[0.87] 
                rounded-xl 
                aspect-square 
                relative 
                overflow-hidden
            cursor-pointer
            "
        @click="goToCategory(id)"
        >
            <div class="text-white pt-3 pl-4 font-semibold text-[23px]">{{ category }}</div>
            <img
                class="
                    absolute 
                    contrast-[0.55]
                    -right-3.5 
                    bottom-0 
                    max-w-[100px] 
                    rotate-[20deg]
                "
                :src="image || ''"
            >
        </div>
</template>

<script setup>
import { ref, toRefs } from 'vue'
import uniqolor from 'uniqolor';
import { useRouter } from 'vue-router';

const router = useRouter();

const randColor = ref('')
randColor.value = uniqolor.random()

const props = defineProps({ 
  category: String, 
  image: String, 
  id: String 
})
const { category, id } = toRefs(props)

const goToCategory = (categoryId) => {
  console.log('Navigating to category:', categoryId); // Debug log
  router.push(`/category/${categoryId}`);
};
</script>

