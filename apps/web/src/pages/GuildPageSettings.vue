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
              <q-card class="bg-dark-1" flat>
                <q-item class="q-pt-md">
                  <q-item-section avatar>
                    <q-avatar size="48px">
                      <img :src="guild.iconURL" alt="Guild Icon" />
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label class="ellipsis">{{ guild.guild?.name ?? 'Unknown Guild Name' }}</q-item-label>
                  </q-item-section>
                </q-item>

                <q-card-section>
                  <q-btn
                    class="full-width update-settings-btn"
                    :class="{ animated: updateSettingsAnimated, headShake: updateSettingsAnimated }"
                    :color="updateSettingsColor"
                    push
                    :label="$t('Common.Save')"
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

            <div v-if="$q.screen.lt.md" class="col-12">
              <q-tabs class="bg-dark-1 rounded-borders" no-caps indicator-color="transparent" outside-arrows>
                <q-route-tab
                  v-for="item in navItems.flat()"
                  :key="item.path"
                  active-class="nav-item--active"
                  exact
                  :label="item.name"
                  :icon="item.image ? `img:${item.image}` : item.icon"
                  :to="item.path ? `/guilds/${guildId}/${item.path}` : null"
                  @click="item.action"
                >
                  <q-badge v-for="badge in item.badges" :key="badge.name" :color="badge.color" floating>
                    <span>{{ badge.name }}</span>
                  </q-badge>
                </q-route-tab>
              </q-tabs>
            </div>

            <div v-if="$q.screen.gt.sm" class="col-12">
              <!-- <q-list class="bg-dark-1 overflow-hidden rounded-borders q-my-md">
                <q-item
                  clickable
                  :to="`/guilds/${guildId}/settings/web-page`"
                  active-class="nav-item--active"
                  style="display: none"
                >
                  <q-item-section class="text-subtitle1">Web page</q-item-section>

                  <q-item-section avatar side>
                    <q-avatar square size="24px">
                      <img src="~assets/lacuna-sphere.svg" />
                    </q-avatar>
                  </q-item-section>
                </q-item>
              </q-list> -->

              <q-list v-for="(group, i) in navItems" :key="i" class="bg-dark-1 overflow-hidden rounded-borders q-mb-md">
                <q-item
                  v-for="item in group"
                  :key="item.name"
                  clickable
                  active-class="nav-item--active"
                  exact
                  :to="item.path ? `/guilds/${guildId}/${item.path}` : null"
                  @click="item.action"
                >
                  <q-item-section>
                    <q-item-label class="text-subtitle1">
                      <span class="q-mr-xs">
                        {{ item.name }}
                      </span>

                      <q-badge v-for="badge in item.badges" :key="badge.name" :color="badge.color">
                        <span>{{ badge.name }}</span>
                      </q-badge>
                    </q-item-label>
                  </q-item-section>

                  <q-item-section avatar side>
                    <q-avatar v-if="item.image" square size="24px">
                      <img :src="item.image" :alt="item.name" />
                    </q-avatar>

                    <q-icon
                      v-if="item.icon"
                      :class="$route.path.endsWith(item.path) ? '' : 'text--secondary'"
                      :name="item.icon"
                    ></q-icon>
                  </q-item-section>
                </q-item>
              </q-list>
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
import { interfaces } from 'src/boot/axios'
import ChangeLog from 'src/components/dialogs/ChangeLog.vue'
import UserSurvey from 'src/components/dialogs/UserSurvey.vue'
import RollFailSound from 'src/sounds/bg3-roll-fail.mp3'
import RollPassSound from 'src/sounds/bg3-roll-pass.mp3'
import { useReleaseNotesCache } from 'src/stores/ReleaseNotesCache'
import { useGuildStore } from 'src/stores/guild'
import { decimalToHex, handleAxiosError, objectDifferences, sleep } from 'src/utils/Utils'
import { computed, onMounted, ref, watch } from 'vue'
import { event } from 'vue-gtag'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'

const $q = useQuasar(),
  route = useRoute(),
  router = useRouter(),
  { t } = useI18n()

const pageLoading = ref(true)
const guild = useGuildStore(),
  releaseNoteCache = useReleaseNotesCache()
const guildId = route.params.guild_id,
  documentTitle = ref(null)
const freezedGuild = ref({}),
  isGuildChanged = ref(false),
  updateSettingsLoading = ref(false),
  updateSettingsColor = ref('primary'),
  updateSettingsAnimated = ref(false)

const guildClone = computed(() => {
    return JSON.parse(
      JSON.stringify({
        _id: guild._id,
        prefix: guild.prefix,
        locale: guild.locale,
        bot_experts: guild.bot_experts,
        commands: guild.commands,
        moderation: guild.moderation,
        modules: guild.modules,
        web_page: guild.web_page
      })
    )
  }),
  hasDiamondDiscount = ref(false)

const downloadLogs = async () => {
  try {
    const { data } = await interfaces.guilds.getLogs(guild._id)
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

const navItems = [
  [
    {
      name: 'Lacuna Diamond',
      path: 'settings/diamond',
      icon: 'r_diamond'
    }
  ],
  [
    { name: t('Pages.GuildPage.NavNames.General'), path: 'settings', icon: 'r_category' },
    {
      name: t('Pages.GuildPage.NavNames.Commands'),
      path: 'settings/commands',
      icon: 'r_terminal'
    },
    {
      name: t('Pages.GuildPage.NavNames.Moderation'),
      path: 'settings/moderation',
      icon: 'r_gpp_good'
    },
    { name: t('Pages.GuildPage.NavNames.CustomBehavior'), path: 'settings/custom-behavior', icon: 'r_extension' },
    {
      name: t('Pages.GuildPage.NavNames.Activities'),
      path: 'settings/activities',
      icon: 'r_rocket_launch'
    },
    {
      name: t('Pages.GuildPage.NavNames.Subscriptions'),
      path: 'settings/subscriptions',
      icon: 'r_notifications_active'
    },
    {
      name: t('Pages.GuildPage.NavNames.VoiceChannels'),
      path: 'settings/voice-channels',
      icon: 'r_settings_voice'
    },
    { name: t('Pages.GuildPage.NavNames.Utility'), path: 'settings/utility', icon: 'r_layers' }
  ],
  [
    { name: t('Pages.GuildPage.NavNames.ChangeLog'), path: 'settings/audit-log', icon: 'r_history' },
    { name: t('Pages.GuildPage.NavNames.DownloadLogs'), action: downloadLogs, icon: 'r_text_snippet' }
  ]
]

const rollPass = new Audio(RollPassSound),
  rollFail = new Audio(RollFailSound)
rollPass.volume = 0.5
rollFail.volume = 0.5

const rollD20 = () => Math.floor(Math.random() * 20) + 1

const onRollFail = () => {
  updateSettingsColor.value = 'red'
  updateSettingsAnimated.value = true
  setTimeout(() => {
    updateSettingsColor.value = 'primary'
    updateSettingsAnimated.value = false
  }, 1000)
}

// const hasInvalidFields = () => false

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
    const prevVoiceStatus = guild.modules.music?.voice_status
    const response = await interfaces.guilds.getSettings(guildId),
      { data } = response

    guild.$patch(data)

    const voiceStatusFromResponse = data.modules?.music?.voice_status
    const voiceStatus = voiceStatusFromResponse ??
      prevVoiceStatus ?? {
        enabled: false,
        force_set: false
      }
    guild.modules.music.voice_status = {
      enabled: typeof voiceStatus.enabled === 'boolean' ? voiceStatus.enabled : false,
      force_set: typeof voiceStatus.force_set === 'boolean' ? voiceStatus.force_set : false
    }

    for (const role of guild.guild.roles) {
      role.color = `#${decimalToHex(role.color || 10593445)}`
    }

    return true
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

  return false
}

const updateSettings = async () => {
  // if (hasInvalidFields()) return

  updateSettingsLoading.value = true
  const updateData = objectDifferences(guildClone.value, freezedGuild.value)

  try {
    const d20 = rollD20(),
      d20Pass = d20 === 20

    if (d20Pass) {
      const rollFailed = rollD20() < 15 ? true : false
      if (rollFailed) {
        await sleep()
        await rollFail.play()
        onRollFail()
        event('d20_roll_fail', { event_category: 'easter_eggs' })

        throw new Error('Perception Failed')
      }

      event('d20_roll_pass', { event_category: 'easter_eggs' })
    }

    const response = await interfaces.guilds.updateSettings(guildId, { data: updateData }),
      { data } = response

    if (d20Pass) await rollPass.play()
    guild.$patch({ ...data })
    setTimeout(() => {
      isGuildChanged.value = false
      freezedGuild.value = {}
    })
  } catch (err) {
    const error = handleAxiosError(err)

    $q.notify({
      message: error.message,
      classes: 'q-notification-custom',
      color: 'black',
      icon: 'error',
      iconColor: 'negative',
      timeout: 5000
    })
  } finally {
    updateSettingsLoading.value = false
  }
}

onMounted(async () => {
  const getSettingsSuccess = await getSettings()

  documentTitle.value = guild.guild.name

  watch(
    () => guildClone.value,
    (current, before) => {
      const isNotTrackableChanges =
        JSON.stringify(before.modules.custom_commands) !== JSON.stringify(current.modules.custom_commands) ||
        JSON.stringify(before.moderation.dame_rules) !== JSON.stringify(current.moderation.dame_rules) ||
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

  pageLoading.value = !getSettingsSuccess

  const changeLogViewedVersion = $q.localStorage.getItem('change-log-viewed-version')

  if (changeLogViewedVersion !== releaseNoteCache.current.version) {
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
            message: t('Components.UserSurvey.SurveySubmitted'),
            classes: 'q-notification-custom',
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
    const answer = window.confirm(t('Pages.GuildPage.UnsavedChangesArePresent'))

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
  color: $almost-white-1;
  background: $dark-3;
}

.update-settings-btn {
  transition: 0.2s ease-out;
}
</style>
