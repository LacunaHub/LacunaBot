<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="rounded-lg bg-dark-grey-2" style="width: 800px; max-width: 90vw">
      <q-item class="q-py-md rounded-t-lg" tag="label" v-ripple>
        <q-item-section>
          <q-item-label class="text-subtitle1 text-uppercase">
            {{ $t(`common.case_log_keys.${caseType.name}`) }}
          </q-item-label>
        </q-item-section>

        <q-item-section side top>
          <q-toggle v-model="caseType.config.active" dense></q-toggle>
        </q-item-section>
      </q-item>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('pages.guild.md_case_log_channel_title') }}
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
                <q-chip
                  class="rounded-lg"
                  color="dark-grey-1"
                  square
                  :label="opt.name ?? opt"
                  :icon="opt.icon"
                  size="sm"
                  :ripple="false"
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

      <q-list v-if="caseType.config.custom_dm_message !== undefined" class="q-px-none" padding dense>
        <q-item tag="label" :disable="!caseType.config.active" v-ripple="caseType.config.active">
          <q-item-section>
            <q-item-label>
              {{ $t('mod_case_type.custom_dm_message_title') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-checkbox
              v-model="caseType.config.custom_dm_message"
              :disable="!caseType.config.active"
              dense
            ></q-checkbox>
          </q-item-section>
        </q-item>
      </q-list>

      <q-card-section v-if="caseType.config.custom_dm_message !== undefined">
        <MessageEditor
          :message="caseType.config.dm_message"
          :disable="!caseType.config.active || !caseType.config.custom_dm_message"
        />
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-btn class="full-width" :label="$t('close')" unelevated no-caps color="dark-grey-3" @click="onCancel" />
          </div>

          <div class="col-6">
            <q-btn class="full-width" :label="$t('done')" unelevated no-caps color="primary" @click="onConfirm" />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { useDialogPluginComponent } from 'quasar'
import { useGuildStore } from 'src/stores/guild'
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
