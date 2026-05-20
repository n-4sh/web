<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch } from "vue";
import { motion } from "motion-v";
import { lanyardData } from "@/services/lanyardService";
import { getAllPosts, formatDate } from "@/services/blogService";
import {
    getAllReposWithLanguages,
    getContributionData,
    buildFallbackContributionYear,
} from "@/services/githubService";
import { markReady } from "@/services/preloader";
import {
    CACHE_KEYS,
    readLocalCache,
    writeLocalCache,
} from "@/utils/apiLocalCache";
import {
    springs,
    staggerContainer,
    fadeUp,
} from "@/utils/motion";

import StatusSection from "@/components/StatusSection.vue";
import ProjectsGrid from "@/components/ProjectsGrid.vue";
import ListeningStatus from "@/components/ListeningStatus.vue";
import ContributionGraph from "@/components/ContributionGraph.vue";
import SiteFooter from "@/components/SiteFooter.vue";

const discordStatusColor = computed(() => lanyardData.discordStatusColor);
const spotify = computed(() => lanyardData.spotify);
const discordStatus = computed(() => lanyardData.discordStatus);
const discordUser = computed(() => lanyardData.discordUser);
const editorActivity = computed(() => lanyardData.editorActivity);
const gameActivity = computed(() => lanyardData.gameActivity);
const isLoading = computed(() => lanyardData.isLoading);
const lanyardConnected = computed(() => lanyardData.isConnected);
const lanyardReconnecting = computed(() => lanyardData.isReconnecting);
const lanyardUnavailable = computed(() => lanyardData.presenceUnavailable);
const lanyardStalePresence = computed(() => lanyardData.usingCachedPresence);

const repos = ref([]);
const reposCached = readLocalCache(CACHE_KEYS.GITHUB_REPOS);
if (reposCached?.value?.length) {
    repos.value = reposCached.value;
    markReady("projects");
}
const reposLoading = ref(!repos.value.length);
const reposRevalidating = ref(false);

const contributions = ref([]);
const contribCached = readLocalCache(CACHE_KEYS.GITHUB_CONTRIBUTIONS);
if (contribCached?.value?.length) {
    contributions.value = contribCached.value;
    markReady("contributions");
}
const contributionsLoading = ref(!contributions.value.length);
const contributionsRevalidating = ref(false);
let ageRafId = null;
const lastTrack = ref(null);

const recentPosts = computed(() => getAllPosts().slice(0, 3));

watch(
    () => lanyardData.spotify,
    (spotifyNow) => {
        if (!spotifyNow?.track_id) return;
        if (lastTrack.value?.track_id === spotifyNow.track_id) return;
        lastTrack.value = {
            track_id: spotifyNow.track_id,
            song: spotifyNow.song,
            artist: spotifyNow.artist,
        };
    },
    { immediate: true },
);

const externalToFetch = [];
const pinnedOrder = [
    "strafist/wtf-code",
    "strafist/unfollowr",
    "strafist/discwipe",
];
const pinnedSet = new Set(pinnedOrder);

const displayedRepos = computed(() => {
    if (!repos.value.length) return [];

    const pinned = pinnedOrder
        .map(name => repos.value.find(r => r.full_name === name))
        .filter(Boolean);

    if (pinned.length) return pinned;

    return repos.value
        .slice()
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 6);
});

const fetchProjects = async () => {
    const firstPaint = repos.value.length === 0;
    if (firstPaint) reposLoading.value = true;
    reposRevalidating.value = !firstPaint;
    try {
        const [{ repos: ownRepos }, ...pinnedResults] = await Promise.all([
            getAllReposWithLanguages(),
            ...externalToFetch.map((r) =>
                fetch(`https://api.github.com/repos/${r}`)
                    .then((res) => (res.ok ? res.json() : null))
                    .catch(() => null),
            ),
        ]);
        const pinned = pinnedResults.filter(Boolean);
        repos.value = [...pinned, ...ownRepos];
        writeLocalCache(CACHE_KEYS.GITHUB_REPOS, repos.value);
    } catch (error) {
        if (import.meta.env.DEV) console.error("Failed to load repositories:", error);
        if (!repos.value.length) repos.value = [];
    } finally {
        reposLoading.value = false;
        reposRevalidating.value = false;
        markReady("projects");
    }
};

const fetchContributions = async () => {
    const firstPaint = contributions.value.length === 0;
    if (firstPaint) contributionsLoading.value = true;
    contributionsRevalidating.value = !firstPaint;
    try {
        const data = await getContributionData();
        contributions.value = data;
        writeLocalCache(CACHE_KEYS.GITHUB_CONTRIBUTIONS, data);
    } catch (error) {
        if (import.meta.env.DEV) console.error("Failed to load contribution data:", error);
        if (!contributions.value.length) {
            contributions.value = buildFallbackContributionYear();
        }
    } finally {
        contributionsLoading.value = false;
        contributionsRevalidating.value = false;
        markReady("contributions");
    }
};

onMounted(() => {
    fetchProjects();
    fetchContributions();
    const tickAge = () => {
        updateAge();
        ageRafId = requestAnimationFrame(tickAge);
    };
    tickAge();
    window.addEventListener("scroll", onHeroScroll, { passive: true });
});

onBeforeUnmount(() => {
    if (ageRafId) cancelAnimationFrame(ageRafId);
    window.removeEventListener("scroll", onHeroScroll);
    if (heroRaf) cancelAnimationFrame(heroRaf);
});

// Store birthday in UTC for smooth age updates without extra date formatting.
const BIRTH_DATE_UTC = Date.UTC(2004, 9, 7, 0, 0, 0);
const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

const currentAge = ref(0);

const updateAge = () => {
    currentAge.value = (Date.now() - BIRTH_DATE_UTC) / MS_PER_YEAR;
};

const heroContainer = staggerContainer(0.08);

// Scroll-driven hero fade
const heroOpacity = ref(1);
const heroOffset = ref(0);
let heroRaf = null;

const onHeroScroll = () => {
    if (heroRaf) return;
    heroRaf = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const threshold = 300;
        const progress = Math.min(scrollY / threshold, 1);
        heroOpacity.value = 1 - progress * 0.6;
        heroOffset.value = -progress * 16;
        heroRaf = null;
    });
};

</script>

<template>
    <div class="w-full min-h-screen">
        <div class="max-w-3xl mx-auto px-6 sm:px-8 py-16 md:py-24">

            <!-- Hero -->
            <motion.div
                class="mb-16"
                :variants="heroContainer"
                initial="hidden"
                animate="visible"
                :style="{ opacity: heroOpacity }"
            >
                <motion.h1
                    :variants="fadeUp"
                    class="font-serif text-4xl md:text-5xl font-semibold text-catppuccin-text tracking-tight"
                >
                    Andrew Fuentes
                </motion.h1>
                <motion.p
                    :variants="fadeUp"
                    class="text-catppuccin-subtle mt-2 text-sm"
                >
                        systems engineer · costa rica
                </motion.p>

                <!-- Nav links -->
                <motion.nav
                    :variants="fadeUp"
                    class="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"
                >
                    <router-link
                        to="/blog"
                        class="text-catppuccin-subtle hover:text-catppuccin-text transition-colors link-underline"
                    >
                        blog
                    </router-link>
                    <router-link
                        to="/projects"
                        class="text-catppuccin-subtle hover:text-catppuccin-text transition-colors link-underline"
                    >
                        projects
                    </router-link>
                    <router-link
                        to="/now"
                        class="text-catppuccin-subtle hover:text-catppuccin-text transition-colors link-underline"
                    >
                        now
                    </router-link>
                    <router-link
                        to="/uses"
                        class="text-catppuccin-subtle hover:text-catppuccin-text transition-colors link-underline"
                    >
                        uses
                    </router-link>
                    <span class="text-catppuccin-surface">·</span>
                    <a
                        href="https://github.com/strafist"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-catppuccin-subtle hover:text-catppuccin-text transition-colors link-underline"
                    >
                        github
                    </a>
                </motion.nav>
            </motion.div>

            <!-- About -->
            <motion.div
                class="mb-6"
                :initial="{ opacity: 0, y: 10 }"
                :animate="{ opacity: 1, y: 0 }"
                :transition="{ type: 'spring', stiffness: 200, damping: 20, delay: 0.3 }"
            >
                <div class="section-label mb-2">about</div>
                <p class="text-catppuccin-text leading-relaxed">
                    <span class="text-catppuccin-mauve font-medium" style="font-variant-numeric: tabular-nums">{{ currentAge.toFixed(10) }}</span> years old.
                    building things and learning along the way.
                    code, coffee, and learning.
                </p>
            </motion.div>

            <!-- Divider -->
            <div class="hr-zen mb-6"></div>

            <!-- Status -->
            <StatusSection
                :isLoading="isLoading"
                :isConnected="lanyardConnected"
                :isReconnecting="lanyardReconnecting"
                :presenceUnavailable="lanyardUnavailable"
                :usingCachedPresence="lanyardStalePresence"
                :discordUser="discordUser"
                :discordStatus="discordStatus"
                :discordStatusColor="discordStatusColor"
                :spotify="spotify"
                :editorActivity="editorActivity"
                :gameActivity="gameActivity"
            />

            <!-- Tools -->
            <motion.div
                class="mb-6"
                :initial="{ opacity: 0, y: 10 }"
                :animate="{ opacity: 1, y: 0 }"
                :transition="{ type: 'spring', stiffness: 200, damping: 20, delay: 0.5 }"
            >
                <div class="section-label mb-2">tools</div>
                <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-catppuccin-subtle">
                    <span>nextjs</span>
                    <span>tailwind</span>
                    <span>bun</span>
                    <span>pnpm</span>
                    <span>docker</span>
                    <span>git</span>
                </div>
            </motion.div>

            <!-- Experience -->
            <motion.div
                class="mb-6"
                :initial="{ opacity: 0, y: 10 }"
                :animate="{ opacity: 1, y: 0 }"
                :transition="{ type: 'spring', stiffness: 200, damping: 20, delay: 0.6 }"
            >
                <div class="section-label mb-3">experience</div>
                <div class="space-y-4 text-sm">
                    <div>
                        <div class="flex items-center justify-between gap-3">
                            <span class="text-catppuccin-text font-medium">Euxora</span>
                            <span class="text-xs text-catppuccin-subtle">sep 2025 – present</span>
                        </div>
                        <div class="text-xs text-catppuccin-subtle/80">full stack developer</div>
                        <p class="text-xs text-catppuccin-subtle mt-2">
                            build and launch custom web apps and saas products, own architecture and delivery, and iterate fast on internal tools.
                        </p>
                    </div>

                    <div>
                        <div class="flex items-center justify-between gap-3">
                            <span class="text-catppuccin-text font-medium">Tridnio</span>
                            <span class="text-xs text-catppuccin-subtle">feb 2025 – jan 2026</span>
                        </div>
                        <div class="text-xs text-catppuccin-subtle/80">frontend developer</div>
                        <p class="text-xs text-catppuccin-subtle mt-2">
                            shipped static client sites with strong performance, seo, and accessibility, translating client goals into reliable delivery.
                        </p>
                    </div>

                    <div>
                        <div class="flex items-center justify-between gap-3">
                            <span class="text-catppuccin-text font-medium">Alma Creativa</span>
                            <span class="text-xs text-catppuccin-subtle">oct 2022 – sep 2024</span>
                        </div>
                        <div class="text-xs text-catppuccin-subtle/80">frontend developer</div>
                        <p class="text-xs text-catppuccin-subtle mt-2">
                            built wordpress sites, integrated crm + marketing tools, and delivered responsive landing pages with performance gains.
                        </p>
                    </div>
                </div>
            </motion.div>

            <!-- Divider -->
            <div class="hr-zen mb-6"></div>

            <!-- Projects & Listening -->
            <div class="grid lg:grid-cols-2 gap-8 lg:gap-10">
                <ProjectsGrid
                    :repos="displayedRepos"
                    :loading="reposLoading"
                    :revalidating="reposRevalidating"
                />

                <div class="space-y-8">
                    <ListeningStatus
                        :spotify="spotify"
                        :loading="isLoading && !spotify"
                        :lastTrack="lastTrack"
                    />

                    <motion.div
                        :whileInView="{ opacity: 1, y: 0 }"
                        :initial="{ opacity: 0, y: 10 }"
                        :transition="springs.gentle"
                        :inViewOptions="{ once: true }"
                    >
                        <div class="flex items-center justify-between gap-2 mb-4">
                            <div class="section-label">recent writing</div>
                            <router-link
                                v-if="recentPosts.length"
                                to="/blog"
                                class="text-xs text-catppuccin-subtle hover:text-catppuccin-mauve transition-colors flex-shrink-0"
                            >
                                all posts <span class="arrow-drift">→</span>
                            </router-link>
                        </div>

                        <div v-if="!recentPosts.length" class="text-sm text-catppuccin-subtle">
                            no posts yet
                        </div>

                        <div v-else>
                            <router-link
                                v-for="post in recentPosts"
                                :key="post.slug"
                                :to="{ path: '/blog', query: { post: post.slug } }"
                                class="group block py-3 border-b border-catppuccin-surface/30 last:border-0"
                            >
                                <div class="flex items-center justify-between gap-3">
                                    <span class="text-catppuccin-text group-hover:text-catppuccin-mauve transition-colors truncate text-sm">
                                        {{ post.title }}
                                    </span>
                                    <span class="text-xs text-catppuccin-subtle flex-shrink-0">
                                        {{ formatDate(post.date) }}
                                    </span>
                                </div>
                                <p class="text-xs text-catppuccin-subtle mt-0.5 truncate">
                                    {{ post.excerpt || '—' }}
                                </p>
                            </router-link>
                        </div>
                    </motion.div>
                </div>
            </div>

            <!-- Contribution graph -->
            <ContributionGraph
                :contributions="contributions"
                :loading="contributionsLoading"
                :revalidating="contributionsRevalidating"
            />

            <SiteFooter />
        </div>
    </div>
</template>
