<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="rounded-lg bg-dark-1" flat style="width: 800px; max-width: 90vw">
      <q-item class="q-py-md rounded-t-lg">
        <q-item-section>
          <q-item-label class="text-subtitle1 text-uppercase">
            {{ $t(mode === 'CREATE' ? 'economy_currency.add_currency' : 'economy_currency.edit_currency') }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('economy_currency.currency_name_title') }}
            </div>

            <q-input
              v-model.trim="currency.name"
              class="q-pt-sm"
              :maxlength="64"
              filled
              dense
              hide-bottom-space
            ></q-input>
          </div>

          <div class="col-12">
            <div>
              {{ $t('economy_currency.currency_symbol_title') }}
            </div>

            <q-input
              v-model.trim="currency.symbol"
              class="q-pt-sm"
              :maxlength="64"
              filled
              dense
              hide-bottom-space
            ></q-input>
          </div>
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <div>
              {{ $t('economy_currency.income_per_message_title') }}
            </div>

            <q-input
              v-model.number="currency.income.messages.range_per_message[0]"
              class="q-pt-sm"
              type="number"
              filled
              dense
              hide-bottom-space
              :prefix="$t('economy_currency.income_from')"
              @update:model-value="onChangeMessageIncome($event, 0)"
            ></q-input>
          </div>

          <div class="col-12 col-md-6 self-end">
            <q-input
              v-model.number="currency.income.messages.range_per_message[1]"
              class="q-pt-sm"
              type="number"
              filled
              dense
              hide-bottom-space
              :prefix="$t('economy_currency.income_to')"
              @update:model-value="onChangeMessageIncome($event, 1)"
            ></q-input>
          </div>

          <div class="col-12">
            <div>
              {{ $t('economy_currency.income_per_message_rl_title') }}
            </div>
            <div class="text--secondary">
              {{ $t('economy_currency.income_per_message_rl_description') }}
            </div>

            <q-select
              v-model.number="currency.income.messages.rate_limit_per_user"
              :options="[0, 300, 600, 900, 1800, 3600, 7200, 21600, 43200, 64800, 86400]"
              class="q-pt-sm"
              filled
              dense
              hide-bottom-space
            >
              <template #selected-item="{ opt }">
                <span v-if="opt === 0" class="text-lowercase">
                  {{ $t('none') }}
                </span>
                <span v-else>
                  {{
                    $dt
                      .now()
                      .plus({ seconds: opt })
                      .toRelative({ unit: ['hours', 'minutes'], padding: 30000 })
                  }}
                </span>
              </template>

              <template #option="{ opt, toggleOption, selected }">
                <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                  <q-item-section>
                    <q-item-label v-if="opt === 0" class="text-lowercase">
                      {{ $t('none') }}
                    </q-item-label>
                    <q-item-label v-else>
                      {{
                        $dt
                          .now()
                          .plus({ seconds: opt })
                          .toRelative({ unit: ['hours', 'minutes'], padding: 30000 })
                      }}
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
          <div class="col-12 col-md-6">
            <div>
              {{ $t('economy_currency.income_per_minute_title') }}
            </div>

            <q-input
              v-model.number="currency.income.voice_channels.range_per_minute[0]"
              :disable="!guild.premium.available"
              class="q-pt-sm"
              type="number"
              filled
              dense
              hide-bottom-space
              :prefix="$t('economy_currency.income_from')"
              @update:model-value="onChangeVoiceIncome($event, 0)"
            ></q-input>
          </div>

          <div class="col-12 col-md-6 self-end">
            <q-input
              v-model.number="currency.income.voice_channels.range_per_minute[1]"
              :disable="!guild.premium.available"
              class="q-pt-sm"
              type="number"
              filled
              dense
              hide-bottom-space
              :prefix="$t('economy_currency.income_to')"
              @update:model-value="onChangeVoiceIncome($event, 1)"
            ></q-input>
          </div>
        </div>
      </q-card-section>

      <q-list class="q-px-none" padding>
        <q-expansion-item expand-separator :label="$t('common.permissions')">
          <q-card class="rounded-lg bg-dark-1" flat>
            <q-card-section>
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <div>
                    {{ $t('common.allowed_channels') }}
                  </div>

                  <q-select
                    v-model="currency.income.allowed.channels"
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
                  <div>
                    {{ $t('common.blocked_channels') }}
                  </div>

                  <q-select
                    v-model="currency.income.blocked.channels"
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
                <div class="col-12">
                  <div>
                    {{ $t('common.allowed_roles') }}
                  </div>

                  <q-select
                    v-model="currency.income.allowed.roles"
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
                    v-model="currency.income.blocked.roles"
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
              :disable-dropdown="currency.id === 'DEFAULT'"
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
  name: 'ActivitiesEconomyCurrency',

  emits: [...useDialogPluginComponent.emits],

  props: {
    currencyProp: {
      type: Object,
      default: null
    }
  },

  setup(props) {
    const guild = useGuildStore()
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const mode = ref(props.currencyProp ? 'UPDATE' : 'CREATE')
    const currency = ref(
      mode.value === 'UPDATE'
        ? JSON.parse(JSON.stringify(props.currencyProp))
        : {
            id: suid(6),
            name: '',
            symbol: '',
            options: [],
            income: {
              messages: {
                range_per_message: [1, 5],
                rate_limit_per_user: 60
              },
              voice_channels: {
                range_per_minute: [0.2, 1]
              },
              allowed: {
                channels: [],
                roles: []
              },
              blocked: {
                channels: [],
                roles: []
              }
            }
          }
    )

    const isValid = computed(() => {
      return currency.value.name && currency.value.symbol
    })

    return {
      guild,
      dialogRef,
      mode,
      currency,
      isValid,

      onConfirm() {
        if (isValid.value) {
          onDialogOK({ mode: mode.value, currency: currency.value })
        }
      },

      onCancel() {
        onDialogCancel()
      },

      onDismiss() {
        onDialogHide()
      },

      onDelete() {
        if (currency.value.id !== 'DEFAULT') {
          onDialogOK({ mode: 'DELETE', currency: currency.value })
        }
      }
    }
  },

  methods: {
    onChangeMessageIncome(value, position) {
      const MIN_INCOME_AMOUNT = 0,
        MAX_INCOME_AMOUNT = 100000
      const range = this.currency.income.messages.range_per_message

      if (position) {
        if (value > MAX_INCOME_AMOUNT) value = MAX_INCOME_AMOUNT
        if (value < range[0]) value = range[0]
      } else {
        if (value < MIN_INCOME_AMOUNT) value = MIN_INCOME_AMOUNT
        if (value > range[1]) value = range[1]
      }

      this.currency.income.messages.range_per_message[position] = value
    },
    onChangeVoiceIncome(value, position) {
      const MIN_INCOME_AMOUNT = 0,
        MAX_INCOME_AMOUNT = 100000
      const range = this.currency.income.voice_channels.range_per_minute

      if (position) {
        if (value > MAX_INCOME_AMOUNT) value = MAX_INCOME_AMOUNT
        if (value < range[0]) value = range[0]
      } else {
        if (value < MIN_INCOME_AMOUNT) value = MIN_INCOME_AMOUNT
        if (value > range[1]) value = range[1]
      }

      this.currency.income.voice_channels.range_per_minute[position] = value
    }
  }
})
</script>
