import { createRouter, createWebHistory } from "vue-router";
import { updateMeta } from "@/utils/seo";

const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/pages/Home.vue"),
    meta: {
      title: "Personal Website | andrewfuentes.dev",
      description: "Personal portfolio and creative space of Andrew Fuentes, showcasing projects, photography, and digital experiences.",
    },
  },
  {
    path: "/blog/:slug?",
    name: "Blog",
    component: () => import("@/pages/Blog.vue"),
    meta: {
      title: "Blog | andrewfuentes.dev",
      description: "Thoughts on code, tools, and random stuff.",
    },
  },
{
    path: "/projects",
    name: "Projects",
    component: () => import("@/pages/Projects.vue"),
    meta: {
      title: "Projects | andrewfuentes.dev",
      description: "Open source projects and experiments.",
    },
  },
  {
    path: "/now",
    name: "Now",
    component: () => import("@/pages/Now.vue"),
    meta: {
        title: "Now | andrewfuentes.dev",
        description: "What I'm currently working on.",
    },
  },
  {
    path: "/uses",
    name: "Uses",
    component: () => import("@/pages/Uses.vue"),
    meta: {
        title: "Uses | andrewfuentes.dev",
        description: "Tools, hardware, and software I use daily.",
    },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/pages/NotFound.vue"),
    meta: {
      title: "404 Not Found | andrewfuentes.dev",
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_, __, savedPosition) {
    return savedPosition || { top: 0 };
  },
});

router.beforeEach((to, _, next) => {
  updateMeta({
    title: to.meta.title,
    description: to.meta.description,
    url: `https://andrewfuentes.dev${to.path}`,
  });
  next();
});

export default router;
