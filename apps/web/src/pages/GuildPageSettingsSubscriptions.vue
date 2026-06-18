<template>
  <div class="row q-col-gutter-md">
    <div class="col-12">
      <q-card class="bg-dark-1" flat>
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">Telegram</q-item-label>
          </q-item-section>

          <q-item-section side top>
            <div>{{ guild.modules.subscriptions.telegram.length }}/{{ guild.premium.available ? '10' : '1' }}</div>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div
              v-for="telegram in guild.modules.subscriptions.telegram"
              :key="telegram.channel_id"
              class="col-12 col-sm-6 col-md-4"
            >
              <q-card class="bg-dark-2" flat>
                <q-item clickable @click="telegramDialog(telegram)">
                  <q-item-section>
                    <q-item-label class="ellipsis"> @{{ telegram.channel_username }} </q-item-label>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>

            <div v-if="guild.modules.subscriptions.telegram.length < 10" class="col-12">
              <q-btn
                @click="
                  !guild.premium.available && guild.modules.subscriptions.telegram.length >= 1
                    ? lacunaDiamondDialog()
                    : telegramDialog()
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
      <q-card class="bg-dark-1" flat>
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">Twitch</q-item-label>
          </q-item-section>

          <q-item-section side top>
            <div>{{ guild.modules.subscriptions.twitch.length }}/{{ guild.premium.available ? '10' : '1' }}</div>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div
              v-for="twitch in guild.modules.subscriptions.twitch"
              :key="twitch.broadcaster_id"
              class="col-12 col-sm-6 col-md-4"
            >
              <q-card class="bg-dark-2" flat>
                <q-item clickable @click="twitchDialog(twitch)">
                  <q-item-section avatar style="min-width: 24px">
                    <q-avatar size="24px">
                      <img :src="twitch.broadcaster_thumbnail_url" :alt="twitch.broadcaster_name" />
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label class="ellipsis">
                      {{ twitch.broadcaster_name }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>

            <div v-if="guild.modules.subscriptions.twitch.length < 10" class="col-12">
              <q-btn
                @click="
                  !guild.premium.available && guild.modules.subscriptions.twitch.length >= 1
                    ? lacunaDiamondDialog()
                    : twitchDialog()
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
      <q-card class="bg-dark-1" flat>
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">YouTube</q-item-label>
          </q-item-section>

          <q-item-section side top>
            <div>{{ guild.modules.subscriptions.youtube.length }}/{{ guild.premium.available ? '10' : '1' }}</div>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div
              v-for="youtube in guild.modules.subscriptions.youtube"
              :key="youtube.channel_id"
              class="col-12 col-sm-6 col-md-4"
            >
              <q-card class="bg-dark-2" flat>
                <q-item clickable @click="youtubeDialog(youtube)">
                  <q-item-section avatar style="min-width: 24px">
                    <q-avatar size="24px">
                      <img :src="youtube.channel_thumbnail_url" :alt="youtube.channel_name" />
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label class="ellipsis">
                      {{ youtube.channel_name }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>

            <div v-if="guild.modules.subscriptions.youtube.length < 10" class="col-12">
              <q-btn
                @click="
                  !guild.premium.available && guild.modules.subscriptions.youtube.length >= 1
                    ? lacunaDiamondDialog()
                    : youtubeDialog()
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
import LacunaDiamond from 'src/components/dialogs/LacunaDiamond.vue'
import SubscriptionsTelegram from 'src/components/dialogs/SubscriptionsTelegram.vue'
import SubscriptionsTwitch from 'src/components/dialogs/SubscriptionsTwitch.vue'
import SubscriptionsYouTube from 'src/components/dialogs/SubscriptionsYouTube.vue'
import { useGuildStore } from 'src/stores/guild'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'GuildPageSettingsSubscriptions',

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
    telegramDialog(config) {
      this.$q
        .dialog({
          component: SubscriptionsTelegram,

          componentProps: config ? { telegramProp: config } : null
        })
        .onOk(payload => {
          const { mode, telegram } = payload

          if (mode === 'CREATE') {
            this.guild.modules.subscriptions.telegram.push(telegram)
          }

          if (mode === 'UPDATE') {
            const index = this.guild.modules.subscriptions.telegram.findIndex(i => i.channel_id === telegram.channel_id)

            this.guild.modules.subscriptions.telegram[index] = telegram
          }

          if (mode === 'DELETE') {
            const index = this.guild.modules.subscriptions.telegram.findIndex(
              i => i.broadcaster_id === telegram.channel_id
            )

            this.guild.modules.subscriptions.telegram.splice(index, 1)
          }
        })
    },
    twitchDialog(config) {
      this.$q
        .dialog({
          component: SubscriptionsTwitch,

          componentProps: config ? { twitchProp: config } : null
        })
        .onOk(payload => {
          const { mode, twitch } = payload

          if (mode === 'CREATE') {
            this.guild.modules.subscriptions.twitch.push(twitch)
          }

          if (mode === 'UPDATE') {
            const index = this.guild.modules.subscriptions.twitch.findIndex(
              i => i.broadcaster_id === twitch.broadcaster_id
            )

            this.guild.modules.subscriptions.twitch[index] = twitch
          }

          if (mode === 'DELETE') {
            const index = this.guild.modules.subscriptions.twitch.findIndex(
              i => i.broadcaster_id === twitch.broadcaster_id
            )

            this.guild.modules.subscriptions.twitch.splice(index, 1)
          }
        })
    },
    youtubeDialog(config) {
      this.$q
        .dialog({
          component: SubscriptionsYouTube,

          componentProps: config ? { youtubeProp: config } : null
        })
        .onOk(payload => {
          const { mode, youtube } = payload

          if (mode === 'CREATE') {
            this.guild.modules.subscriptions.youtube.push(youtube)
          }

          if (mode === 'UPDATE') {
            const index = this.guild.modules.subscriptions.youtube.findIndex(i => i.channel_id === youtube.channel_id)

            this.guild.modules.subscriptions.youtube[index] = youtube
          }

          if (mode === 'DELETE') {
            const index = this.guild.modules.subscriptions.youtube.findIndex(i => i.channel_id === youtube.channel_id)

            this.guild.modules.subscriptions.youtube.splice(index, 1)
          }
        })
    }
  }
})
</script>
