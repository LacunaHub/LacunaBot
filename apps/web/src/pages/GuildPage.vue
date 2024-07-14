<template>
  <q-page class="q-pa-md row justify-center items-start">
    <div id="guild-page-container" class="row">
      <div id="guild-summary" class="col-12 rounded-borders">
        <div class="row">
          <div class="col-12">
            <div v-if="pageLoading">
              <q-skeleton class="rounded-t-lg" type="rect" height="256px"></q-skeleton>
              <q-skeleton
                class="q-mx-lg rounded-circle guild-icon"
                type="circle"
                size="128px"
                :style="{ marginTop: '-64px' }"
              ></q-skeleton>
            </div>

            <div v-else>
              <q-img
                class="guild-splash rounded-t-lg border-bottom"
                :src="guild.splash_url"
                no-spinner
                no-transition
              ></q-img>

              <q-avatar class="q-mx-lg" size="128px" :style="{ marginTop: '-64px' }">
                <q-img
                  class="guild-icon rounded-circle"
                  :src="guild.icon_url"
                  :placeholder-src="getDefaultAvatarURL(guild.id)"
                  :error-src="getDefaultAvatarURL(guild.id)"
                  no-spinner
                  no-transition
                />
              </q-avatar>
            </div>
          </div>

          <div class="col-10 q-mt-md q-pl-lg">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-skeleton v-if="pageLoading" class="text-h4" type="text" width="50%"></q-skeleton>
                <span v-else class="text-h4">{{ guild.name }}</span>
              </div>

              <div v-if="guild.description" class="col-12">
                <span class="text--secondary">
                  {{ guild.description }}
                </span>
              </div>

              <div class="col-12">
                <div v-if="pageLoading">
                  <q-skeleton type="text" width="25%"></q-skeleton>
                </div>

                <div v-else>
                  <q-icon name="circle" color="positive"></q-icon>
                  <span class="q-ml-sm">
                    {{ $t('Pages.GuildPage.MembersOnline', { n: guild.approximate_presence_count }) }}
                  </span>

                  <q-icon class="q-ml-lg" name="circle" color="grey"></q-icon>
                  <span class="q-ml-sm">
                    {{ $t('Pages.GuildPage.MembersPlural', guild.approximate_members_count) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="col-2 q-pr-lg">
            <!-- <div class="row">
              <div class="col-12">
                <q-btn class="full-width" color="primary" push no-caps>Join</q-btn>
              </div>

              <div class="col-12 text-center cursor-help q-mt-md">
                <q-rating :model-value="4.7" size="sm" :max="5" readonly color="primary" icon-half="star_half">
                </q-rating>
                <q-tooltip
                  class="bg-black text-body2"
                  anchor="top middle"
                  self="bottom middle"
                  transition-show=""
                  transition-hide=""
                >
                  4.7 из 5
                </q-tooltip>
              </div>
            </div> -->
          </div>
        </div>
      </div>

      <div class="col-12 q-mt-md">
        <q-tabs
          class="bg-dark-2 rounded-borders bordered-block"
          no-caps
          active-class="nav-item--active"
          indicator-color="transparent"
          align="left"
        >
          <q-route-tab
            :to="`/guilds/${guildId}`"
            :label="$t('Common.Description')"
            :icon="`img:${editPenImg}`"
          ></q-route-tab>

          <q-route-tab
            :to="`/guilds/${guildId}/leaders`"
            :label="$t('Pages.GuildPage.Leaders.Leaderboard')"
            :icon="`img:${activitiesImg}`"
          ></q-route-tab>
        </q-tabs>
      </div>

      <div class="col-12 q-mt-md">
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
import activitiesImg from 'src/assets/activities.svg'
import editPenImg from 'src/assets/edit-pen.svg'
import { interfaces } from 'src/boot/axios'
import { getDefaultAvatarURL, handleAxiosError } from 'src/utils/Utils'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const $q = useQuasar(),
  route = useRoute(),
  router = useRouter()

const pageLoading = ref(true)
const guildId = route.params.guild_id,
  guild = ref({}),
  documentTitle = ref(null)

useMeta(() => {
  return {
    title: documentTitle.value,
    meta: {
      description: {
        name: 'description',
        content: 'About guild'
      },
      keywords: {
        name: 'keywords',
        content: 'guild, about guild, leaderboard'
      }
    }
  }
})

onMounted(async () => {
  try {
    const response = await interfaces.guilds.get(guildId)
    guild.value = response.data
    documentTitle.value = guild.value.name

    pageLoading.value = false
  } catch (err) {
    if (err.response?.status >= 400 || err.response?.status <= 499) {
      const { status } = err.response

      if (status === 401) {
        router.push('/auth')
      } else if (status === 403) {
        router.push('/forbidden')
      } else {
        router.push('/not-found')
      }
    } else {
      const error = handleAxiosError(err)

      $q.notify({
        message: error.message,
        classes: 'q-notification-custom',
        color: 'black',
        icon: 'error',
        iconColor: 'negative',
        timeout: 5000
      })
    }
  }
})
</script>

<style lang="scss" scoped>
#guild-page-container {
  @media (max-width: $breakpoint-md-max) {
    max-width: 100%;
    min-width: 100%;
  }

  max-width: 65%;
  min-width: 65%;
}

#guild-summary {
  border: 1px solid $dark-3;
  padding-bottom: 24px;
}

.guild-icon {
  border: 6px solid $dark-2;
}

.guild-splash {
  height: 256px;
  background-color: #16151a;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 800 800'%3E%3Cg fill='none' stroke='%23201E25' stroke-width='1'%3E%3Cpath d='M769 229L1037 260.9M927 880L731 737 520 660 309 538 40 599 295 764 126.5 879.5 40 599-197 493 102 382-31 229 126.5 79.5-69-63'/%3E%3Cpath d='M-31 229L237 261 390 382 603 493 308.5 537.5 101.5 381.5M370 905L295 764'/%3E%3Cpath d='M520 660L578 842 731 737 840 599 603 493 520 660 295 764 309 538 390 382 539 269 769 229 577.5 41.5 370 105 295 -36 126.5 79.5 237 261 102 382 40 599 -69 737 127 880'/%3E%3Cpath d='M520-140L578.5 42.5 731-63M603 493L539 269 237 261 370 105M902 382L539 269M390 382L102 382'/%3E%3Cpath d='M-222 42L126.5 79.5 370 105 539 269 577.5 41.5 927 80 769 229 902 382 603 493 731 737M295-36L577.5 41.5M578 842L295 764M40-201L127 80M102 382L-261 269'/%3E%3C/g%3E%3Cg fill='%23201E25'%3E%3Ccircle cx='769' cy='229' r='5'/%3E%3Ccircle cx='539' cy='269' r='5'/%3E%3Ccircle cx='603' cy='493' r='5'/%3E%3Ccircle cx='731' cy='737' r='5'/%3E%3Ccircle cx='520' cy='660' r='5'/%3E%3Ccircle cx='309' cy='538' r='5'/%3E%3Ccircle cx='295' cy='764' r='5'/%3E%3Ccircle cx='40' cy='599' r='5'/%3E%3Ccircle cx='102' cy='382' r='5'/%3E%3Ccircle cx='127' cy='80' r='5'/%3E%3Ccircle cx='370' cy='105' r='5'/%3E%3Ccircle cx='578' cy='42' r='5'/%3E%3Ccircle cx='237' cy='261' r='5'/%3E%3Ccircle cx='390' cy='382' r='5'/%3E%3C/g%3E%3C/svg%3E");
}

.nav-item--active {
  color: white;
  background: $dark-3;
}
</style>
