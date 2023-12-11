<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="bg-dark-1" flat style="width: 800px; max-width: 90vw">
      <div class="q-pa-md">
        <div>
          {{ $t('Components.ActivityMultipliers.LevelMultipliers') }}
        </div>

        <q-list class="bg-dark-2 overflow-hidden rounded-borders q-mt-sm">
          <q-expansion-item v-for="option in ['LEVELS_TEXT', 'LEVELS_VOICE']" :key="option" tag="label">
            <template #header>
              <q-item-section side>
                <q-checkbox
                  v-model="multiplier.options"
                  :val="option"
                  dense
                  @update:model-value="onSelectOption"
                ></q-checkbox>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{
                    $t(
                      `Components.ActivityMultipliers.${
                        option === 'LEVELS_TEXT' ? 'ForTextActivity' : 'ForVoiceActivity'
                      }`
                    )
                  }}
                </q-item-label>
              </q-item-section>
            </template>

            <q-card v-if="option === 'LEVELS_TEXT'" class="bg-dark-1 no-border-radius" bordered>
              <q-card-section>
                <div class="row q-col-gutter-md">
                  <div class="col-12">
                    <q-slider
                      v-if="multiplier.options.includes('LEVELS_TEXT')"
                      v-model.number="multiplier.levels_text_multiplier"
                      class="q-pt-xs q-px-sm"
                      :min="50"
                      :max="500"
                      label
                      :label-value="`${multiplier.levels_text_multiplier}%`"
                    ></q-slider>

                    <q-slider v-else disable class="q-pt-xs q-px-sm" :model-value="100" :min="50" :max="500"></q-slider>
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <q-card v-if="option === 'LEVELS_VOICE'" class="bg-dark-1 no-border-radius" bordered>
              <q-card-section>
                <div class="row q-col-gutter-md">
                  <div class="col-12">
                    <q-slider
                      v-if="multiplier.options.includes('LEVELS_VOICE')"
                      v-model.number="multiplier.levels_voice_multiplier"
                      class="q-pt-xs q-px-sm"
                      :min="50"
                      :max="500"
                      label
                      :label-value="`${multiplier.levels_voice_multiplier}%`"
                    ></q-slider>

                    <q-slider v-else disable class="q-pt-xs q-px-sm" :model-value="100" :min="50" :max="500"></q-slider>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-list>
      </div>

      <div class="q-pa-md">
        <div>
          {{ $t('Components.ActivityMultipliers.EconomyMultipliers') }}
        </div>

        <q-list class="bg-dark-2 overflow-hidden rounded-borders q-mt-sm">
          <q-expansion-item v-for="option in ['ECONOMY_TEXT', 'ECONOMY_VOICE']" :key="option" tag="label">
            <template #header>
              <q-item-section side>
                <q-checkbox
                  v-model="multiplier.options"
                  :val="option"
                  dense
                  @update:model-value="onSelectOption"
                ></q-checkbox>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{
                    $t(
                      `Components.ActivityMultipliers.${
                        option === 'ECONOMY_TEXT' ? 'ForTextActivity' : 'ForVoiceActivity'
                      }`
                    )
                  }}
                </q-item-label>
              </q-item-section>
            </template>

            <q-card v-if="option === 'ECONOMY_TEXT'" class="bg-dark-1 no-border-radius" bordered>
              <q-card-section>
                <div class="row q-col-gutter-md">
                  <div class="col-12">
                    <q-slider
                      v-if="multiplier.options.includes('ECONOMY_TEXT')"
                      v-model.number="multiplier.economy_text_multiplier"
                      class="q-pt-xs q-px-sm"
                      :min="50"
                      :max="500"
                      label
                      :label-value="`${multiplier.economy_text_multiplier}%`"
                    ></q-slider>

                    <q-slider v-else disable class="q-pt-xs q-px-sm" :model-value="100" :min="50" :max="500"></q-slider>
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <q-card v-if="option === 'ECONOMY_VOICE'" class="bg-dark-1 no-border-radius" bordered>
              <q-card-section>
                <div class="row q-col-gutter-md">
                  <div class="col-12">
                    <q-slider
                      v-if="multiplier.options.includes('ECONOMY_VOICE')"
                      v-model.number="multiplier.economy_voice_multiplier"
                      class="q-pt-xs q-px-sm"
                      :min="50"
                      :max="500"
                      label
                      :label-value="`${multiplier.economy_voice_multiplier}%`"
                    ></q-slider>

                    <q-slider v-else disable class="q-pt-xs q-px-sm" :model-value="100" :min="50" :max="500"></q-slider>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-list>
      </div>

      <div class="q-pa-md">
        <q-list class="bg-dark-2 overflow-hidden rounded-borders q-mt-sm">
          <q-expansion-item expand-separator :label="$t('Common.Permissions')">
            <q-card class="bg-dark-1 no-border-radius" bordered>
              <q-card-section>
                <div class="row q-col-gutter-md">
                  <div class="col-12">
                    <div>
                      {{ $t('Common.AllowedChannels') }}
                    </div>

                    <q-select
                      v-model="multiplier.allowed_channels"
                      :options="guild.channels"
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
                  </div>

                  <div class="col-12">
                    <div>
                      {{ $t('Common.BlockedChannels') }}
                    </div>

                    <q-select
                      v-model="multiplier.blocked_channels"
                      :options="guild.channels"
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
                  </div>
                </div>
              </q-card-section>

              <q-card-section>
                <div class="row q-col-gutter-md">
                  <div class="col-12">
                    <div>
                      {{ $t('Common.AllowedRoles') }}
                    </div>

                    <q-select
                      v-model="multiplier.allowed_roles"
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
                  </div>

                  <div class="col-12">
                    <div>
                      {{ $t('Common.BlockedRoles') }}
                    </div>

                    <q-select
                      v-model="multiplier.blocked_roles"
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
              v-if="mode === 'CREATE'"
              class="full-width"
              :label="$t('Common.Add')"
              :disable="!isValid"
              unelevated
              no-caps
              color="primary"
              @click="onConfirm"
            />
            <q-btn-dropdown
              v-if="mode === 'UPDATE'"
              class="full-width"
              :label="$t('Common.Done')"
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
                      {{ $t('Common.Delete') }}
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
import { suid } from 'src/utils/Utils'
import { computed, defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'ActivitiesMultiplier',

  emits: [...useDialogPluginComponent.emits],

  props: {
    multiplierProp: {
      type: Object,
      default: null
    }
  },

  setup(props) {
    const guild = useGuildStore()
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const mode = ref(props.multiplierProp ? 'UPDATE' : 'CREATE')
    const multiplier = ref(
      mode.value === 'UPDATE'
        ? JSON.parse(JSON.stringify(props.multiplierProp))
        : {
            id: suid(6),
            options: [],
            allowed_channels: [],
            allowed_roles: [],
            blocked_channels: [],
            blocked_roles: []
          }
    )

    const isValid = computed(() => {
      return multiplier.value.options
    })

    return {
      guild,
      dialogRef,
      mode,
      multiplier,

      isValid,

      onConfirm() {
        if (isValid.value) {
          onDialogOK({ mode: mode.value, multiplier: multiplier.value })
        }
      },

      onCancel() {
        onDialogCancel()
      },

      onDismiss() {
        onDialogHide()
      },

      onDelete() {
        onDialogOK({ mode: 'DELETE', multiplier: multiplier.value })
      }
    }
  },

  methods: {
    onSelectOption(options) {
      if (options.includes('LEVELS_TEXT') && !this.multiplier.levels_text_multiplier) {
        this.multiplier.levels_text_multiplier = 100
      }

      if (options.includes('LEVELS_VOICE') && !this.multiplier.levels_voice_multiplier) {
        this.multiplier.levels_voice_multiplier = 100
      }

      if (options.includes('ECONOMY_TEXT') && !this.multiplier.economy_text_multiplier) {
        this.multiplier.economy_text_multiplier = 100
      }

      if (options.includes('ECONOMY_VOICE') && !this.multiplier.economy_voice_multiplier) {
        this.multiplier.economy_voice_multiplier = 100
      }

      if (!options.includes('LEVELS_TEXT')) {
        delete this.multiplier.levels_text_multiplier
      }

      if (!options.includes('LEVELS_VOICE')) {
        delete this.multiplier.levels_voice_multiplier
      }

      if (!options.includes('ECONOMY_TEXT')) {
        delete this.multiplier.economy_text_multiplier
      }

      if (!options.includes('ECONOMY_VOICE')) {
        delete this.multiplier.economy_voice_multiplier
      }
    }
  }
})
</script>
