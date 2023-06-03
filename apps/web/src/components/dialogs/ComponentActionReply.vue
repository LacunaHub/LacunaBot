<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="rounded-lg bg-dark-1" flat style="width: 1000px; max-width: 90vw">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('common.message') }}
            </div>

            <MessageEditor
              :message="component.action.reply.message"
              hide-replacers
              hide-code-snippets
              :disable-components="false"
              class="q-pt-sm"
            />
          </div>
        </div>
      </q-card-section>

      <q-item v-for="option in ['EPHEMERAL']" :key="option" class="q-my-sm" tag="label" dense v-ripple>
        <q-item-section>
          <q-item-label>
            {{ $t(`common.actions_keys.EPHEMERAL_REPLY`) }}
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-checkbox v-model="component.action.reply.options" :val="option" dense></q-checkbox>
        </q-item-section>
      </q-item>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-btn class="full-width" :label="$t('close')" unelevated no-caps color="dark-2" @click="onCancel" />
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
import MessageEditor from '../MessageEditor.vue'

export default defineComponent({
  name: 'ComponentActionReply',

  emits: [...useDialogPluginComponent.emits],

  props: {
    componentProp: {
      type: Object,
      required: true
    }
  },

  components: {
    MessageEditor
  },

  setup(props) {
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const component = ref(JSON.parse(JSON.stringify(props.componentProp)))

    return {
      dialogRef,
      component,

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
