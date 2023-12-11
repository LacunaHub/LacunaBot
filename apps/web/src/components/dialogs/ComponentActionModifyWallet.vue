<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="bg-dark-1" flat style="width: 800px; max-width: 90vw">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('Components.CustomCommand.ModifyWalletAmount') }}
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
              {{ $t('Components.CustomCommand.ModifyRolesUserId') }}
            </div>
            <div class="text--secondary">
              {{ $t('Components.CustomCommand.ModifyWalletUserIdDescription') }}
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
              {{ $t('Components.CustomCommand.ModifyWalletCurrencyId') }}
            </div>
            <div class="text--secondary">
              {{ $t('Components.CustomCommand.ModifyWalletCurrencyIdDescription') }}
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
  name: 'ComponentActionModifyWallet',

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
