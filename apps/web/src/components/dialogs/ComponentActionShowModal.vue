<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="bg-dark-1" flat style="width: 800px; max-width: 90vw">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('name') }}
            </div>

            <q-input
              v-model="component.action.show_modal.title"
              class="q-pt-sm"
              :maxlength="100"
              filled
              dense
              hide-bottom-space
            ></q-input>
          </div>

          <div class="col-12">
            <div>
              {{ $t('identifier') }}
            </div>

            <q-input
              v-model="component.action.show_modal.customId"
              class="q-pt-sm"
              :maxlength="100"
              filled
              dense
              hide-bottom-space
            ></q-input>
          </div>
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div v-for="(row, i) in component.action.show_modal.components" :key="i" class="col-12">
            <q-item
              v-for="(field, ii) in row"
              :key="ii"
              class="bg-dark-2 cursor-pointer"
              clickable
              @click="fieldDialog(field, i)"
            >
              <q-item-section>
                <q-item-label>
                  {{ field.label }}
                </q-item-label>

                <q-item-label class="text--secondary">
                  {{ field.style }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-btn @click="removeField(i)" :label="$t('remove')" color="negative" flat no-caps unelevated></q-btn>
              </q-item-section>
            </q-item>
          </div>

          <div class="col-12">
            <q-btn
              class="full-width dashed-border"
              :label="$t('message_editor.add_embed_field')"
              @click="addField"
              :disable="component.action.show_modal.components.length >= 5"
              unelevated
              no-caps
            />
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
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { useGuildStore } from 'src/stores/guild'
import { computed, defineComponent, ref } from 'vue'
import ComponentActionShowModalField from './ComponentActionShowModalField.vue'

export default defineComponent({
  name: 'ComponentActionShowModal',

  emits: [...useDialogPluginComponent.emits],

  props: {
    componentProp: {
      type: Object,
      required: true
    }
  },

  setup(props) {
    const $q = useQuasar()
    const guild = useGuildStore()
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const component = ref(JSON.parse(JSON.stringify(props.componentProp)))

    const isValid = computed(() => {
      return Boolean(
        component.value.action.show_modal.title &&
          component.value.action.show_modal.customId &&
          component.value.action.show_modal.components.length
      )
    })

    const addField = () => {
        if (component.value.action.show_modal.components.length >= 5) return

        component.value.action.show_modal.components.push([
          {
            type: 'TextInput',
            customId: 'field-id',
            label: 'Field',
            maxLength: 4000,
            minLength: 0,
            placeholder: null,
            required: false,
            style: 'Short',
            value: null
          }
        ])
      },
      removeField = index => {
        component.value.action.show_modal.components.splice(index, 1)
      }
    const fieldDialog = (field, index) => {
      $q.dialog({
        component: ComponentActionShowModalField,

        componentProps: { fieldProp: field }
      }).onOk(({ field }) => {
        component.value.action.show_modal.components[index] = [field]
      })
    }

    return {
      guild,
      dialogRef,
      component,

      isValid,

      addField,
      removeField,
      fieldDialog,

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
