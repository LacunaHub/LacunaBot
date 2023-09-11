<template>
  <q-page class="q-pa-md">
    <div v-if="pageLoading" class="absolute-center">
      <q-spinner-tail color="white" size="64px"></q-spinner-tail>
    </div>

    <transition enter-active-class="animated fadeInUp" leave-active-class="animated fadeOutDown" appear>
      <div v-if="!pageLoading" class="row q-col-gutter-md">
        <div class="col-12 col-md-3">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-card class="rounded-lg bg-dark-1" flat>
                <q-item class="q-pt-md">
                  <q-item-section avatar>
                    <q-avatar size="48px">
                      <img :src="guild.iconURL" alt="Guild Icon" />
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label>{{ guild.guild?.name ?? 'Unknown Guild Name' }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-card-section>
                  <q-btn
                    class="full-width"
                    color="primary"
                    push
                    :label="$t('save')"
                    @click="updateSettings"
                    :loading="updateSettingsLoading"
                    :disable="!isGuildChanged"
                  >
                    <template #loading>
                      <q-spinner-dots color="white"></q-spinner-dots>
                    </template>
                  </q-btn>
                </q-card-section>
              </q-card>
            </div>

            <div class="col-12 lt-md">
              <q-card class="rounded-lg bg-dark-1" flat>
                <q-list padding>
                  <q-item clickable v-ripple @click="openLacunaDiamondDialog">
                    <q-item-section>
                      <q-item-label class="text-subtitle1">
                        <span class="q-mr-xs">Lacuna Diamond</span>

                        <q-badge v-if="hasDiamondDiscount" color="primary">
                          <span>SALE</span>
                        </q-badge>
                      </q-item-label>
                    </q-item-section>

                    <q-item-section avatar side>
                      <q-avatar square size="24px">
                        <img src="~assets/lacuna-diamond.svg" />
                      </q-avatar>
                    </q-item-section>
                  </q-item>

                  <q-item
                    clickable
                    :to="`/guilds/${guildId}/sphere`"
                    active-class="nav-item--active"
                    v-ripple
                    style="display: none"
                  >
                    <q-item-section class="text-subtitle1">Lacuna Sphere</q-item-section>

                    <q-item-section avatar side>
                      <q-avatar square size="24px">
                        <img src="~assets/lacuna-sphere.svg" />
                      </q-avatar>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card>
            </div>

            <div class="col-12 lt-md">
              <q-tabs
                class="bg-dark-1 rounded-lg"
                no-caps
                active-class="nav-item--active"
                indicator-color="transparent"
              >
                <q-route-tab
                  v-for="item in navItems"
                  :key="item.path"
                  class="rounded-lg"
                  :to="`/guilds/${guildId}/${item.path}`"
                  :label="item.name"
                  :icon="`img:${item.icon}`"
                >
                  <q-badge v-if="item.new" color="primary" floating>
                    <span>NEW</span>
                  </q-badge>
                </q-route-tab>

                <q-route-tab
                  class="rounded-lg"
                  :to="`/guilds/${guildId}/settings/change-log`"
                  :label="$t('pages.guild.nav_names.CHANGE_LOG')"
                  :icon="`img:${editPenImg}`"
                ></q-route-tab>

                <q-tab
                  class="rounded-lg"
                  :label="$t('pages.guild.nav_names.DOWNLOAD_LOGS')"
                  :icon="`img:${logsImg}`"
                ></q-tab>
              </q-tabs>
            </div>

            <div class="col-12 gt-sm">
              <q-card class="rounded-lg bg-dark-1" flat>
                <q-list padding>
                  <q-item clickable v-ripple @click="openLacunaDiamondDialog">
                    <q-item-section>
                      <q-item-label class="text-subtitle1">
                        <span class="q-mr-xs">Lacuna Diamond</span>

                        <q-badge v-if="hasDiamondDiscount" color="primary">
                          <span>SALE</span>
                        </q-badge>
                      </q-item-label>
                    </q-item-section>

                    <q-item-section avatar side>
                      <q-avatar square size="24px">
                        <img src="~assets/lacuna-diamond.svg" />
                      </q-avatar>
                    </q-item-section>
                  </q-item>

                  <q-item
                    clickable
                    :to="`/guilds/${guildId}/sphere`"
                    active-class="nav-item--active"
                    v-ripple
                    style="display: none"
                  >
                    <q-item-section class="text-subtitle1">Lacuna Sphere</q-item-section>

                    <q-item-section avatar side>
                      <q-avatar square size="24px">
                        <img src="~assets/lacuna-sphere.svg" />
                      </q-avatar>
                    </q-item-section>
                  </q-item>
                </q-list>

                <q-separator inset></q-separator>

                <q-list padding>
                  <q-item
                    v-for="item in navItems"
                    :key="item.path"
                    clickable
                    :to="`/guilds/${guildId}/${item.path}`"
                    :active="$route.path.endsWith(item.path)"
                    active-class="nav-item--active"
                    v-ripple
                  >
                    <q-item-section>
                      <q-item-label class="text-subtitle1">
                        <span class="q-mr-xs">
                          {{ item.name }}
                        </span>

                        <q-badge v-if="item.new" color="primary">
                          <span>NEW</span>
                        </q-badge>
                      </q-item-label>
                    </q-item-section>

                    <q-item-section avatar side>
                      <q-avatar square size="24px">
                        <img :src="item.icon" :alt="item.name" />
                      </q-avatar>
                    </q-item-section>
                  </q-item>
                </q-list>

                <q-separator inset></q-separator>

                <q-list padding>
                  <q-item
                    clickable
                    :to="`/guilds/${guildId}/settings/change-log`"
                    active-class="nav-item--active"
                    v-ripple
                  >
                    <q-item-section class="text-subtitle1">
                      {{ $t('pages.guild.nav_names.CHANGE_LOG') }}
                    </q-item-section>

                    <q-item-section avatar side>
                      <q-avatar square size="24px">
                        <img src="~assets/edit-pen.svg" />
                      </q-avatar>
                    </q-item-section>
                  </q-item>

                  <q-item clickable active-class="nav-item--active" v-ripple @click="downloadLogs">
                    <q-item-section class="text-subtitle1">
                      {{ $t('pages.guild.nav_names.DOWNLOAD_LOGS') }}
                    </q-item-section>

                    <q-item-section avatar side>
                      <q-avatar square size="24px">
                        <img src="~assets/logs.svg" />
                      </q-avatar>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-9">
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

<script setup>
import { useMeta, useQuasar } from 'quasar'
import activitiesImg from 'src/assets/activities.svg'
import bellImg from 'src/assets/bell.svg'
import controlPanelImg from 'src/assets/control-panel.svg'
import editPenImg from 'src/assets/edit-pen.svg'
import karaokeImg from 'src/assets/karaoke.svg'
import layersImg from 'src/assets/layers.svg'
import logsImg from 'src/assets/logs.svg'
import shieldImg from 'src/assets/shield.svg'
import slashCommandImg from 'src/assets/slash-command.svg'
import { interfaces } from 'src/boot/axios'
import ChangeLog from 'src/components/dialogs/ChangeLog.vue'
import LacunaDiamond from 'src/components/dialogs/LacunaDiamond.vue'
import UserSurvey from 'src/components/dialogs/UserSurvey.vue'
import { useChangeLogStore } from 'src/stores/change-log'
import { useGuildStore } from 'src/stores/guild'
import { decimalToHex, objectDifferences } from 'src/utils/Utils'
import { computed, onMounted, ref, watch } from 'vue'
import { event } from 'vue-gtag'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'

const $q = useQuasar(),
  $route = useRoute(),
  $router = useRouter(),
  { t: $t } = useI18n()

const pageLoading = ref(true)
const guild = useGuildStore(),
  changeLog = useChangeLogStore()
const guildId = $route.params.guild_id,
  documentTitle = ref(null)
const freezedGuild = ref({}),
  isGuildChanged = ref(false),
  updateSettingsLoading = ref(false)

const guildClone = computed(() => {
    return JSON.parse(
      JSON.stringify({
        _id: guild._id,
        prefix: guild.prefix,
        locale: guild.locale,
        server: guild.server,
        commands: guild.commands,
        moderation: guild.moderation,
        modules: guild.modules
      })
    )
  }),
  hasDiamondDiscount = computed(() => {
    return guild.prices.some(i => Object.values(i.discounts).some(i => i !== 0))
  })

const navItems = [
  { name: $t('pages.guild.nav_names.GENERAL'), path: 'settings', icon: controlPanelImg },
  {
    name: $t('pages.guild.nav_names.COMMANDS'),
    path: 'settings/commands',
    icon: slashCommandImg
  },
  {
    name: $t('pages.guild.nav_names.MODERATION'),
    path: 'settings/moderation',
    icon: shieldImg
  },
  {
    name: $t('pages.guild.nav_names.ACTIVITIES'),
    path: 'settings/activities',
    icon: activitiesImg
  },
  {
    name: $t('pages.guild.nav_names.SUBSCRIPTIONS'),
    path: 'settings/subscriptions',
    icon: bellImg
  },
  {
    name: $t('pages.guild.nav_names.VOICE_CHANNELS'),
    path: 'settings/voice-channels',
    icon: karaokeImg
  },
  { name: $t('pages.guild.nav_names.UTILITY'), path: 'settings/utility', icon: layersImg, new: true }
]

useMeta(() => {
  return {
    title: documentTitle.value,
    meta: {
      description: {
        name: 'description',
        content:
          "Configure and customize Lacuna's settings for your guild. Explore a range of options and features to tailor the bot's behavior according to your server's needs."
      },
      keywords: {
        name: 'keywords',
        content: 'guild settings, bot configuration, customization, features'
      }
    }
  }
})

const getSettings = async () => {
  try {
    const response = await interfaces.guilds.getSettings(guildId),
      { data } = response

    guild.$patch(data)

    for (const role of guild.guild.roles) {
      role.color = `#${decimalToHex(role.color || 10593445)}`
    }
  } catch (err) {
    if (typeof err.response?.status === 'number') {
      const { status } = err.response

      if (status === 401) {
        $router.push('/authorize')
      }
      if (status === 403) {
        $router.push('/forbidden')
      }
      if (status === 400 || status === 404 || status === 406) {
        $router.push('/not-found')
      }
    } else {
      console.error(err)
      $q.notify({
        message: err.response?.data || err.toString(),
        classes: 'rounded-lg q-notification-custom',
        color: 'black',
        icon: 'error',
        iconColor: 'negative',
        timeout: 5000
      })
    }
  }

  return guild
}

const updateSettings = async () => {
  updateSettingsLoading.value = true
  const updateData = objectDifferences(guildClone.value, freezedGuild.value)

  try {
    const response = await interfaces.guilds.updateSettings(guildId, { data: updateData }),
      { data } = response

    guild.$patch({ ...data })
    setTimeout(() => {
      isGuildChanged.value = false
      freezedGuild.value = {}
    })
  } catch (err) {
    console.error(err)
    $q.notify({
      message: $t('pages.guild.save_error'),
      classes: 'rounded-lg q-notification-custom',
      color: 'black',
      icon: 'error',
      iconColor: 'negative',
      timeout: 5000
    })
  } finally {
    updateSettingsLoading.value = false
  }

  return guild
}

const openLacunaDiamondDialog = () => {
  return $q.dialog({
    component: LacunaDiamond
  })
}

const downloadLogs = async () => {
  try {
    const { data } = await interfaces.guilds.downloadLogs(guild._id)
    const href = URL.createObjectURL(new Blob([data.data])),
      link = document.createElement('a')

    link.href = href
    link.setAttribute('download', data.file_name)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(href)
    event('guild_download_logs', { event_category: 'utility' })
  } catch (err) {
    $q.notify({
      message: err.response?.data || err.toString(),
      classes: 'rounded-lg q-notification-custom',
      color: 'black',
      icon: 'error',
      iconColor: 'negative',
      timeout: 5000
    })
  }
}

onMounted(async () => {
  await getSettings()

  documentTitle.value = guild.guild.name

  watch(
    () => guildClone.value,
    (current, before) => {
      const isNotTrackableChanges =
        JSON.stringify(before.modules.custom_commands) !== JSON.stringify(current.modules.custom_commands) ||
        JSON.stringify(before.modules.subscriptions.telegram) !==
          JSON.stringify(current.modules.subscriptions.telegram) ||
        JSON.stringify(before.modules.subscriptions.twitch) !== JSON.stringify(current.modules.subscriptions.twitch) ||
        JSON.stringify(before.modules.subscriptions.youtube) !==
          JSON.stringify(current.modules.subscriptions.youtube) ||
        JSON.stringify(before.modules.voice_manager.autovoices) !==
          JSON.stringify(current.modules.voice_manager.autovoices) ||
        JSON.stringify(before.modules.interactive_messages) !== JSON.stringify(current.modules.interactive_messages) ||
        JSON.stringify(before.modules.reactions) !== JSON.stringify(current.modules.reactions)

      if (isNotTrackableChanges) {
        return
      }

      const isChanged = JSON.stringify(current) !== JSON.stringify(freezedGuild.value)
      const isFirstChange = isChanged && !freezedGuild.value._id

      if (isFirstChange) {
        freezedGuild.value = JSON.parse(JSON.stringify(before))
      }

      isGuildChanged.value = isChanged
    },
    { deep: true }
  )

  pageLoading.value = false

  const changeLogViewedVersion = $q.localStorage.getItem('change-log-viewed-version')

  if (changeLogViewedVersion !== changeLog.current.version) {
    $q.dialog({
      component: ChangeLog
    })
  }

  if (guild.change_log.length >= 10) {
    const userSurveyRemindAfter = $q.localStorage.getItem('user-survey-remind-after')

    if (!userSurveyRemindAfter || (typeof userSurveyRemindAfter === 'number' && Date.now() > userSurveyRemindAfter)) {
      $q.dialog({
        component: UserSurvey
      })
        .onOk(() => {
          const now = new Date()

          $q.notify({
            message: $t('user_survey.survey_submitted'),
            classes: 'rounded-lg q-notification-custom',
            color: 'black',
            icon: 'done',
            iconColor: 'positive',
            timeout: 5000
          })
          $q.localStorage.set('user-survey-remind-after', now.setMonth(now.getMonth() + 6))
        })
        .onCancel(() => {
          event('user_survey_remind_later', { event_category: 'utility' })
          $q.localStorage.set('user-survey-remind-after', Date.now() + 1000 * 60 * 60 * 24 * 7)
        })
    }
  }
})

onBeforeRouteLeave((to, from, next) => {
  if (isGuildChanged.value) {
    const answer = window.confirm($t('pages.guild.unsaved_changes'))

    if (answer) {
      next()
    } else {
      next(false)
    }
  } else {
    next()
  }
})

window.onbeforeunload = () => (isGuildChanged.value ? true : null)
</script>

<style lang="scss" scoped>
.nav-item--active {
  color: white;
  background: $secondary;
}
</style>
