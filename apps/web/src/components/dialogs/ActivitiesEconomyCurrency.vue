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
                {{ $t('Components.EconomyCurrency.CurrencyName') }}
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
                {{ $t('Components.EconomyCurrency.CurrencySymbol') }}
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
                {{ $t('Components.EconomyCurrency.IncomePerMessage') }}
              </div>

              <q-input
                v-model.number="currency.income.messages.range_per_message[0]"
                class="q-pt-sm"
                type="number"
                filled
                dense
                hide-bottom-space
                :prefix="$t('Components.EconomyCurrency.From')"
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
                :prefix="$t('Components.EconomyCurrency.To')"
                @update:model-value="onChangeMessageIncome($event, 1)"
              ></q-input>
            </div>

            <div class="col-12">
              <div>
                {{ $t('Components.EconomyCurrency.IncomePerMessageRl') }}
              </div>
              <div class="text--secondary">
                {{ $t('Components.EconomyCurrency.IncomePerMessageRlDescription') }}
              </div>

              <q-select
                v-model.number="currency.income.messages.rate_limit_per_user"
                :options="[0, 60, 300, 600, 900, 1800, 3600, 7200, 21600, 43200, 64800, 86400]"
                class="q-pt-sm"
                filled
                dense
                hide-bottom-space
              >
                <template #selected-item="{ opt }">
                  <span v-if="opt === 0" class="text-lowercase">
                    {{ $t('Common.None') }}
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
                        {{ $t('Common.None') }}
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
                {{ $t('Components.EconomyCurrency.IncomePerMinute') }}
              </div>

              <q-input
                v-model.number="currency.income.voice_channels.range_per_minute[0]"
                :disable="!guild.premium.available"
                class="q-pt-sm"
                type="number"
                filled
                dense
                hide-bottom-space
                :prefix="$t('Components.EconomyCurrency.From')"
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
                :prefix="$t('Components.EconomyCurrency.To')"
                @update:model-value="onChangeVoiceIncome($event, 1)"
              ></q-input>
            </div>
          </div>
        </q-card-section>

        <div class="q-pa-md">
          <q-list class="bg-dark-2 overflow-hidden rounded-borders">
            <q-expansion-item expand-separator :label="$t('Common.Permissions')">
              <q-card class="bg-dark-1 no-border-radius" bordered>
                <q-card-section>
                  <div class="row q-col-gutter-md">
                    <div class="col-12">
                      <div>
                        {{ $t('Common.AllowedChannels') }}
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
      </q-card-section>

      <q-card-section class="q-dialog-card-actions row reverse q-col-gutter-md">
        <div class="col-12 col-md-6">
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
            :disable-dropdown="currency.id === 'DEFAULT'"
            split
            unelevated
            no-caps
            color="primary"
            @click="onConfirm"
          >
            <q-list>
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
import { suid } from 'src/utils/Utils'
import { computed, defineComponent, ref } from 'vue'

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
