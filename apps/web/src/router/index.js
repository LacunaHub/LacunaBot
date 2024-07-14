import { route } from 'quasar/wrappers'
import { createMemoryHistory, createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import routes from './routes'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route(function (/* { store, ssrContext } */) {
    const createHistory = process.env.SERVER
        ? createMemoryHistory
        : process.env.VUE_ROUTER_MODE === 'history'
          ? createWebHistory
          : createWebHashHistory

    const Router = createRouter({
        scrollBehavior: () => ({ left: 0, top: 0 }),
        routes,

        // Leave this as is and make changes in quasar.conf.js instead!
        // quasar.conf.js -> build -> vueRouterMode
        // quasar.conf.js -> build -> publicPath
        history: createHistory(process.env.VUE_ROUTER_BASE),

        scrollBehavior(to, from, savedPosition) {
            // Exists when Browser's back/forward pressed
            if (savedPosition) {
                return savedPosition
                // For anchors
            } else if (to.hash) {
                return { selector: to.hash }
                // By changing queries we are still in the same component,
                // so "from.path" === "to.path" (new query changes just "to.fullPath", but not "to.path").
            } else if (from.path === to.path) {
                return {}
            }

            // Scroll to top
            return { x: 0, y: 0 }
        }
    })

    return Router
})
