<script setup>
import { computed } from "vue";
import { motion } from "motion-v";
import { springs } from "@/utils/motion";

const props = defineProps({
    spotify: Object,
    loading: Boolean,
    lastTrack: Object,
});

const lastLabel = computed(() => (props.spotify ? "now" : "last"));
</script>

<template>
    <motion.div
        class="min-w-0"
        :whileInView="{ opacity: 1, y: 0 }"
        :initial="{ opacity: 0, y: 10 }"
        :transition="springs.gentle"
        :inViewOptions="{ once: true }"
    >
        <div class="flex items-center justify-between gap-2 mb-4">
            <div class="section-label">listening</div>
        </div>

        <div class="space-y-0">
            <div v-if="loading" class="space-y-3">
                <div class="py-2.5">
                    <div class="skeleton-pulse h-4 rounded bg-catppuccin-surface/40" style="width: 120px"></div>
                    <div class="skeleton-pulse h-3 rounded bg-catppuccin-surface/25 mt-1.5" style="width: 70%"></div>
                </div>
            </div>

            <a
                v-else-if="spotify || lastTrack"
                :href="`https://open.spotify.com/track/${(spotify || lastTrack).track_id}`"
                target="_blank"
                rel="noopener noreferrer"
                class="group block py-3 border-b border-catppuccin-surface/30"
            >
                <div class="flex items-center justify-between gap-3">
                    <span
                        class="text-catppuccin-text group-hover:text-catppuccin-mauve transition-colors truncate text-sm"
                        :title="(spotify || lastTrack).song"
                    >
                        {{ (spotify || lastTrack).song }}
                    </span>
                    <span class="text-catppuccin-green text-xs flex-shrink-0">{{ lastLabel }}</span>
                </div>
                <p
                    class="text-xs text-catppuccin-subtle mt-0.5 truncate"
                    :title="(spotify || lastTrack).artist"
                >
                    {{ (spotify || lastTrack).artist }}
                </p>
            </a>

            <div v-else class="text-sm text-catppuccin-subtle py-2">
                nothing playing
            </div>
        </div>
    </motion.div>
</template>

<style scoped>
.skeleton-pulse {
    animation: skeleton-shimmer 1.8s ease-in-out infinite;
}

@keyframes skeleton-shimmer {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.6; }
}
</style>
