<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="bg-dark-1" flat style="width: 800px; max-width: 90vw">
      <q-item class="q-py-md rounded-t-lg" tag="label">
        <q-item-section>
          <q-item-label class="text-subtitle1 text-uppercase">
            {{ $t(localeStringsMap.caseLogTypes[caseType.name]) }}
          </q-item-label>
        </q-item-section>

        <q-item-section side top>
          <q-toggle v-model="caseType.config.active" dense></q-toggle>
        </q-item-section>
      </q-item>

      <q-card-section v-if="false">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('Pages.GuildPage.Moderation.CaseLogChannel') }}
            </div>

            <q-select
              v-model="caseType.config.channel_id"
              :options="guild.channelsText"
              option-label="name"
              option-value="id"
              :disable="!caseType.config.active"
              class="q-pt-sm"
              filled
              dense
              hide-bottom-space
              emit-value
              map-options
              clearable
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

      <div v-if="caseType.config.custom_dm_message !== undefined" class="q-pa-md">
        <q-list class="bg-dark-2 overflow-hidden rounded-borders">
          <q-expansion-item tag="label" :disable="!caseType.config.active">
            <template #header>
              <q-item-section side>
                <q-checkbox
                  v-model="caseType.config.custom_dm_message"
                  :disable="!caseType.config.active"
                  dense
                ></q-checkbox>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ $t('Components.CaseType.CustomDMMessage') }}
                </q-item-label>
              </q-item-section>
            </template>

            <q-card class="bg-dark-1 no-border-radius" bordered>
              <q-card-section>
                <MessageEditor
                  :message="caseType.config.dm_message"
                  :disable="!caseType.config.active || !caseType.config.custom_dm_message"
                />
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-list>
      </div>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-btn class="full-width" :label="$t('Common.Close')" unelevated no-caps color="dark-2" @click="onCancel" />
          </div>

          <div class="col-6">
            <q-btn
              class="full-width"
              :label="$t('Common.Done')"
              unelevated
              no-caps
              color="primary"
              @click="onConfirm"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { useDialogPluginComponent } from 'quasar'
import { useGuildStore } from 'src/stores/guild'
import { localeStringsMap } from 'src/utils/Constants'
import { defineComponent, ref } from 'vue'
import MessageEditor from '../MessageEditor.vue'

export default defineComponent({
  name: 'ModerationCaseType',

  emits: [...useDialogPluginComponent.emits],

  props: {
    caseTypeProp: {
      type: Object,
      required: true
    }
  },

  components: {
    MessageEditor
  },

  setup(props) {
    const guild = useGuildStore()
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const caseType = ref(JSON.parse(JSON.stringify(props.caseTypeProp)))

    return {
      guild,

      dialogRef,
      localeStringsMap,

      onConfirm() {
        onDialogOK(caseType.value)
      },

      onCancel() {
        onDialogCancel()
      },

      onDismiss() {
        onDialogHide()
      },

      caseType
    }
  }
})
</script>
