<template>
  <q-page padding class="row justify-center items-start">
    <div v-if="pageLoading" class="absolute-center">
      <q-spinner-tail color="white" size="64px"></q-spinner-tail>
    </div>

    <transition enter-active-class="animated fadeInUp" leave-active-class="animated fadeOutDown" appear>
      <div v-if="!pageLoading" class="row full-width" style="max-width: 720px">
        <div class="col-12 q-mb-md">
          <div class="shadow-2 rounded-lg">
            <q-toolbar class="bg-dark-grey-2 q-py-sm rounded-t-lg">
              <q-item-section avatar>
                <q-avatar>
                  <img :src="user.avatarURL" alt="User Avatar" />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label>{{ user.tag }}</q-item-label>
              </q-item-section>
            </q-toolbar>

            <q-tabs class="bg-dark-grey-2 rounded-b-lg" no-caps align="left">
              <q-route-tab to="/@me" :label="$t('pages.dashboard.profile')"></q-route-tab>
              <q-route-tab to="/@me/guilds" :label="$t('pages.dashboard.my_guilds')"></q-route-tab>
              <q-route-tab to="/@me/bills" :label="$t('pages.dashboard.bills')"></q-route-tab>
            </q-tabs>
          </div>
        </div>

        <div class="col-12">
          <router-view v-slot="{ Component }">
            <transition enter-active-class="animated fadeInUp" leave-active-class="animated fadeOutDown" mode="out-in">
              <component :is="Component"></component>
            </transition>
          </router-view>
        </div>
      </div>
    </transition>
  </q-page>
</template>

<script>
import { interfaces } from 'src/boot/axios'
import { defineComponent, ref } from 'vue'
import { useUserStore } from 'src/stores/user'
import { useMeta } from 'quasar'

export default defineComponent({
  name: 'ProfilePage',

  setup() {
    const user = useUserStore()

    useMeta({
      title: 'My Profile'
    })

    return {
      user
    }
  },

  data() {
    return {
      pageLoading: true
    }
  },

  methods: {
    async getMe() {
      return interfaces.users
        .getMe()
        .then(response => {
          const { data } = response

          //this.user.refreshCookies(data.user)
          this.user.$patch({ _guilds: data.guilds, flags: data.user.flags })
        })
        .catch(err => {
          const { status } = err.response

          if (status === 401) this.$router.push({ path: '/authorize' })
        })
    }
  },

  async mounted() {
    await this.getMe()

    this.pageLoading = false
  }
})
</script>
