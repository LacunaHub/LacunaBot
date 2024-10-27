<template>
  <div class="row q-col-gutter-md">
    <div class="col-12">
      <q-list class="bg-dark-1 overflow-hidden rounded-borders">
        <q-expansion-item>
          <template #header>
            <q-item-section>
              <q-item-label class="text-subtitle1">
                {{ $t('Pages.GuildPage.Useful.BannerRotation') }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-toggle v-model="guild.modules.guild_image_rotation.banner.active" dense></q-toggle>
            </q-item-section>
          </template>

          <q-card class="bg-dark-1 no-border-radius" flat>
            <q-card-section>
              <q-banner class="bg-dark-2 rounded-borders" dense>
                <span>
                  {{ $t('Pages.GuildPage.Useful.ImageRotationNote', { relativeTime: bannerRotationIn }) }}
                </span>

                <ul>
                  <li
                    v-for="event in [
                      'guild_member_add',
                      'guild_member_remove',
                      'message_create',
                      'voice_connect',
                      'voice_disconnect'
                    ]"
                    :key="event"
                  >
                    {{ $t(localeStringsMap.actionLogEvents[event]) }}
                  </li>
                </ul>

                <template #avatar>
                  <q-icon name="info" color="info"></q-icon>
                </template>
              </q-banner>
            </q-card-section>

            <ImageEditor
              :image="guild.modules.guild_image_rotation.banner.image"
              :disable="!guild.modules.guild_image_rotation.banner.active"
              :show-toggle="false"
              :canvas-resizable="false"
              :canvas-height="540"
              :canvas-width="960"
              @change="onChangeBannerImage"
            />
          </q-card>
        </q-expansion-item>
      </q-list>
    </div>

    <div class="col-12">
      <q-card class="bg-dark-1" flat>
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('Pages.GuildPage.Useful.AutoThreads') }}
            </q-item-label>
            <q-item-label class="text--secondary">
              {{ $t('Pages.GuildPage.Useful.AutoThreadsDescription') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side top>
            <div>{{ guild.modules.autothreads.length }}/{{ guild.premium.available ? '20' : '2' }}</div>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div v-for="(autoThread, i) in guild.modules.autothreads" :key="i" class="col-12 col-sm-6 col-md-4">
              <q-card class="bg-dark-2" flat>
                <q-item clickable @click="autoThreadDialog(autoThread)">
                  <q-item-section>
                    <q-item-label>
                      {{ guild.channelsText.find(i => i.id === autoThread.channel_id)?.name ?? autoThread.channel_id }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>

            <div v-if="guild.modules.autothreads.length < 20" class="col-12">
              <q-btn
                @click="
                  !guild.premium.available && guild.modules.autothreads.length >= 2
                    ? lacunaDiamondDialog()
                    : autoThreadDialog()
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
            <q-item-label class="text-subtitle1">
              {{ $t('Pages.GuildPage.Useful.AutoReactions') }}
            </q-item-label>
            <q-item-label class="text--secondary">
              {{ $t('Pages.GuildPage.Useful.AutoReactionsDescription') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side top>
            <div>{{ guild.modules.autoreactions.length }}/{{ guild.premium.available ? '20' : '2' }}</div>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div v-for="(autoReaction, i) in guild.modules.autoreactions" :key="i" class="col-12 col-sm-6 col-md-4">
              <q-card class="bg-dark-2" flat>
                <q-item clickable @click="autoReactionDialog(autoReaction)">
                  <q-item-section>
                    <q-item-label>
                      {{
                        guild.channelsText.find(i => i.id === autoReaction.channel_id)?.name ?? autoReaction.channel_id
                      }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>

            <div v-if="guild.modules.autoreactions.length < 20" class="col-12">
              <q-btn
                @click="
                  !guild.premium.available && guild.modules.autoreactions.length >= 2
                    ? lacunaDiamondDialog()
                    : autoReactionDialog()
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
            <q-item-label class="text-subtitle1">
              {{ $t('Pages.GuildPage.Useful.InteractiveMessages') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side top>
            <div>{{ guild.modules.interactive_messages.length }}/{{ guild.premium.available ? '50' : '5' }}</div>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div v-for="(im, i) in guild.modules.interactive_messages" :key="i" class="col-12 col-sm-6 col-md-4">
              <q-card class="bg-dark-2" flat>
                <q-item clickable @click="imDialog(im)">
                  <q-item-section>
                    <q-item-label>
                      {{ guild.channelsText.find(i => i.id === im.channel_id)?.name ?? im.channel_id }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>

            <div v-if="guild.modules.interactive_messages.length < 50" class="col-12">
              <q-btn
                @click="
                  !guild.premium.available && guild.modules.interactive_messages.length >= 5
                    ? lacunaDiamondDialog()
                    : imDialog()
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
            <q-item-label class="text-subtitle1">
              {{ $t('Pages.GuildPage.Useful.InteractiveReactions') }}
            </q-item-label>
            <q-item-label class="text--secondary">
              {{ $t('Pages.GuildPage.Useful.InteractiveReactionsDescription') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side top>
            <div>{{ guild.modules.reactions.length }}/{{ guild.premium.available ? '200' : '50' }}</div>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div v-for="(ir, i) in guild.modules.reactions" :key="i" class="col-12 col-sm-6 col-md-4">
              <q-card class="bg-dark-2" flat>
                <q-item clickable @click="irDialog(ir)">
                  <q-item-section>
                    <q-item-label>
                      {{ ir.emoji.id ? `:${ir.emoji.name}:` : ir.emoji.name }}
                      <span class="q-px-xs">–</span>
                      {{ guild.channelsText.find(i => i.id === ir.message.channel_id)?.name ?? ir.message.channel_id }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>

            <div v-if="guild.modules.reactions.length < 200" class="col-12">
              <q-btn
                @click="
                  !guild.premium.available && guild.modules.reactions.length >= 50 ? lacunaDiamondDialog() : irDialog()
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
import UtilityAutoThread from 'components/dialogs/UtilityAutoThread.vue'
import { debounce } from 'quasar'
import { DateTime } from 'src/boot/luxon'
import ImageEditor from 'src/components/ImageEditor.vue'
import LacunaDiamond from 'src/components/dialogs/LacunaDiamond.vue'
import UtilityAutoReaction from 'src/components/dialogs/UtilityAutoReaction.vue'
import UtilityInteractiveMessage from 'src/components/dialogs/UtilityInteractiveMessage.vue'
import UtilityInteractiveReaction from 'src/components/dialogs/UtilityInteractiveReaction.vue'
import { useGuildStore } from 'src/stores/guild'
import { localeStringsMap } from 'src/utils/Constants'
import { computed, defineComponent } from 'vue'

export default defineComponent({
  name: 'GuildPageSettingsUtility',

  components: { ImageEditor },

  setup() {
    const guild = useGuildStore()

    const bannerRotationIn = computed(() => {
      const rotationThrottle = guild.premium.available ? 1000 * 60 * 2 : 1000 * 60 * 60
      const lastUpdated = guild.modules.guild_image_rotation.banner.last_updated_timestamp ?? 0,
        elapsedTime = Date.now() - lastUpdated

      return DateTime.fromMillis(
        elapsedTime > rotationThrottle ? Date.now() + 1000 : lastUpdated + rotationThrottle
      ).toRelative()
    })

    const onChangeBannerImage = debounce(value => {
      guild.modules.guild_image_rotation.banner.image = value
    }, 500)

    return {
      guild,
      bannerRotationIn,
      onChangeBannerImage,
      localeStringsMap
    }
  },

  methods: {
    lacunaDiamondDialog() {
      this.$q.dialog({
        component: LacunaDiamond
      })
    },
    autoThreadDialog(config) {
      this.$q
        .dialog({
          component: UtilityAutoThread,

          componentProps: config ? { autoThreadProp: config } : null
        })
        .onOk(payload => {
          const { mode, autoThread } = payload

          if (mode === 'CREATE') {
            this.guild.modules.autothreads.push(autoThread)
          }

          if (mode === 'UPDATE') {
            const index = this.guild.modules.autothreads.findIndex(i => i.channel_id === autoThread.channel_id)

            this.guild.modules.autothreads[index] = autoThread
          }

          if (mode === 'DELETE') {
            const index = this.guild.modules.autothreads.findIndex(i => i.channel_id === autoThread.channel_id)

            this.guild.modules.autothreads.splice(index, 1)
          }
        })
    },
    autoReactionDialog(config) {
      this.$q
        .dialog({
          component: UtilityAutoReaction,

          componentProps: config ? { autoReactionProp: config } : null
        })
        .onOk(payload => {
          const { mode, autoReaction } = payload

          if (mode === 'CREATE') {
            this.guild.modules.autoreactions.push(autoReaction)
          }

          if (mode === 'UPDATE') {
            const index = this.guild.modules.autoreactions.findIndex(i => i.channel_id === autoReaction.channel_id)

            this.guild.modules.autoreactions[index] = autoReaction
          }

          if (mode === 'DELETE') {
            const index = this.guild.modules.autoreactions.findIndex(i => i.channel_id === autoReaction.channel_id)

            this.guild.modules.autoreactions.splice(index, 1)
          }
        })
    },
    imDialog(config) {
      this.$q
        .dialog({
          component: UtilityInteractiveMessage,

          componentProps: config ? { imProp: config } : null
        })
        .onOk(payload => {
          const { mode, im } = payload

          if (mode === 'CREATE') {
            this.guild.modules.interactive_messages.push(im)
          }

          if (mode === 'UPDATE') {
            const index = this.guild.modules.interactive_messages.findIndex(i => i.id === im.id)

            this.guild.modules.interactive_messages[index] = im
          }

          if (mode === 'DELETE') {
            const index = this.guild.modules.interactive_messages.findIndex(i => i.id === im.id)

            this.guild.modules.interactive_messages.splice(index, 1)
          }
        })
    },
    irDialog(config) {
      this.$q
        .dialog({
          component: UtilityInteractiveReaction,

          componentProps: config ? { irProp: config } : null
        })
        .onOk(payload => {
          const { mode, ir } = payload

          if (mode === 'CREATE') {
            this.guild.modules.reactions.push(ir)
          }

          if (mode === 'UPDATE') {
            const index = this.guild.modules.reactions.findIndex(i => i.id === ir.id)

            this.guild.modules.reactions[index] = ir
          }

          if (mode === 'DELETE') {
            const index = this.guild.modules.reactions.findIndex(i => i.id === ir.id)

            this.guild.modules.reactions.splice(index, 1)
          }
        })
    }
  }
})
</script>
