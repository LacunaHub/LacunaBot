<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDismiss"
    transition-show="jump-down"
    transition-hide="jump-up"
    no-esc-dismiss
    no-shake
  >
    <q-card class="bg-dark-1" flat style="width: 1280px; max-width: 90vw">
      <q-card-section class="q-pa-none">
        <div class="row q-col-gutter-md">
          <div class="col-12 full-height">
            <vue-monaco-editor
              v-model:value="component.action.execute_code.code"
              theme="vs-dark"
              height="70vh"
              language="javascript"
              :options="editorOptions"
            ></vue-monaco-editor>
          </div>
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-btn class="full-width" :label="$t('close')" unelevated no-caps color="dark-2" @click="onCancel" />
          </div>

          <div class="col-6">
            <q-btn
              class="full-width"
              :label="$t('done')"
              unelevated
              no-caps
              color="primary"
              :disable="!isValid"
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
import { computed, defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'ComponentActionExecuteCode',

  emits: [...useDialogPluginComponent.emits],

  props: {
    componentProp: {
      type: Object,
      required: true
    }
  },

  setup(props) {
    const guild = useGuildStore()
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const editorOptions = {
      fixedOverflowWidgets: true,
      tabSize: 2,
      minimap: {
        enabled: false
      },
      padding: {
        top: 16
      }
    }

    const component = ref(JSON.parse(JSON.stringify(props.componentProp)))

    const isValid = computed(() => {
      return Boolean(component.value.action.execute_code.code)
    })

    return {
      guild,
      dialogRef,
      editorOptions,

      component,
      isValid,

      onConfirm() {
        onDialogOK({ component: component.value })
      },

      onCancel() {
        onDialogCancel()
      },

      onDismiss() {
        onDialogHide()
      }
    }
  }
})
</script>
