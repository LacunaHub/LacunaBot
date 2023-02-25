<template>
  <div class="row q-col-gutter-md">
    <div class="col-12">
      <q-card class="rounded-lg bg-dark-1" flat>
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('pages.guild.vc_music_title') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('pages.guild.vc_music_default_source_title') }}
              </div>

              <q-btn-toggle
                v-model="guild.modules.music.default_source"
                :options="[
                  { value: 'Spotify', slot: 'sp' },
                  { value: 'YandexMusic', slot: 'ym' },
                  { value: 'SoundCloud', slot: 'sc' }
                ]"
                class="rounded-lg bg-dark-2 q-mt-sm"
                toggle-color="secondary"
                unelevated
                no-caps
                spread
              >
                <template #sp>
                  <div class="row justify-center q-col-gutter-xs">
                    <q-avatar class="col-shrink" square size="24px">
                      <img src="~assets/spotify-logo.svg" />
                    </q-avatar>

                    <div class="col-shrink">Spotify</div>
                  </div>
                </template>

                <template #ym>
                  <div class="row justify-center q-col-gutter-xs">
                    <q-avatar class="col-shrink" square size="24px">
                      <img src="~assets/yandex-music-logo.svg" />
                    </q-avatar>

                    <div class="col-shrink">Yandex Music</div>
                  </div>
                </template>

                <template #sc>
                  <div class="row justify-center q-col-gutter-xs">
                    <q-avatar class="col-shrink" square size="24px">
                      <img src="~assets/soundcloud-logo.svg" />
                    </q-avatar>

                    <div class="col-shrink">SoundCloud</div>
                  </div>
                </template>
              </q-btn-toggle>
            </div>
          </div>
        </q-card-section>

        <q-list class="q-px-none" padding dense>
          <q-item tag="label" :disable="!guild.premium.available" v-ripple="guild.premium.available">
            <q-item-section>
              <q-item-label>
                {{ $t('pages.guild.vc_music_allow_radio_playback_title') }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-checkbox
                v-model="guild.modules.music.allow_radio_playback"
                :disable="!guild.premium.available"
                dense
              ></q-checkbox>
            </q-item-section>
          </q-item>
        </q-list>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <div>
                {{ $t('pages.guild.vc_music_queue_max_length_title') }}
              </div>

              <q-slider
                v-model.number="guild.modules.music.queue_max_length"
                :disable="!guild.premium.available"
                class="q-pt-sm q-px-sm"
                :min="0"
                :max="250"
                label
              ></q-slider>
            </div>

            <div class="col-12 col-md-6">
              <div>
                {{ $t('pages.guild.vc_music_default_volume_title') }}
              </div>

              <q-slider
                v-model.number="guild.modules.music.default_volume"
                :disable="!guild.premium.available"
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
                {{ $t('common.allowed_channels') }}
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
                    class="rounded-lg"
                    color="dark-1"
                    square
                    :label="opt.name ?? opt"
                    :icon="opt.icon"
                    size="sm"
                    :ripple="false"
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
                {{ $t('common.blocked_channels') }}
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
                    class="rounded-lg"
                    color="dark-1"
                    square
                    :label="opt.name ?? opt"
                    :icon="opt.icon"
                    size="sm"
                    :ripple="false"
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
      <q-card class="rounded-lg bg-dark-1" flat>
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('pages.guild.vc_voice_roles_title') }}
            </q-item-label>
            <q-item-label class="text--secondary">
              {{ $t('pages.guild.vc_voice_roles_description') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side top>
            <div>{{ guild.modules.voice_manager.voice_roles.length }}/{{ guild.premium.available ? '20' : '2' }}</div>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div
              v-for="(voiceRole, i) in guild.modules.voice_manager.voice_roles"
              :key="i"
              class="col-12 col-sm-6 col-md-4"
            >
              <q-card class="rounded-lg bg-dark-2" flat>
                <q-item @click="voiceRoleDialog(voiceRole)" class="rounded-lg" clickable v-ripple>
                  <q-item-section>
                    <q-item-label>
                      {{ guild.roles.find(i => i.id === voiceRole.role_id)?.name ?? voiceRole.role_id }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>

            <div v-if="guild.modules.voice_manager.voice_roles.length < 20" class="col-12">
              <q-btn
                @click="
                  !guild.premium.available && guild.modules.voice_manager.voice_roles.length >= 2
                    ? lacunaDiamondDialog()
                    : voiceRoleDialog()
                "
                class="full-width dashed-border"
                icon="add"
                flat
              ></q-btn>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div class="col-12">
      <q-card class="rounded-lg bg-dark-1" flat>
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('pages.guild.vc_auto_voices_title') }}
            </q-item-label>
            <q-item-label class="text--secondary">
              {{ $t('pages.guild.vc_auto_voices_description') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side top>
            <div>{{ guild.modules.voice_manager.autovoices.length }}/{{ guild.premium.available ? '20' : '2' }}</div>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div
              v-for="(autoVoice, i) in guild.modules.voice_manager.autovoices"
              :key="i"
              class="col-12 col-sm-6 col-md-4"
            >
              <q-card class="rounded-lg bg-dark-2" flat>
                <q-item @click="autoVoiceDialog(autoVoice)" class="rounded-lg" clickable v-ripple>
                  <q-item-section>
                    <q-item-label>
                      {{ guild.channelsVoice.find(i => i.id === autoVoice.channel_id)?.name ?? autoVoice.channel_id }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>

            <div class="col-12">
              <q-btn
                @click="
                  !guild.premium.available && guild.modules.voice_manager.autovoices.length >= 2
                    ? lacunaDiamondDialog()
                    : autoVoiceDialog()
                "
                class="full-width dashed-border"
                icon="add"
                flat
              ></q-btn>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script>
import { useGuildStore } from 'src/stores/guild'
import { defineComponent } from 'vue'
import LacunaDiamond from 'src/components/dialogs/LacunaDiamond.vue'
import VoiceChannelsVoiceRole from 'src/components/dialogs/VoiceChannelsVoiceRole.vue'
import VoiceChannelsAutoVoice from 'src/components/dialogs/VoiceChannelsAutoVoice.vue'

export default defineComponent({
  name: 'GuildPageSettingsVoiceChannels',

  setup() {
    const guild = useGuildStore()

    return {
      guild
    }
  },

  methods: {
    lacunaDiamondDialog() {
      this.$q.dialog({
        component: LacunaDiamond
      })
    },
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
