<script setup lang="ts">

// This is replaced by Vite during the build process
const version = __APP_VERSION__ 
const reposetory = __APP_REPOSETORY__
const license = __APP_LICENSE__
</script>

<template>
    <footer class="w-screen bg-panel z-10 border-t-4 border-panel-d p-2 relative">
        <div class="flex flex-col justify-center items-center">
            <span>Webwatcher VueUi - Version {{ version }} - 🄯 {{ license }}</span>
            <span>For Source code and Documentation visite <a 
                class="text-info/80 hover:text-app/80 transition-all duration-200"
                :href="reposetory">
                    {{ reposetory.replace(/^https?:\/\/([^/]+)\/.*$/, '$1') }}
                </a>
            </span>
        </div>
        <p class="absolute bottom-0 right-0">&lt;3</p>
    </footer>
</template>

