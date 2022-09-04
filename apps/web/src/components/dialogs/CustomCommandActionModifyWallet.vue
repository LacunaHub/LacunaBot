<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="rounded-lg bg-dark-1" flat style="width: 800px; max-width: 90vw">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <!-- <div class="col-12">
            <div>
              {{ $t('custom_command.cv_operator_title') }}
            </div>

            <q-select
              v-model="component.action.modify_wallet.operator"
              :options="['INCREMENT', 'DECREMENT']"
              class="q-pt-sm"
              filled
              dense
              hide-bottom-space
            >
              <template #selected-item="{ opt }">
                <span class="text-uppercase">
                  {{ $t(`custom_command.mw_operators.${opt}`) }}
                </span>
              </template>

              <template #option="{ opt, toggleOption, selected }">
                <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                  <q-item-section>
                    <q-item-label class="text-uppercase">
                      {{ $t(`custom_command.mw_operators.${opt}`) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div> -->

          <div class="col-12">
            <div>
              {{ $t('custom_command.mw_amount_title') }}
            </div>

            <q-input
              v-model.trim="component.action.modify_wallet.amount"
              class="q-pt-sm"
              :maxlength="256"
              filled
              dense
              hide-bottom-space
              autogrow
            ></q-input>
          </div>

          <div class="col-12">
            <div>
              {{ $t('custom_command.mr_user_id_title') }}
            </div>
            <div class="text--secondary">
              {{ $t('custom_command.mw_user_id_description') }}
            </div>

            <q-input
              v-model.trim="component.action.modify_wallet.user_id"
              class="q-pt-sm"
              :maxlength="256"
              filled
              dense
              hide-bottom-space
              autogrow
            ></q-input>
          </div>

          <div class="col-12">
            <div>
              {{ $t('custom_command.mw_currency_id_title') }}
            </div>
            <div class="text--secondary">
              {{ $t('custom_command.mw_currency_id_description') }}
            </div>

            <q-input
              v-model.trim="component.action.modify_wallet.currency_id"
              class="q-pt-sm"
              :maxlength="256"
              filled
              dense
              hide-bottom-space
              autogrow
            ></q-input>
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
import { computed, defineComponent, ref } from 'vue'
import { useDialogPluginComponent } from 'quasar'
import { useGuildStore } from 'src/stores/guild'

export default defineComponent({
  name: 'CustomCommandActionModifyWallet',

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

    const component = ref(JSON.parse(JSON.stringify(props.componentProp)))

    const isValid = computed(() => {
      return Boolean(component.value.action.modify_wallet.amount)
    })

    return {
      guild,
      dialogRef,
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
