<template>
  <div class="row q-col-gutter-md">
    <div class="col-12">
      <q-card class="bg-dark-1" flat>
        <q-item class="q-py-md rounded-t-lg" tag="label">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('pages.guild.ut_reports_title') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-toggle v-model="guild.modules.reports.active" dense></q-toggle>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('common.channel') }}
              </div>

              <q-select
                v-model="guild.modules.reports.channel_id"
                :options="guild.channelsText"
                :disable="!guild.modules.reports.active"
                option-label="name"
                option-value="id"
                class="q-pt-sm"
                filled
                dense
                hide-bottom-space
                emit-value
                map-options
              >
                <template #selected-item="{ opt }">
                  <q-chip color="dark-1" square :label="opt.name ?? opt" :icon="opt.icon" size="sm"></q-chip>
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

        <div class="q-pa-md">
          <q-list class="bg-dark-2 overflow-hidden rounded-borders">
            <q-item tag="label" :disable="!guild.modules.reports.active">
              <q-item-section side>
                <q-checkbox
                  v-model="guild.modules.reports.notify_about_unwanted_users"
                  :disable="!guild.modules.reports.active"
                  dense
                ></q-checkbox>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ $t('pages.guild.ut_reports_notify_about_unwanted_users_title') }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card>
    </div>

    <div class="col-12">
      <q-card class="bg-dark-1" flat>
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('pages.guild.ut_automation_title') }}
            </q-item-label>

            <q-item-label class="text--secondary">
              <q-badge class="q-mr-xs" color="warning">
                <span>BETA</span>
              </q-badge>
            </q-item-label>
          </q-item-section>

          <q-item-section side top>
            <div>{{ guild.modules.automation.length }}/{{ guild.premium.available ? '20' : '5' }}</div>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div v-for="(automation, i) in guild.modules.automation" :key="i" class="col-12 col-sm-6 col-md-4">
              <q-card class="bg-dark-2" flat>
                <q-item clickable @click="automationDialog(automation)">
                  <q-item-section>
                    <q-item-label>
                      {{ automation.name }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>

            <div v-if="guild.modules.automation.length < 20" class="col-12">
              <q-btn
                @click="
                  !guild.premium.available && guild.modules.automation.length >= 5
                    ? lacunaDiamondDialog()
                    : automationDialog()
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
              {{ $t('pages.guild.ut_auto_threads_title') }}
            </q-item-label>
            <q-item-label class="text--secondary">
              {{ $t('pages.guild.ut_auto_threads_description') }}
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
              {{ $t('pages.guild.ut_auto_reactions_title') }}
            </q-item-label>
            <q-item-label class="text--secondary">
              {{ $t('pages.guild.ut_auto_reactions_description') }}
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
              {{ $t('pages.guild.ut_ims_title') }}
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
              {{ $t('pages.guild.ut_irs_title') }}
            </q-item-label>
            <q-item-label class="text--secondary">
              {{ $t('pages.guild.ut_irs_description') }}
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
import AutomationTask from 'src/components/dialogs/AutomationTask.vue'
import LacunaDiamond from 'src/components/dialogs/LacunaDiamond.vue'
import UtilityAutoReaction from 'src/components/dialogs/UtilityAutoReaction.vue'
import UtilityInteractiveMessage from 'src/components/dialogs/UtilityInteractiveMessage.vue'
import UtilityInteractiveReaction from 'src/components/dialogs/UtilityInteractiveReaction.vue'
import { useGuildStore } from 'src/stores/guild'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'GuildPageSettingsUtility',

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
    automationDialog(config) {
      this.$q
        .dialog({
          component: AutomationTask,

          componentProps: config ? { automationProp: config } : null
        })
        .onOk(payload => {
          const { mode, automation } = payload

          if (mode === 'CREATE') {
            this.guild.modules.automation.push(automation)
          }

          if (mode === 'UPDATE') {
            const index = this.guild.modules.automation.findIndex(i => i.id === automation.id)

            this.guild.modules.automation[index] = automation
          }

          if (mode === 'DELETE') {
            const index = this.guild.modules.automation.findIndex(i => i.id === automation.id)

            this.guild.modules.automation.splice(index, 1)
          }
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
