<template>
  <q-page class="q-pa-md row justify-center items-start">
    <div id="dashboard-page-container" class="row q-col-gutter-md">
      <div class="col-12">
        <div class="shadow-0 rounded-lg">
          <q-toolbar v-if="pageLoading" class="bg-dark-1 q-pa-md rounded-t-lg">
            <q-item-section avatar>
              <q-skeleton class="rounded-circle" type="QAvatar" />
            </q-item-section>

            <q-item-section>
              <q-item-label>
                <q-skeleton type="text" width="100px" />
              </q-item-label>
            </q-item-section>
          </q-toolbar>

          <q-toolbar v-else class="bg-dark-1 q-pa-md rounded-t-lg">
            <q-item-section avatar>
              <q-avatar size="48px">
                <img :src="user.avatarURL" alt="User Avatar" />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label>{{ user.name }}</q-item-label>
            </q-item-section>
          </q-toolbar>

          <q-tabs class="bg-dark-1 rounded-b-lg" no-caps align="left">
            <q-route-tab to="/@me" :label="$t('pages.dashboard.profile')"></q-route-tab>
            <q-route-tab to="/@me/guilds" :label="$t('pages.dashboard.my_guilds')"></q-route-tab>
            <q-route-tab to="/@me/bills" :label="$t('pages.dashboard.bills')"></q-route-tab>
          </q-tabs>
        </div>
      </div>

      <div class="col-12">
        <router-view v-slot="{ Component }">
          <transition enter-active-class="animated fadeInUp" leave-active-class="animated fadeOutDown" mode="out-in">
            <keep-alive>
              <component :is="Component" :parent-loading="pageLoading"></component>
            </keep-alive>
          </transition>
        </router-view>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { useMeta, useQuasar } from 'quasar'
import { interfaces } from 'src/boot/axios'
import { useUserStore } from 'src/stores/user'
import { handleAxiosError } from 'src/utils/Utils'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const $q = useQuasar(),
  router = useRouter()

const pageLoading = ref(true)
const user = useUserStore()

useMeta({
  title: 'My Profile',
  meta: {
    description: {
      name: 'description',
      content: 'Access your Lacuna Dashboard to manage your profile, view a list of Discord guilds connected to Lacuna.'
    },
    keywords: {
      name: 'keywords',
      content: 'my profile, discord guilds, bills, user activities'
    }
  }
})

const getMe = async () => {
  try {
    const response = await interfaces.users.getMe(),
      { data } = response

    user.$patch({ _guilds: data.guilds, flags: data.user.flags })

    return true
  } catch (err) {
    if (err.response?.status === 401) {
      await router.push({ path: '/authorize' })
    } else {
      const error = handleAxiosError(err)

      $q.notify({
        message: error.message,
        classes: 'rounded-lg q-notification-custom',
        color: 'black',
        icon: 'error',
        iconColor: 'negative',
        timeout: 5000
      })
    }
  }

  return false
}

onMounted(async () => {
  const getMeSuccess = await getMe()

  pageLoading.value = !getMeSuccess
})
</script>

<style lang="scss" scoped>
#dashboard-page-container {
  @media (max-width: $breakpoint-md-max) {
    max-width: 100%;
    min-width: 100%;
  }

  max-width: 50%;
  min-width: 50%;
}
</style>
