<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="bg-dark-1" flat style="width: 800px; max-width: 90vw">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-9">
            <div>
              {{ $t('Common.Name') }}
            </div>

            <q-input v-model="field.label" class="q-pt-sm" :maxlength="100" filled dense hide-bottom-space></q-input>
          </div>

          <div class="col-3">
            <div>
              {{ $t('Components.CustomCommand.CommandArgumentType') }}
            </div>

            <q-select
              v-model="field.style"
              :options="['Short', 'Paragraph']"
              class="q-pt-sm"
              filled
              dense
              hide-bottom-space
              map-options
              emit-value
            >
              <template #selected-item="{ opt }">
                <span>
                  {{ opt }}
                </span>
              </template>

              <template #option="{ opt, toggleOption, selected }">
                <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                  <q-item-section>
                    <q-item-label>
                      {{ opt }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div class="col-12">
            <div>
              {{ $t('Common.Identifier') }}
            </div>

            <q-input v-model="field.customId" class="q-pt-sm" :maxlength="100" filled dense hide-bottom-space></q-input>
          </div>

          <div class="col-12">
            <div>
              {{ $t('Components.CustomCommand.ShowModalFieldPlaceholder') }}
            </div>

            <q-input
              v-model="field.placeholder"
              class="q-pt-sm"
              :maxlength="100"
              filled
              dense
              hide-bottom-space
            ></q-input>
          </div>

          <div class="col-6">
            <div>
              {{ $t('Components.CustomCommand.ShowModalFieldMinLength') }}
            </div>

            <q-input
              v-model.number="field.minLength"
              class="q-pt-sm"
              :min="0"
              :max="4000"
              type="number"
              filled
              dense
              hide-bottom-space
            ></q-input>
          </div>

          <div class="col-6">
            <div>
              {{ $t('Components.CustomCommand.ShowModalFieldMaxLength') }}
            </div>

            <q-input
              v-model.number="field.maxLength"
              class="q-pt-sm"
              :min="1"
              :max="4000"
              type="number"
              filled
              dense
              hide-bottom-space
            ></q-input>
          </div>

          <div class="col-12">
            <div>
              {{ $t('Components.CustomCommand.ShowModalFieldDefaultValue') }}
            </div>

            <q-input v-model="field.value" class="q-pt-sm" filled dense hide-bottom-space></q-input>
          </div>
        </div>
      </q-card-section>

      <div class="q-pa-md">
        <q-list class="bg-dark-2 overflow-hidden rounded-borders">
          <q-item tag="label">
            <q-item-section side>
              <q-checkbox v-model="field.required" dense></q-checkbox>
            </q-item-section>

            <q-item-section>
              <q-item-label>
                {{ $t('Commands.HelpCommand.Texts.CommandArgumentRequired') }}
              </q-item-label>
            </q-item-section>
          </q-item>
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
  name: 'ComponentActionShowModalField',

  emits: [...useDialogPluginComponent.emits],

  props: {
    fieldProp: {
      type: Object,
      required: true
    }
  },

  setup(props) {
    const guild = useGuildStore()
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const field = ref(JSON.parse(JSON.stringify(props.fieldProp)))

    const isValid = computed(() => {
      return Boolean(field.value.customId && field.value.label)
    })

    return {
      guild,
      dialogRef,
      field,

      isValid,

      onConfirm() {
        if (field.value.maxLength < 1) field.value.maxLength = 1
        if (field.value.maxLength > 4000) field.value.maxLength = 4000
        if (field.value.minLength < 0) field.value.minLength = 0
        if (field.value.minLength > 4000) field.value.minLength = 4000

        if (isValid.value) {
          onDialogOK({ field: field.value })
        }
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
