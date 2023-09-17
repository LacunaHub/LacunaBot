<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="rounded-lg bg-dark-1" flat style="width: 800px; max-width: 90vw">
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
        <div v-if="getAutomationLoading" class="text-center">
          <q-spinner-tail color="white" size="32px"></q-spinner-tail>
        </div>

        <div v-if="!getAutomationLoading">
          <div class="q-pb-sm">
            {{ $t('custom_command.command_templates') }}
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6" v-for="automation in publicAutomation" :key="automation._id">
              <q-card class="bg-dark-2" flat>
                <q-item class="rounded-lg" clickable v-ripple @click="onSelectPublishedAutomation(automation)">
                  <q-item-section>
                    <q-item-label class="text-subtitle1">
                      {{ automation.name }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>
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
import { interfaces } from 'src/boot/axios'
import { useGuildStore } from 'src/stores/guild'
import { handleAxiosError, resolveAutomationJSON } from 'src/utils/Utils'
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

    const publicAutomation = ref([]),
      getAutomationLoading = ref(true)

    return {
      guild,
      dialogRef,

      automation,
      file,

      publicAutomation,
      getAutomationLoading,

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
    async getPublicAutomation() {
      try {
        const response = await interfaces.common.getAutomationTasks(),
          { data } = response

        this.publicAutomation = data

        return true
      } catch (err) {
        const error = handleAxiosError(err)

        this.$q.notify({
          message: error.message,
          classes: 'rounded-lg q-notification-custom',
          color: 'black',
          icon: 'error',
          iconColor: 'negative',
          timeout: 5000
        })
      }

      return false
    },
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
    },
    async onSelectPublishedAutomation(automation) {
      this.getAutomationLoading = true

      try {
        const { data } = await interfaces.common.getAutomationTask(automation._id, this.guild._id)
        const json = JSON.parse(data.data)

        this.automation = resolveAutomationJSON(json)
        this.onConfirm()
        event('import_public_automation', { event_category: 'utility' })
      } catch (err) {
        const error = handleAxiosError(err)

        this.$q.notify({
          message: error.message,
          classes: 'rounded-lg q-notification-custom',
          color: 'black',
          icon: 'error',
          iconColor: 'negative',
          timeout: 5000
        })
      } finally {
        this.getAutomationLoading = false
      }
    }
  },

  async mounted() {
    const getPublicAutomationSuccess = await this.getPublicAutomation()

    this.getAutomationLoading = !getPublicAutomationSuccess
  }
})
</script>
