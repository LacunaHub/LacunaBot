<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="rounded-lg bg-dark-1" flat style="width: 800px; max-width: 90vw">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('common.channels') }}
            </div>

            <q-select
              v-model="component.action.overwrite_channel_permissions.channels"
              :options="guild.channels"
              :max-values="5"
              option-label="name"
              option-value="id"
              class="q-pt-sm"
              filled
              dense
              hide-bottom-space
              emit-value
              map-options
              multiple
            >
              <template #selected-item="{ opt, index, removeAtIndex }">
                <q-chip
                  class="rounded-lg"
                  color="dark-1"
                  square
                  :label="opt.name ?? opt"
                  :icon="opt.icon"
                  size="sm"
                  :ripple="false"
                  removable
                  @remove="removeAtIndex(index)"
                ></q-chip>
              </template>

              <template #option="{ opt, toggleOption, selected }">
                <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                  <q-item-section avatar>
                    <q-icon :name="opt.icon"></q-icon>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label>
                      {{ opt.name }}
                    </q-item-label>

                    <q-item-label class="text--secondary">
                      {{ opt.parentName }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div class="col-12">
            <q-btn-dropdown class="full-width" :label="$t('common.permissions')" unelevated no-caps color="dark-2">
              <q-list>
                <q-item v-for="(permission, i) in Object.keys(discordChannelPermissions)" :key="i" tag="label" v-ripple>
                  <q-item-section>
                    <q-item-label>
                      {{ $t(`common.permissions_keys.${permission}`) }}
                    </q-item-label>
                  </q-item-section>

                  <q-item-section side>
                    <q-checkbox
                      v-model="component.action.overwrite_channel_permissions.permissions[permission]"
                      toggle-indeterminate
                      dense
                    ></q-checkbox>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </div>

          <div class="col-12">
            <div>
              {{ 'Идентификатор пользователя или роли' }}
            </div>

            <q-input
              v-model.trim="component.action.overwrite_channel_permissions.user_or_role"
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
import { discordChannelPermissions } from 'src/utils/Constants'

export default defineComponent({
  name: 'ComponentActionOverwriteChannelPermissions',

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
      return Boolean(
        component.value.action.overwrite_channel_permissions.channels.length &&
          component.value.action.overwrite_channel_permissions.user_or_role
      )
    })

    return {
      dialogRef,
      guild,
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
      },

      discordChannelPermissions
    }
  }
})
</script>
