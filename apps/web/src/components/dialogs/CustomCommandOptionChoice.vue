<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="rounded-lg bg-dark-grey-2" style="width: 800px; max-width: 90vw">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('custom_command.co_choice_name_title') }}
            </div>

            <q-input
              v-model.trim="choice.name"
              class="q-pt-sm"
              :maxlength="100"
              filled
              dense
              hide-bottom-space
            ></q-input>
          </div>

          <div class="col-12">
            <div>
              {{ $t('custom_command.co_choice_value_title') }}
            </div>

            <q-input
              v-model="choice.value"
              class="q-pt-sm"
              :maxlength="100"
              filled
              dense
              hide-bottom-space
              @update:model-value="onChangeValue"
            ></q-input>
          </div>
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-btn class="full-width" :label="$t('close')" unelevated no-caps color="dark-grey-3" @click="onCancel" />
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
import { computed, defineComponent, ref } from 'vue'
import { useDialogPluginComponent } from 'quasar'

export default defineComponent({
  name: 'CustomCommandOptionChoice',

  emits: [...useDialogPluginComponent.emits],

  props: {
    optionType: {
      type: Number,
      required: true
    },
    choiceProp: {
      type: Object,
      default: null
    }
  },

  setup(props) {
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const mode = ref(props.choiceProp ? 'UPDATE' : 'CREATE')
    const choice = ref(
      mode.value === 'UPDATE'
        ? JSON.parse(JSON.stringify(props.choiceProp))
        : {
            name: 'choice',
            value: props.optionType === 3 ? 'Choice Value' : 0
          }
    )

    const isValid = computed(() => {
      return Boolean(choice.value.name?.length && choice.value.value !== '')
    })

    return {
      dialogRef,
      mode,
      choice,

      isValid,

      onConfirm() {
        if (isValid.value) {
          onDialogOK({ mode: mode.value, choice: choice.value })
        }
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
    onChangeValue(value) {
      if (this.optionType === 3) value = String(value).trim()
      if ([4, 10].includes(this.optionType)) value = Number(value)

      this.choice.value = value
    }
  }
})
</script>
