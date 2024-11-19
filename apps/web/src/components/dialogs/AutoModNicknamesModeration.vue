<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDismiss"
    transition-show="jump-down"
    transition-hide="jump-up"
    backdrop-filter="blur(8px)"
    :maximized="$q.screen.lt.sm"
  >
    <q-card class="q-dialog-card bg-dark-1" flat>
      <q-card-section class="q-dialog-card-content">
        <q-item class="q-py-md rounded-t-lg" tag="label">
          <q-item-section>
            <q-item-label class="text-subtitle1 text-uppercase">
              {{ $t(localeStringsMap.autoModTypes[name]) }}
            </q-item-label>
          </q-item-section>

          <q-item-section side top>
            <q-toggle v-model="config.active" dense></q-toggle>
          </q-item-section>
        </q-item>

        <div class="q-pa-md">
          <div>
            {{ $t('Components.AutoMod.NicknamesModerationSelectWhatRemove') }}
          </div>

          <q-list class="bg-dark-2 overflow-hidden rounded-borders q-mt-sm">
            <q-item v-for="opt in removableSymbols" :key="opt" tag="label" :disable="!config.active">
              <q-item-section side>
                <q-checkbox v-model="config.options" :val="opt" :disable="!config.active" dense></q-checkbox>
              </q-item-section>
              <q-item-section>
                <q-item-label>
                  {{ $t(localeStringsMap.nicknamesModerationRemovableSymbols[opt]) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('Components.AutoMod.NicknamesModerationContains') }}
              </div>
              <div class="text--secondary">
                {{ $t('Components.AutoMod.NicknamesModerationContainsDescription') }}
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
                    color="dark-1"
                    square
                    :label="opt"
                    size="sm"
                    removable
                    @remove="config.contains.splice(config.contains.indexOf(opt), 1)"
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
                {{ $t('Common.IgnoredRoles') }}
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
                    square
                    :label="opt.name ?? opt"
                    size="sm"
                    :style="`background: ${opt.color}`"
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

        <div class="q-pa-md">
          <q-list class="bg-dark-2 overflow-hidden rounded-borders q-mt-sm">
            <q-item tag="label" :disable="!config.active">
              <q-item-section side>
                <q-checkbox v-model="config.ignored.bots" :disable="!config.active" dense></q-checkbox>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ $t('Common.IgnoreBots') }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <div class="q-pa-md">
          <div>
            {{ $t('Common.IgnoredPermissions') }}
          </div>
          <div class="text--secondary">
            {{ $t('Components.AutoMod.IgnoredPermissionsDescription') }}
          </div>

          <q-list class="bg-dark-2 overflow-hidden rounded-borders q-mt-sm">
            <q-item
              v-for="permission in ignorablePermissions"
              :key="permission.key"
              tag="label"
              :disable="!config.active"
            >
              <q-item-section side>
                <q-checkbox
                  v-model="config.ignored.permissions"
                  :val="permission.value"
                  :disable="!config.active"
                  dense
                ></q-checkbox>
              </q-item-section>
              <q-item-section>
                <q-item-label>
                  {{ $t(localeStringsMap.discordPermissions[permission.key]) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card-section>

      <q-card-section class="q-dialog-card-actions row reverse q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-btn class="full-width" :label="$t('Common.Done')" unelevated no-caps color="primary" @click="onConfirm" />
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
import { localeStringsMap } from 'src/utils/Constants'
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
      localeStringsMap,

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
