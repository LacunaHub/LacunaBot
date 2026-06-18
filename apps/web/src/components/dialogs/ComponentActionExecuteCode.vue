<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDismiss"
    transition-show="jump-down"
    transition-hide="jump-up"
    no-esc-dismiss
    no-shake
    backdrop-filter="blur(8px)"
    :maximized="$q.screen.lt.sm"
  >
    <q-card class="q-dialog-card bg-dark-1 overflow-hidden" flat>
      <vue-monaco-editor
        v-model:value="component.action.execute_code.code"
        theme="vs-dark"
        :height="$q.screen.lt.sm ? 'calc(100vh - 120px)' : '70vh'"
        language="javascript"
        :options="editorOptions"
      ></vue-monaco-editor>

      <q-card-section class="q-dialog-card-actions row reverse q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-btn
            class="full-width"
            :label="$t('Common.Done')"
            unelevated
            no-caps
            color="primary"
            :disable="!isValid"
            @click="onConfirm"
          />
        </div>

        <div class="col-12 col-md-6">
          <q-btn class="full-width" :label="$t('Common.Close')" unelevated no-caps color="dark-2" @click="onCancel" />
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
