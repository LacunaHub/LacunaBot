<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDismiss"
    transition-show="jump-down"
    transition-hide="jump-up"
    backdrop-filter="blur(8px)"
    :maximized="$q.screen.lt.sm"
  >
    <q-card class="q-dialog-card q-dialog-card-md bg-dark-1" flat>
      <q-card-section class="q-dialog-card-content">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('Common.Channels') }}
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
                    color="dark-1"
                    square
                    :label="opt.name ?? opt"
                    :icon="opt.icon"
                    size="sm"
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
              <q-btn-dropdown class="full-width" :label="$t('Common.Permissions')" unelevated no-caps color="dark-2">
                <q-list>
                  <q-item v-for="(permission, i) in Object.keys(discordChannelPermissions)" :key="i" tag="label">
                    <q-item-section>
                      <q-item-label>
                        {{ $t(localeStringsMap.discordPermissions[permission]) }}
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
                {{ $t('Components.CustomCommand.OverwriteChannelPermissionsUserOrRoleId') }}
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
      </q-card-section>

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
import { discordChannelPermissions, localeStringsMap } from 'src/utils/Constants'
import { computed, defineComponent, ref } from 'vue'

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
      localeStringsMap,

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
