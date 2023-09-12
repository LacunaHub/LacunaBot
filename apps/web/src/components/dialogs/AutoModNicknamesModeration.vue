<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="rounded-lg bg-dark-1" flat style="width: 1000px; max-width: 90vw">
      <q-item class="q-py-md rounded-t-lg" tag="label" v-ripple>
        <q-item-section>
          <q-item-label class="text-subtitle1 text-uppercase">
            {{ $t(`automoder.titles.${name}`) }}
          </q-item-label>
        </q-item-section>

        <q-item-section side top>
          <q-toggle v-model="config.active" dense></q-toggle>
        </q-item-section>
      </q-item>

      <q-list class="q-px-none q-py-md" dense>
        <q-item class="q-mb-sm">
          <q-item-section>
            <q-item-label>
              {{ $t('automoder.nnm_select_what_remove_title') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-item v-for="opt in removableSymbols" :key="opt" tag="label" :disable="!config.active" v-ripple>
          <q-item-section>
            <q-item-label>
              {{ $t(`automoder.nnm_removable_symbols.${opt}`) }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-checkbox v-model="config.options" :val="opt" :disable="!config.active" dense></q-checkbox>
          </q-item-section>
        </q-item>
      </q-list>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('automoder.nnm_contains_title') }}
            </div>
            <div class="text--secondary">
              {{ $t('automoder.nnm_contains_description') }}
            </div>

            <q-select
              v-model="config.contains"
              :disable="!config.active"
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
              <template #selected-item="{ opt }">
                <q-chip
                  class="rounded-lg"
                  color="dark-1"
                  square
                  :label="opt"
                  size="sm"
                  removable
                  @remove="config.contains.splice(config.contains.indexOf(opt), 1)"
                  :ripple="false"
                ></q-chip>
              </template>
            </q-select>
          </div>
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('common.ignored_roles') }}
            </div>

            <q-select
              v-model="config.ignored.roles"
              :options="guild.roles"
              option-label="name"
              option-value="id"
              :disable="!config.active"
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
        </div>
      </q-card-section>

      <q-list class="q-px-none" dense>
        <q-item tag="label" :disable="!config.active" v-ripple>
          <q-item-section>
            <q-item-label>
              {{ $t('automoder.ignore_bots') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-checkbox v-model="config.ignored.bots" :disable="!config.active" dense></q-checkbox>
          </q-item-section>
        </q-item>
      </q-list>

      <q-list class="q-px-none q-py-md" dense>
        <q-item class="q-mb-sm">
          <q-item-section>
            <q-item-label>
              {{ $t('common.ignored_permissions') }}
            </q-item-label>
            <q-item-label class="text--secondary">
              {{ $t('automoder.ignored_permissions_description') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          v-for="permission in ignorablePermissions"
          :key="permission.key"
          tag="label"
          :disable="!config.active"
          v-ripple
        >
          <q-item-section>
            <q-item-label>
              {{ $t(`common.permissions_keys.${permission.key}`) }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-checkbox
              v-model="config.ignored.permissions"
              :val="permission.value"
              :disable="!config.active"
              dense
            ></q-checkbox>
          </q-item-section>
        </q-item>
      </q-list>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-btn class="full-width" :label="$t('close')" unelevated no-caps color="dark-2" @click="onCancel" />
          </div>

          <div class="col-6">
            <q-btn class="full-width" :label="$t('done')" unelevated no-caps color="primary" @click="onConfirm" />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { useDialogPluginComponent } from 'quasar'
import { useGuildStore } from 'src/stores/guild'
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'AutoModNicknamesModeration',

  emits: [...useDialogPluginComponent.emits],

  props: {
    name: {
      type: String,
      required: true
    }
  },

  setup(props) {
    const guild = useGuildStore()
    const config = ref(JSON.parse(JSON.stringify(guild.moderation.automoder.nicknames)))

    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    return {
      guild,
      config,
      dialogRef,

      onConfirm() {
        onDialogOK({ name: props.name, config: { ...config.value } })
      },

      onCancel() {
        onDialogCancel()
      },

      onDismiss() {
        onDialogHide()
      }
    }
  },

  data() {
    return {
      removableSymbols: ['SPECIAL_CHARACTERS', 'ZALGO', 'DIACRITICS', 'EMOJIS'],
      ignorablePermissions: [
        { key: 'ADMINISTRATOR', value: 8 },
        { key: 'MANAGE_MESSAGES', value: 8192 },
        { key: 'MANAGE_ROLES', value: 268435456 }
      ]
    }
  }
})
</script>
