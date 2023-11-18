<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="bg-dark-1" flat style="width: 800px; max-width: 90vw">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('common.select_file') }}
            </div>

            <q-file
              v-model="file"
              class="q-pt-sm"
              accept=".json"
              filled
              dense
              hide-bottom-space
              @update:model-value="onSelectFile"
            ></q-file>
          </div>
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-btn class="full-width" :label="$t('close')" unelevated no-caps color="dark-2" @click="onCancel" />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { useDialogPluginComponent } from 'quasar'
import { useGuildStore } from 'src/stores/guild'
import { resolveAutomationJSON } from 'src/utils/Utils'
import { defineComponent, ref } from 'vue'
import { event } from 'vue-gtag'

export default defineComponent({
  name: 'AutomationTaskImport',

  emits: [...useDialogPluginComponent.emits],

  setup() {
    const guild = useGuildStore()
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const automation = ref(null),
      file = ref(null)

    return {
      guild,
      dialogRef,

      automation,
      file,

      onConfirm() {
        onDialogOK({ automation: automation.value })
      },

      onCancel() {
        onDialogCancel()
      },

      onDismiss() {
        onDialogHide()
      }
    }
  },

  methods: {
    onSelectFile(file) {
      const reader = new FileReader()

      reader.onload = e => {
        let json

        try {
          json = JSON.parse(e.target.result)
        } catch (err) {
          json = null
        }

        event('import_custom_automation', { event_category: 'utility' })

        this.automation = resolveAutomationJSON(json)
        this.onConfirm()
      }

      reader.readAsText(file)
    }
  }
})
</script>
