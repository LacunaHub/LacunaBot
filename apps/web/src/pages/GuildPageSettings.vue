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
                    <q-avatar>
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
                    :disable="!guildChanged"
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
                  <q-item clickable v-ripple @click="lacunaDiamondDialog">
                    <q-item-section>
                      <q-item-label class="text-subtitle1">
                        <span class="q-mr-xs">Lacuna Diamond</span>

                        <q-badge v-if="diamondDiscount" color="primary">
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
                    :to="`/guilds/${gid}/sphere`"
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
                  :to="`/guilds/${gid}/${item.path}`"
                  :label="item.name"
                  :icon="`img:${item.icon}`"
                >
                  <q-badge v-if="item.new" color="primary" floating>
                    <span>NEW</span>
                  </q-badge>
                </q-route-tab>

                <q-route-tab
                  class="rounded-lg"
                  :to="`/guilds/${gid}/settings/change-log`"
                  :label="$t('pages.guild.nav_names.CHANGE_LOG')"
                  icon="img:/src/assets/logs.svg"
                ></q-route-tab>
              </q-tabs>
            </div>

            <div class="col-12 gt-sm">
              <q-card class="rounded-lg bg-dark-1" flat>
                <q-list padding>
                  <q-item clickable v-ripple @click="lacunaDiamondDialog">
                    <q-item-section>
                      <q-item-label class="text-subtitle1">
                        <span class="q-mr-xs">Lacuna Diamond</span>

                        <q-badge v-if="diamondDiscount" color="primary">
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
                    :to="`/guilds/${gid}/sphere`"
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
                    :to="`/guilds/${gid}/${item.path}`"
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
                  <q-item clickable :to="`/guilds/${gid}/settings/change-log`" active-class="nav-item--active" v-ripple>
                    <q-item-section class="text-subtitle1">
                      {{ $t('pages.guild.nav_names.CHANGE_LOG') }}
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

    <LacunaDiamond />
  </q-page>
</template>

<script>
import { defineComponent, toRaw } from 'vue'
import { useGuildStore } from 'src/stores/guild'
import { useUserStore } from 'src/stores/user'
import GuildCardMini from 'src/components/GuildCardMini.vue'
import { interfaces } from 'src/boot/axios'
import { useMeta } from 'quasar'
import { decimalToHex, objectDifferences } from 'src/utils/Utils'
import LacunaDiamond from 'src/components/dialogs/LacunaDiamond.vue'

import controlPanelImg from 'src/assets/control-panel.svg'
import slashCommandImg from 'src/assets/slash-command.svg'
import shieldImg from 'src/assets/shield.svg'
import activitiesImg from 'src/assets/activities.svg'
import bellImg from 'src/assets/bell.svg'
import karaokeImg from 'src/assets/karaoke.svg'
import layersImg from 'src/assets/layers.svg'

export default defineComponent({
  name: 'GuildPageSettings',

  setup() {
    const guild = useGuildStore()
    const user = useUserStore()

    return { guild, user }
  },

  components: {
    GuildCardMini,
    LacunaDiamond
  },

  data() {
    return {
      gid: this.$route.params.guild_id,
      pageLoading: true,
      navItems: [
        { name: this.$t('pages.guild.nav_names.GENERAL'), path: 'settings', icon: controlPanelImg },
        {
          name: this.$t('pages.guild.nav_names.COMMANDS'),
          path: 'settings/commands',
          icon: slashCommandImg
        },
        {
          name: this.$t('pages.guild.nav_names.MODERATION'),
          path: 'settings/moderation',
          icon: shieldImg
        },
        {
          name: this.$t('pages.guild.nav_names.ACTIVITIES'),
          path: 'settings/activities',
          icon: activitiesImg
        },
        {
          name: this.$t('pages.guild.nav_names.SUBSCRIPTIONS'),
          path: 'settings/subscriptions',
          icon: bellImg
        },
        {
          name: this.$t('pages.guild.nav_names.VOICE_CHANNELS'),
          path: 'settings/voice-channels',
          icon: karaokeImg,
          new: true
        },
        { name: this.$t('pages.guild.nav_names.UTILITY'), path: 'settings/utility', icon: layersImg, new: true }
      ],
      freezedGuild: {},
      guildChanged: false,
      updateSettingsLoading: false,
      updateSettingsError: false
    }
  },

  computed: {
    guildClone() {
      return JSON.parse(
        JSON.stringify({
          _id: this.guild._id,
          prefix: this.guild.prefix,
          locale: this.guild.locale,
          server: this.guild.server,
          commands: this.guild.commands,
          moderation: this.guild.moderation,
          modules: this.guild.modules
        })
      )
    },
    diamondDiscount() {
      return this.guild.prices.some(i => Object.values(i.discounts).some(i => i !== 0))
    }
  },

  methods: {
    async getSettings() {
      const gid = this.$route.params.guild_id

      return interfaces.guilds
        .getSettings(gid)
        .then(response => {
          this.guild.$patch(response.data)

          for (const role of this.guild.guild.roles) {
            role.color = `#${decimalToHex(role.color || 10593445)}`
          }
        })
        .catch(err => {
          const { status } = err.response

          if (status === 401) {
            this.$router.push('/authorize')
          }
          if (status === 403) {
            this.$router.push('/forbidden')
          }
          if (status === 400 || status === 404 || status === 406) {
            this.$router.push('/not-found')
          }
        })
    },
    async updateSettings() {
      this.updateSettingsLoading = true

      const data = objectDifferences(this.guildClone, this.freezedGuild)

      return interfaces.guilds
        .updateSettings(this.gid, { data })
        .then(response => {
          this.guild.$patch({ ...response.data })
          setTimeout(() => {
            this.guildChanged = false
            this.freezedGuild = {}
          }, 1)
        })
        .catch(err => {
          console.error(err)
          this.updateSettingsError = true
          this.$q.notify({
            message: this.$t('pages.guild.save_error'),
            classes: 'rounded-lg q-notification-custom',
            color: 'black',
            icon: 'error',
            iconColor: 'negative',
            timeout: 5000
          })
        })
        .finally(() => (this.updateSettingsLoading = false))
    },
    lacunaDiamondDialog() {
      this.$q.dialog({
        component: LacunaDiamond
      })
    }
  },

  async mounted() {
    await this.getSettings()

    useMeta({
      title: this.guild.guild.name
    })

    this.$watch(
      'guildClone',
      (value, before) => {
        if (
          JSON.stringify(before.modules.custom_commands) !== JSON.stringify(value.modules.custom_commands) ||
          JSON.stringify(before.modules.subscriptions.twitch) !== JSON.stringify(value.modules.subscriptions.twitch) ||
          JSON.stringify(before.modules.subscriptions.youtube) !==
            JSON.stringify(value.modules.subscriptions.youtube) ||
          JSON.stringify(before.modules.voice_manager.autovoices) !==
            JSON.stringify(value.modules.voice_manager.autovoices) ||
          JSON.stringify(before.modules.interactive_messages) !== JSON.stringify(value.modules.interactive_messages) ||
          JSON.stringify(before.modules.reactions) !== JSON.stringify(value.modules.reactions)
        )
          return

        const changed = JSON.stringify(value) !== JSON.stringify(this.freezedGuild)
        const once = changed && !this.freezedGuild._id

        if (once) this.freezedGuild = JSON.parse(JSON.stringify(before))

        this.guildChanged = changed
      },
      { deep: true }
    )

    this.pageLoading = false
  }
})
</script>

<style lang="scss" scoped>
.nav-item--active {
  color: white;
  background: $secondary;
}
</style>
