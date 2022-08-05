<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="rounded-lg bg-dark-grey-2" style="width: 800px; max-width: 90vw">
      <q-item class="q-py-md rounded-t-lg">
        <q-item-section>
          <q-item-label class="text-subtitle1 text-uppercase">
            {{ $t(mode === 'CREATE' ? 'activity_multipliers.add_multiplier' : 'activity_multipliers.edit_multiplier') }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-list class="q-px-none q-py-md" dense>
        <q-item class="q-mb-sm">
          <q-item-section>
            <q-item-label>
              {{ $t('activity_multipliers.level_multipliers') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-item v-for="option in ['LEVELS_TEXT', 'LEVELS_VOICE']" :key="option" tag="label" v-ripple>
          <q-item-section>
            <q-item-label>
              {{ $t(`activity_multipliers.${option === 'LEVELS_TEXT' ? 'for_text_activity' : 'for_voice_activity'}`) }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-checkbox
              v-model="multiplier.options"
              :val="option"
              dense
              @update:model-value="onSelectOption"
            ></q-checkbox>
          </q-item-section>
        </q-item>
      </q-list>

      <transition enter-active-class="animated fadeInUp">
        <q-card-section v-if="multiplier.options.includes('LEVELS_TEXT')">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('activity_multipliers.for_text_activity') }}
              </div>

              <q-slider
                v-model.number="multiplier.levels_text_multiplier"
                class="q-pt-sm q-px-sm"
                :min="50"
                :max="500"
                label
                :label-value="`${multiplier.levels_text_multiplier}%`"
              ></q-slider>
            </div>
          </div>
        </q-card-section>
      </transition>

      <transition enter-active-class="animated fadeInUp">
        <q-card-section v-if="multiplier.options.includes('LEVELS_VOICE')">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('activity_multipliers.for_voice_activity') }}
              </div>

              <q-slider
                v-model.number="multiplier.levels_voice_multiplier"
                class="q-pt-sm q-px-sm"
                :min="50"
                :max="500"
                label
                :label-value="`${multiplier.levels_voice_multiplier}%`"
              ></q-slider>
            </div>
          </div>
        </q-card-section>
      </transition>

      <q-list class="q-px-none q-py-md" dense>
        <q-item class="q-mb-sm">
          <q-item-section>
            <q-item-label>
              {{ $t('activity_multipliers.economy_multipliers') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-item v-for="option in ['ECONOMY_TEXT', 'ECONOMY_VOICE']" :key="option" tag="label" v-ripple>
          <q-item-section>
            <q-item-label>
              {{ $t(`activity_multipliers.${option === 'ECONOMY_TEXT' ? 'for_text_activity' : 'for_voice_activity'}`) }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-checkbox
              v-model="multiplier.options"
              :val="option"
              dense
              @update:model-value="onSelectOption"
            ></q-checkbox>
          </q-item-section>
        </q-item>
      </q-list>

      <transition enter-active-class="animated fadeInUp">
        <q-card-section v-if="multiplier.options.includes('ECONOMY_TEXT')">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('activity_multipliers.for_text_activity') }}
              </div>

              <q-slider
                v-model.number="multiplier.economy_text_multiplier"
                class="q-pt-sm q-px-sm"
                :min="50"
                :max="500"
                label
                :label-value="`${multiplier.economy_text_multiplier}%`"
              ></q-slider>
            </div>
          </div>
        </q-card-section>
      </transition>

      <transition enter-active-class="animated fadeInUp">
        <q-card-section v-if="multiplier.options.includes('ECONOMY_VOICE')">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('activity_multipliers.for_voice_activity') }}
              </div>

              <q-slider
                v-model.number="multiplier.economy_voice_multiplier"
                class="q-pt-sm q-px-sm"
                :min="50"
                :max="500"
                label
                :label-value="`${multiplier.economy_voice_multiplier}%`"
              ></q-slider>
            </div>
          </div>
        </q-card-section>
      </transition>

      <q-list class="q-px-none" padding>
        <q-expansion-item expand-separator :label="$t('common.permissions')">
          <q-card class="rounded-lg bg-dark-grey-2">
            <q-card-section>
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <div>
                    {{ $t('common.allowed_channels') }}
                  </div>

                  <q-select
                    v-model="multiplier.allowed_channels"
                    :options="[...guild.channelsText, ...guild.channelsVoice]"
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
                        color="dark-grey-1"
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
                  <div>
                    {{ $t('common.blocked_channels') }}
                  </div>

                  <q-select
                    v-model="multiplier.blocked_channels"
                    :options="[...guild.channelsText, ...guild.channelsVoice]"
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
                        color="dark-grey-1"
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
                <div class="col-12">
                  <div>
                    {{ $t('common.allowed_roles') }}
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
                    {{ $t('common.blocked_roles') }}
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
          </q-card>
        </q-expansion-item>
      </q-list>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-btn class="full-width" :label="$t('close')" unelevated no-caps color="dark-grey-3" @click="onCancel" />
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
import { suid } from 'src/utils/Utils'

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
