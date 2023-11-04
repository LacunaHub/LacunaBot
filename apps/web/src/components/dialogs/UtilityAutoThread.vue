<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="bg-dark-1" flat style="width: 800px; max-width: 90vw">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('common.channel') }}
            </div>

            <q-select
              v-if="mode === 'CREATE'"
              v-model="autoThread.channel_id"
              :options="unusedTextChannels"
              option-label="name"
              option-value="id"
              class="q-pt-sm"
              filled
              dense
              hide-bottom-space
              emit-value
              map-options
            >
              <template #selected-item="{ opt }">
                <q-chip color="dark-1" square :label="opt.name ?? opt" :icon="opt.icon" size="sm"></q-chip>
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

            <q-select
              v-if="mode === 'UPDATE'"
              :model-value="autoThread.channel_id"
              :options="guild.channelsText"
              option-label="name"
              option-value="id"
              class="q-pt-sm"
              filled
              dense
              hide-bottom-space
              emit-value
              map-options
              disable
              readonly
            >
              <template #selected-item="{ opt }">
                <q-chip color="dark-1" square :label="opt.name ?? opt" :icon="opt.icon" size="sm"></q-chip>
              </template>
            </q-select>
          </div>

          <div class="col-12">
            <div>
              {{ $t('auto_threads.default_name_title') }}
            </div>

            <q-input
              v-model.trim="autoThread.name"
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
          <div class="col-12">
            <div>
              {{ $t('auto_reactions.text_matches_title') }}
            </div>
            <div class="text--secondary">
              {{ $t('auto_reactions.text_matches_description') }}
            </div>

            <q-select
              v-model="autoThread.matches"
              class="q-pt-sm"
              filled
              dense
              hide-bottom-space
              hide-dropdown-icon
              use-input
              use-chips
              new-value-mode="add-unique"
              multiple
            >
              <template #selected-item="{ opt, index, removeAtIndex }">
                <q-chip color="dark-1" square :label="opt" size="sm" removable @remove="removeAtIndex(index)"></q-chip>
              </template>
            </q-select>
          </div>

          <div class="col-12">
            <div>
              {{ $t('auto_reactions.excluded_text_matches_title') }}
            </div>
            <div class="text--secondary">
              {{ $t('auto_reactions.excluded_text_matches_description') }}
            </div>

            <q-select
              v-model="autoThread.exclude_matches"
              class="q-pt-sm"
              filled
              dense
              hide-bottom-space
              hide-dropdown-icon
              use-input
              use-chips
              new-value-mode="add-unique"
              multiple
            >
              <template #selected-item="{ opt, index, removeAtIndex }">
                <q-chip color="dark-1" square :label="opt" size="sm" removable @remove="removeAtIndex(index)"></q-chip>
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
              class="full-width"
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
import { useDialogPluginComponent } from 'quasar'
import { useGuildStore } from 'src/stores/guild'
import { computed, defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'UtilityAutoThread',

  emits: [...useDialogPluginComponent.emits],

  props: {
    autoThreadProp: {
      type: Object,
      default: null
    }
  },

  setup(props) {
    const guild = useGuildStore()
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const mode = ref(props.autoThreadProp ? 'UPDATE' : 'CREATE')
    const autoThread = ref(
      mode.value === 'UPDATE'
        ? JSON.parse(JSON.stringify(props.autoThreadProp))
        : {
            channel_id: null,
            name: '{message.content | "Thread"}',
            matches: [],
            exclude_matches: []
          }
    )

    const isValid = computed(() => {
      return autoThread.value.channel_id && autoThread.value.name
    })

    const unusedTextChannels = computed(() => {
      return guild.channelsText.filter(i => !guild.modules.autothreads.some(j => j.channel_id === i.id))
    })

    return {
      guild,
      dialogRef,
      mode,
      autoThread,
      isValid,
      unusedTextChannels,

      onConfirm() {
        if (isValid.value) {
          onDialogOK({ mode: mode.value, autoThread: autoThread.value })
        }
      },

      onCancel() {
        onDialogCancel()
      },

      onDismiss() {
        onDialogHide()
      },

      onDelete() {
        onDialogOK({ mode: 'DELETE', autoThread: autoThread.value })
      }
    }
  }
})
</script>
