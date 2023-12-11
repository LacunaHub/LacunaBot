<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="bg-dark-1" flat style="width: 800px; max-width: 90vw">
      <div class="q-pa-md">
        <q-list class="bg-dark-2 overflow-hidden rounded-borders">
          <q-expansion-item
            v-for="action in ['MODIFY_ROLES', 'OVERWRITE_CHANNEL_PERMISSIONS', 'RESTRICT_ROLES']"
            :key="action"
            tag="label"
          >
            <template #header>
              <q-item-section side>
                <q-checkbox
                  v-model="reaction.options"
                  :val="action"
                  dense
                  @update:model-value="onSelectOption"
                ></q-checkbox>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ $t(localeStringsMap.actions[action]) }}
                </q-item-label>
              </q-item-section>
            </template>

            <q-card v-if="action === 'MODIFY_ROLES'" class="bg-dark-1 no-border-radius" bordered>
              <q-card-section>
                <div class="row q-col-gutter-md">
                  <div class="col-12">
                    <div>
                      {{ $t('Common.AddRoles') }}
                    </div>

                    <q-select
                      v-if="reaction.options.includes('MODIFY_ROLES')"
                      v-model="reaction.modify_roles.add"
                      :options="guild.rolesUnmanaged"
                      option-label="name"
                      option-value="id"
                      use-chips
                      class="q-pt-sm"
                      multiple
                      filled
                      dense
                      hide-bottom-space
                      emit-value
                      map-options
                    >
                      <template #selected-item="{ opt, index, removeAtIndex }">
                        <q-chip
                          square
                          :label="opt.name ?? opt"
                          size="sm"
                          :style="`background: ${opt.color}`"
                          removable
                          @remove="removeAtIndex(index)"
                        ></q-chip>
                      </template>

                      <template #option="{ opt, toggleOption, selected }">
                        <q-item
                          clickable
                          @click="toggleOption(opt)"
                          :active="selected"
                          :disable="opt.higher"
                          active-class="menu-item--active"
                        >
                          <q-item-section>
                            <q-item-label :style="`color: ${opt.color}`">{{ opt.name }}</q-item-label>
                          </q-item-section>
                        </q-item>
                      </template>

                      <template #prepend>
                        <q-checkbox v-model="reaction.modify_roles.reversible_add" dense>
                          <q-tooltip
                            class="bg-black text-body2"
                            anchor="top middle"
                            self="bottom middle"
                            transition-show=""
                            transition-hide=""
                          >
                            {{ $t('Components.InteractiveMessage.ModifyRolesReversibleMode') }}
                          </q-tooltip>
                        </q-checkbox>
                      </template>
                    </q-select>

                    <q-select v-else disable class="q-pt-sm" filled dense hide-bottom-space>
                      <template #prepend>
                        <q-checkbox dense>
                          <q-tooltip
                            class="bg-black text-body2"
                            anchor="top middle"
                            self="bottom middle"
                            transition-show=""
                            transition-hide=""
                          >
                            {{ $t('Components.InteractiveMessage.ModifyRolesReversibleMode') }}
                          </q-tooltip>
                        </q-checkbox>
                      </template>
                    </q-select>
                  </div>

                  <div class="col-12">
                    <div>
                      {{ $t('Common.RemoveRoles') }}
                    </div>

                    <q-select
                      v-if="reaction.options.includes('MODIFY_ROLES')"
                      v-model="reaction.modify_roles.remove"
                      :options="guild.rolesUnmanaged"
                      option-label="name"
                      option-value="id"
                      use-chips
                      class="q-pt-sm"
                      multiple
                      filled
                      dense
                      hide-bottom-space
                      emit-value
                      map-options
                    >
                      <template #selected-item="{ opt, index, removeAtIndex }">
                        <q-chip
                          square
                          :label="opt.name ?? opt"
                          size="sm"
                          :style="`background: ${opt.color}`"
                          removable
                          @remove="removeAtIndex(index)"
                        ></q-chip>
                      </template>

                      <template #option="{ opt, toggleOption, selected }">
                        <q-item
                          clickable
                          @click="toggleOption(opt)"
                          :active="selected"
                          :disable="opt.higher"
                          active-class="menu-item--active"
                        >
                          <q-item-section>
                            <q-item-label :style="`color: ${opt.color}`">{{ opt.name }}</q-item-label>
                          </q-item-section>
                        </q-item>
                      </template>

                      <template #prepend>
                        <q-checkbox v-model="reaction.modify_roles.reversible_remove" dense>
                          <q-tooltip
                            class="bg-black text-body2"
                            anchor="top middle"
                            self="bottom middle"
                            transition-show=""
                            transition-hide=""
                          >
                            {{ $t('Components.InteractiveMessage.ModifyRolesReversibleMode') }}
                          </q-tooltip>
                        </q-checkbox>
                      </template>
                    </q-select>

                    <q-select v-else disable class="q-pt-sm" filled dense hide-bottom-space>
                      <template #prepend>
                        <q-checkbox dense>
                          <q-tooltip
                            class="bg-black text-body2"
                            anchor="top middle"
                            self="bottom middle"
                            transition-show=""
                            transition-hide=""
                          >
                            {{ $t('Components.InteractiveMessage.ModifyRolesReversibleMode') }}
                          </q-tooltip>
                        </q-checkbox>
                      </template>
                    </q-select>
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <q-card v-if="action === 'OVERWRITE_CHANNEL_PERMISSIONS'" class="bg-dark-1 no-border-radius" bordered>
              <q-card-section>
                <div class="row q-col-gutter-md">
                  <div class="col-12">
                    <div>
                      {{ $t('Common.Channels') }}
                    </div>

                    <q-select
                      v-if="reaction.options.includes('OVERWRITE_CHANNEL_PERMISSIONS')"
                      v-model="reaction.overwrite_channel_permissions.channels"
                      :options="guild.channels"
                      :max-values="8"
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
                        <q-item
                          clickable
                          @click="toggleOption(opt)"
                          :active="selected"
                          active-class="menu-item--active"
                        >
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

                    <q-select v-else disable class="q-pt-sm" filled dense hide-bottom-space></q-select>
                  </div>

                  <div class="col-12">
                    <q-btn-dropdown
                      class="full-width"
                      :label="$t('Common.Permissions')"
                      :disable="!reaction.options.includes('OVERWRITE_CHANNEL_PERMISSIONS')"
                      unelevated
                      no-caps
                      color="dark-2"
                    >
                      <q-list>
                        <q-item v-for="(permission, i) in Object.keys(channelPermissions)" :key="i" tag="label">
                          <q-item-section>
                            <q-item-label>
                              {{ $t(localeStringsMap.discordPermissions[permission]) }}
                            </q-item-label>
                          </q-item-section>

                          <q-item-section side>
                            <q-checkbox
                              v-model="reaction.overwrite_channel_permissions.permissions[permission]"
                              toggle-indeterminate
                              dense
                            ></q-checkbox>
                          </q-item-section>
                        </q-item>
                      </q-list>
                    </q-btn-dropdown>
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <q-card v-if="action === 'RESTRICT_ROLES'" class="bg-dark-1 no-border-radius" bordered>
              <q-card-section>
                <div class="row q-col-gutter-md">
                  <div class="col-12">
                    <div>
                      {{ $t('Common.BlockedRoles') }}
                    </div>

                    <q-select
                      v-if="reaction.options.includes('RESTRICT_ROLES')"
                      v-model="reaction.restricted_roles"
                      :options="guild.roles"
                      option-label="name"
                      option-value="id"
                      use-chips
                      class="q-pt-sm"
                      multiple
                      filled
                      dense
                      hide-bottom-space
                      emit-value
                      map-options
                    >
                      <template #selected-item="{ opt, index, removeAtIndex }">
                        <q-chip
                          square
                          :label="opt.name ?? opt"
                          size="sm"
                          :style="`background: ${opt.color}`"
                          removable
                          @remove="removeAtIndex(index)"
                        ></q-chip>
                      </template>

                      <template #option="{ opt, toggleOption, selected }">
                        <q-item
                          clickable
                          @click="toggleOption(opt)"
                          :active="selected"
                          active-class="menu-item--active"
                        >
                          <q-item-section>
                            <q-item-label :style="`color: ${opt.color}`">{{ opt.name }}</q-item-label>
                          </q-item-section>
                        </q-item>
                      </template>
                    </q-select>

                    <q-select v-else disable class="q-pt-sm" filled dense hide-bottom-space></q-select>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
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
import { discordChannelPermissions, localeStringsMap } from 'src/utils/Constants'
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'UtilityInteractiveMessageReaction',

  emits: [...useDialogPluginComponent.emits],

  props: {
    reactionProp: {
      type: Object,
      required: true
    }
  },

  setup(props) {
    const guild = useGuildStore()
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const reaction = ref(JSON.parse(JSON.stringify(props.reactionProp))),
      channelPermissions = ref(discordChannelPermissions)

    return {
      guild,
      dialogRef,
      reaction,
      channelPermissions,
      localeStringsMap,

      onConfirm() {
        onDialogOK({ reaction: reaction.value })
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
    onSelectOption(options) {
      if (options.includes('MODIFY_ROLES') && !this.reaction.modify_roles) {
        this.reaction.modify_roles = {
          add: [],
          remove: [],
          reversible_add: true,
          reversible_remove: false,
          duration: 0
        }
      }

      if (options.includes('OVERWRITE_CHANNEL_PERMISSIONS') && !this.reaction.overwrite_channel_permissions) {
        this.reaction.overwrite_channel_permissions = {
          channels: [],
          permissions: {},
          reversible: true
        }
      }

      if (options.includes('RESTRICT_ROLES') && !this.reaction.restricted_roles) {
        this.reaction.restricted_roles = []
      }

      if (!options.includes('MODIFY_ROLES')) {
        delete this.reaction.modify_roles
      }

      if (!options.includes('OVERWRITE_CHANNEL_PERMISSIONS')) {
        delete this.reaction.overwrite_channel_permissions
      }

      if (!options.includes('RESTRICT_ROLES')) {
        delete this.reaction.restricted_roles
      }
    }
  }
})
</script>
