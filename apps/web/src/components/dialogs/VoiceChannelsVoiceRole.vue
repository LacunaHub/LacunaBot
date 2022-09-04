<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="rounded-lg bg-dark-1" flat style="width: 800px; max-width: 90vw">
      <q-item class="q-py-md rounded-t-lg">
        <q-item-section>
          <q-item-label class="text-subtitle1 text-uppercase">
            {{ $t(mode === 'CREATE' ? 'voice_roles.add_voice_role' : 'voice_roles.edit_voice_role') }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('common.role') }}
            </div>

            <q-select
              v-model="voiceRole.role_id"
              :options="guild.rolesUnmanaged"
              option-label="name"
              option-value="id"
              use-chips
              class="q-pt-sm"
              filled
              dense
              hide-bottom-space
              emit-value
              map-options
              :disable="mode === 'UPDATE'"
              :readonly="mode === 'UPDATE'"
            >
              <template #selected-item="{ opt, index, removeAtIndex }">
                <q-chip
                  class="rounded-lg"
                  square
                  :label="opt.name ?? opt"
                  size="sm"
                  :style="`background: ${opt.color}`"
                  :ripple="false"
                  removable
                  @remove="removeAtIndex(index)"
                ></q-chip>
              </template>

              <template #option="{ opt, toggleOption, selected }">
                <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                  <q-item-section>
                    <q-item-label :style="`color: ${opt.color}`">{{ opt.name }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div class="col-12">
            <div>
              {{ $t('common.channels') }}
            </div>
            <div class="text--secondary">
              {{ $t('voice_roles.bound_channels_description') }}
            </div>

            <q-select
              v-model="voiceRole.bound_channels_id"
              :options="guild.channelsVoice"
              option-label="name"
              option-value="id"
              class="q-pt-sm"
              filled
              dense
              multiple
              hide-bottom-space
              emit-value
              map-options
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
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-btn class="full-width" :label="$t('close')" unelevated no-caps color="dark-2" @click="onCancel" />
          </div>

          <div class="col-6">
            <q-btn
              v-if="mode === 'CREATE'"
              class="full-width"
              :label="$t('add')"
              :disable="!isValid"
              unelevated
              no-caps
              color="primary"
              @click="onConfirm"
            />
            <q-btn-dropdown
              v-if="mode === 'UPDATE'"
              class="full-width rounded-lg"
              :label="$t('done')"
              :disable="!isValid"
              split
              unelevated
              no-caps
              color="primary"
              @click="onConfirm"
            >
              <q-list dense>
                <q-item clickable v-close-popup @click="onDelete">
                  <q-item-section class="text-negative">
                    <q-item-label>
                      {{ $t('delete') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
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
  name: 'VoiceChannelsVoiceRole',

  emits: [...useDialogPluginComponent.emits],

  props: {
    voiceRoleProp: {
      type: Object,
      default: null
    }
  },

  setup(props) {
    const guild = useGuildStore()
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const mode = ref(props.voiceRoleProp ? 'UPDATE' : 'CREATE')
    const voiceRole = ref(
      mode.value === 'UPDATE'
        ? JSON.parse(JSON.stringify(props.voiceRoleProp))
        : {
            role_id: null,
            bound_channels_id: []
          }
    )

    const isValid = computed(() => {
      return voiceRole.value.role_id
    })

    return {
      guild,
      dialogRef,
      mode,
      voiceRole,
      isValid,

      onConfirm() {
        if (isValid.value) {
          onDialogOK({ mode: mode.value, voiceRole: voiceRole.value })
        }
      },

      onCancel() {
        onDialogCancel()
      },

      onDismiss() {
        onDialogHide()
      },

      onDelete() {
        onDialogOK({ mode: 'DELETE', voiceRole: voiceRole.value })
      }
    }
  }
})
</script>
