<template>
  <div class="row q-col-gutter-md">
    <div class="col-12">
      <q-card class="bg-dark-1" flat>
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('Pages.GuildPage.VoiceChannels.Music') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('Pages.GuildPage.VoiceChannels.MusicDefaultSource') }}
              </div>

              <q-btn-toggle
                v-model="guild.modules.music.default_source"
                :options="[
                  { value: 'YandexMusic', slot: 'ym' },
                  { value: 'SoundCloud', slot: 'sc' }
                ]"
                class="bg-dark-2 q-mt-sm"
                toggle-color="secondary"
                unelevated
                no-caps
                spread
              >
                <template #ym>
                  <div class="row justify-center q-col-gutter-xs">
                    <q-avatar class="col-shrink" square size="24px">
                      <img src="~assets/yandex-music-logo.svg" />
                    </q-avatar>

                    <div class="col-shrink">{{ $t('Pages.GuildPage.VoiceChannels.MusicProviders.YandexMusic') }}</div>
                  </div>
                </template>

                <template #sc>
                  <div class="row justify-center q-col-gutter-xs">
                    <q-avatar class="col-shrink" square size="24px">
                      <img src="~assets/soundcloud-logo.svg" />
                    </q-avatar>

                    <div class="col-shrink">{{ $t('Pages.GuildPage.VoiceChannels.MusicProviders.SoundCloud') }}</div>
                  </div>
                </template>
              </q-btn-toggle>
            </div>
          </div>
        </q-card-section>

        <div class="q-pa-md">
          <q-list class="bg-dark-2 overflow-hidden rounded-borders">
            <q-item tag="label">
              <q-item-section side>
                <q-checkbox v-model="guild.modules.music.allow_radio_playback" dense></q-checkbox>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ $t('Pages.GuildPage.VoiceChannels.MusicAllowRadioPlayback') }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item tag="label">
              <q-item-section side>
                <q-checkbox v-model="voiceStatusEnabled" dense></q-checkbox>
              </q-item-section>

              <q-item-section>
                <div class="row items-center no-wrap">
                  <q-item-label>
                    {{ $t('Pages.GuildPage.VoiceChannels.MusicSetVoiceStatus') }}
                  </q-item-label>

                  <q-badge class="q-ml-sm text-uppercase" color="warning">
                    <span>{{ betaLabel }}</span>
                  </q-badge>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <div>
                {{ $t('Pages.GuildPage.VoiceChannels.MusicQueueMaxLength') }}
              </div>

              <q-slider
                v-model.number="guild.modules.music.queue_max_length"
                class="q-pt-sm q-px-sm"
                :min="0"
                :max="250"
                label
              ></q-slider>
            </div>

            <div class="col-12 col-md-6">
              <div>
                {{ $t('Pages.GuildPage.VoiceChannels.MusicDefaultVolume') }}
              </div>

              <q-slider
                v-model.number="guild.modules.music.default_volume"
                class="q-pt-sm q-px-sm"
                :min="1"
                :max="100"
                label
              ></q-slider>
            </div>
          </div>
        </q-card-section>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <div>
                {{ $t('Common.AllowedChannels') }}
              </div>

              <q-select
                v-model="guild.modules.music.allowed.channels"
                :options="guild.channelsVoice"
                option-label="name"
                option-value="id"
                class="q-pt-sm"
                filled
                dense
                hide-bottom-space
                emit-value
                map-options
                multiple
              >
                <template #selected-item="{ opt, index, removeAtIndex }">
                  <q-chip
                    color="dark-1"
                    square
                    :label="opt.name ?? opt"
                    :icon="opt.icon"
                    size="sm"
                    removable
                    @remove="removeAtIndex(index)"
                  ></q-chip>
                </template>

                <template #option="{ opt, toggleOption, selected }">
                  <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                    <q-item-section avatar>
                      <q-icon :name="opt.icon"></q-icon>
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>
                        {{ opt.name }}
                      </q-item-label>

                      <q-item-label class="text--secondary">
                        {{ opt.parentName }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <div class="col-12 col-md-6">
              <div>
                {{ $t('Common.BlockedChannels') }}
              </div>

              <q-select
                v-model="guild.modules.music.blocked.channels"
                :options="guild.channelsVoice"
                option-label="name"
                option-value="id"
                class="q-pt-sm"
                filled
                dense
                hide-bottom-space
                emit-value
                map-options
                multiple
              >
                <template #selected-item="{ opt, index, removeAtIndex }">
                  <q-chip
                    color="dark-1"
                    square
                    :label="opt.name ?? opt"
                    :icon="opt.icon"
                    size="sm"
                    removable
                    @remove="removeAtIndex(index)"
                  ></q-chip>
                </template>

                <template #option="{ opt, toggleOption, selected }">
                  <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                    <q-item-section avatar>
                      <q-icon :name="opt.icon"></q-icon>
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>
                        {{ opt.name }}
                      </q-item-label>

                      <q-item-label class="text--secondary">
                        {{ opt.parentName }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div class="col-12">
      <q-card class="bg-dark-1" flat>
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('Pages.GuildPage.VoiceChannels.VoiceRoles') }}
            </q-item-label>
            <q-item-label class="text--secondary">
              {{ $t('Pages.GuildPage.VoiceChannels.VoiceRolesDescription') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side top>
            <div>{{ guild.modules.voice_manager.voice_roles.length }}/20</div>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div
              v-for="(voiceRole, i) in guild.modules.voice_manager.voice_roles"
              :key="i"
              class="col-12 col-sm-6 col-md-4"
            >
              <q-card class="bg-dark-2" flat>
                <q-item @click="voiceRoleDialog(voiceRole)" clickable>
                  <q-item-section>
                    <q-item-label>
                      {{ guild.roles.find(i => i.id === voiceRole.role_id)?.name ?? voiceRole.role_id }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>

            <div v-if="guild.modules.voice_manager.voice_roles.length < 20" class="col-12">
              <q-btn @click="voiceRoleDialog()" class="full-width dashed-border" icon="add" flat></q-btn>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div class="col-12">
      <q-card class="bg-dark-1" flat>
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('Pages.GuildPage.VoiceChannels.AutoVoices') }}
            </q-item-label>
            <q-item-label class="text--secondary">
              {{ $t('Pages.GuildPage.VoiceChannels.AutoVoicesDescription') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side top>
            <div>{{ guild.modules.voice_manager.autovoices.length }}/20</div>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div
              v-for="(autoVoice, i) in guild.modules.voice_manager.autovoices"
              :key="i"
              class="col-12 col-sm-6 col-md-4"
            >
              <q-card class="bg-dark-2" flat>
                <q-item @click="autoVoiceDialog(autoVoice)" clickable>
                  <q-item-section>
                    <q-item-label>
                      {{ guild.channelsVoice.find(i => i.id === autoVoice.channel_id)?.name ?? autoVoice.channel_id }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>

            <div class="col-12">
              <q-btn @click="autoVoiceDialog()" class="full-width dashed-border" icon="add" flat></q-btn>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script>
import VoiceChannelsAutoVoice from 'src/components/dialogs/VoiceChannelsAutoVoice.vue'
import VoiceChannelsVoiceRole from 'src/components/dialogs/VoiceChannelsVoiceRole.vue'
import { useGuildStore } from 'src/stores/guild'
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'GuildPageSettingsVoiceChannels',

  setup() {
    const guild = useGuildStore()
    const { t } = useI18n()

    const betaLabel = computed(() => {
      const key = 'Common.Beta'
      const value = t(key)

      return value === key ? 'BETA' : value
    })

    const voiceStatusEnabled = computed({
      get: () => guild.modules.music.voice_status?.enabled ?? false,
      set: value => {
        guild.modules.music.voice_status = guild.modules.music.voice_status || {}
        guild.modules.music.voice_status.enabled = value
      }
    })

    return {
      guild,
      betaLabel,
      voiceStatusEnabled
    }
  },

  methods: {
    voiceRoleDialog(config) {
      this.$q
        .dialog({
          component: VoiceChannelsVoiceRole,

          componentProps: config ? { voiceRoleProp: config } : null
        })
        .onOk(payload => {
          const { mode, voiceRole } = payload

          if (mode === 'CREATE') {
            this.guild.modules.voice_manager.voice_roles.push(voiceRole)
          }

          if (mode === 'UPDATE') {
            const index = this.guild.modules.voice_manager.voice_roles.findIndex(i => i.role_id === voiceRole.role_id)

            this.guild.modules.voice_manager.voice_roles[index] = voiceRole
          }

          if (mode === 'DELETE') {
            const index = this.guild.modules.voice_manager.voice_roles.findIndex(i => i.role_id === voiceRole.role_id)

            this.guild.modules.voice_manager.voice_roles.splice(index, 1)
          }
        })
    },
    autoVoiceDialog(config) {
      this.$q
        .dialog({
          component: VoiceChannelsAutoVoice,

          componentProps: config ? { autoVoiceProp: config } : null
        })
        .onOk(payload => {
          const { mode, autoVoice } = payload

          if (mode === 'CREATE') {
            this.guild.modules.voice_manager.autovoices.push(autoVoice)
          }

          if (mode === 'UPDATE') {
            const index = this.guild.modules.voice_manager.autovoices.findIndex(i => i.role_id === autoVoice.role_id)

            this.guild.modules.voice_manager.autovoices[index] = autoVoice
          }

          if (mode === 'DELETE') {
            const index = this.guild.modules.voice_manager.autovoices.findIndex(i => i.role_id === autoVoice.channel_id)

            this.guild.modules.voice_manager.autovoices.splice(index, 1)
          }
        })
    }
  }
})
</script>
