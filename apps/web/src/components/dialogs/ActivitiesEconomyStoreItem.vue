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
            <div class="col-9">
              <div>
                {{ $t('Components.EconomyStoreItem.ItemName') }}
              </div>

              <q-input v-model="item.name" class="q-pt-sm" :maxlength="32" filled dense hide-bottom-space></q-input>
            </div>

            <div class="col-3">
              <div>
                {{ $t('Components.EconomyStoreItem.ItemType') }}
              </div>

              <q-select
                v-model="item.type"
                :options="['ROLE', 'CHANNEL']"
                @update:model-value="onChangeItemType"
                class="q-pt-sm"
                filled
                dense
                hide-bottom-space
              >
                <template #selected-item="{ opt }">
                  <span>
                    {{ $t(opt === 'ROLE' ? 'Commands.OptionTypes.Role' : 'Commands.OptionTypes.Channel') }}
                  </span>
                </template>

                <template #option="{ opt, toggleOption, selected }">
                  <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                    <q-item-section>
                      <q-item-label>
                        {{ $t(opt === 'ROLE' ? 'Commands.OptionTypes.Role' : 'Commands.OptionTypes.Channel') }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <div class="col-12">
              <div>
                {{ $t('Components.EconomyStoreItem.ItemDescription') }}
              </div>

              <q-input
                v-model="item.description"
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
            <div class="col-9">
              <div>
                {{ $t('Commands.StoreCommand.SubCommands.ItemsCommand.Texts.PurchasePrice') }}
              </div>
              <div class="text--secondary">
                {{ $t('Components.EconomyStoreItem.ItemPurchasePriceDescription') }}
              </div>

              <q-input
                v-model.number="item.purchase_price"
                class="q-pt-sm"
                type="number"
                filled
                dense
                hide-bottom-space
                @update:model-value="onChangePrice"
              ></q-input>
            </div>

            <div class="col-3 self-end">
              <q-select
                v-model="item.currency_id"
                :options="guild.modules.economy.currencies"
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
                  <span>
                    {{ opt.name }}
                  </span>
                </template>

                <template #option="{ opt, toggleOption, selected }">
                  <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                    <q-item-section>
                      <q-item-label>
                        {{ opt.name }}
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
                {{ $t('Components.EconomyStoreItem.ItemProducts') }}
              </div>
              <div class="text--secondary">
                {{ $t('Components.EconomyStoreItem.ItemProductsDescription') }}
              </div>

              <q-select
                v-if="item.type === 'ROLE'"
                v-model="item.references"
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
                :max-values="5"
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
              </q-select>

              <q-select
                v-if="item.type === 'CHANNEL'"
                v-model="item.references"
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
                :max-values="5"
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
          </div>
        </q-card-section>

        <div class="q-pa-md">
          <q-list class="bg-dark-2 overflow-hidden rounded-borders">
            <q-expansion-item
              v-for="option in itemOptions"
              :key="option"
              :disable="option === 'TEMPORARY_REFERENCES' && item.type !== 'ROLE'"
              tag="label"
            >
              <template #header>
                <q-item-section side>
                  <q-checkbox
                    v-model="item.options"
                    :val="option"
                    :disable="option === 'TEMPORARY_REFERENCES' && item.type !== 'ROLE'"
                    dense
                    @update:model-value="onSelectOption"
                  ></q-checkbox>
                </q-item-section>

                <q-item-section>
                  <q-item-label>
                    {{ $t(localeStringsMap.storeItemOptions[option]) }}
                  </q-item-label>
                </q-item-section>
              </template>

              <q-card v-if="option === 'LIMITED_QUANTITY'" class="bg-dark-1 no-border-radius" bordered>
                <q-card-section>
                  <div class="row q-col-gutter-md">
                    <div class="col-12">
                      <div>
                        {{ $t('Components.EconomyStoreItem.ItemQuantity') }}
                      </div>

                      <q-input
                        v-if="item.options.includes('LIMITED_QUANTITY')"
                        v-model.number="item.quantity"
                        class="q-pt-sm"
                        type="number"
                        filled
                        dense
                        hide-bottom-space
                        @update:model-value="onChangeQuantity"
                      ></q-input>

                      <q-input
                        v-else
                        disable
                        label="100"
                        class="q-pt-sm"
                        type="number"
                        filled
                        dense
                        hide-bottom-space
                      ></q-input>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <q-card v-if="option === 'TEMPORARY_REFERENCES'" class="bg-dark-1 no-border-radius" bordered>
                <q-card-section>
                  <div class="row q-col-gutter-md">
                    <div class="col-12">
                      <div>
                        {{ $t('Components.EconomyStoreItem.ItemDuration') }}
                      </div>

                      <q-input
                        v-if="item.options.includes('TEMPORARY_REFERENCES')"
                        v-model.number="item.references_duration.value"
                        class="q-pt-sm"
                        type="number"
                        filled
                        dense
                        hide-bottom-space
                        @update:model-value="onChangeDuration"
                      >
                        <template #after>
                          <q-select
                            v-model="item.references_duration.measure"
                            :options="['MINUTES', 'HOURS', 'DAYS']"
                            filled
                            dense
                            hide-bottom-space
                            emit-value
                            map-options
                          >
                            <template #selected-item="{ opt }">
                              <span>
                                {{ $t(localeStringsMap.dateUnits[opt]) }}
                              </span>
                            </template>

                            <template #option="{ opt, toggleOption, selected }">
                              <q-item
                                clickable
                                @click="toggleOption(opt)"
                                :active="selected"
                                active-class="menu-item--active"
                              >
                                <q-item-section>
                                  <q-item-label>
                                    {{ $t(localeStringsMap.dateUnits[opt]) }}
                                  </q-item-label>
                                </q-item-section>
                              </q-item>
                            </template>
                          </q-select>
                        </template>
                      </q-input>

                      <q-input
                        v-else
                        disable
                        model-value="1"
                        class="q-pt-sm"
                        type="number"
                        filled
                        dense
                        hide-bottom-space
                      >
                        <template #after>
                          <q-select disable :model-value="$t('Common.DateUnits.Days')" filled dense hide-bottom-space>
                          </q-select>
                        </template>
                      </q-input>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <q-card v-if="option === 'CUSTOM_PURCHASE_REPLY'" class="bg-dark-1 no-border-radius" bordered>
                <q-card-section>
                  <div class="row q-col-gutter-md">
                    <div class="col-12">
                      <div>
                        {{ $t('Pages.GuildPage.GeneralSettings.MessageTemplate') }}
                      </div>

                      <MessageEditor
                        v-if="item.options.includes('CUSTOM_PURCHASE_REPLY')"
                        :message="item.custom_purchase_reply"
                        avlReplacers="guild member"
                        class="q-pt-sm"
                      />
                      <MessageEditor v-else disable avlReplacers="guild member" class="q-pt-sm" />
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
import { localeStringsMap } from 'src/utils/Constants'
import { suid } from 'src/utils/Utils'
import { computed, defineComponent, ref } from 'vue'
import MessageEditor from '../MessageEditor.vue'

export default defineComponent({
  name: 'ActivitiesEconomyStoreItem',

  emits: [...useDialogPluginComponent.emits],

  props: {
    itemProp: {
      type: Object,
      default: null
    }
  },

  components: {
    MessageEditor
  },

  setup(props) {
    const guild = useGuildStore()
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const mode = ref(props.itemProp ? 'UPDATE' : 'CREATE')
    const item = ref(
      mode.value === 'UPDATE'
        ? JSON.parse(JSON.stringify(props.itemProp))
        : {
            id: suid(6),
            name: '',
            type: 'ROLE',
            description: null,
            options: [],
            purchase_price: 0,
            currency_id: 'DEFAULT',
            references: []
          }
    )

    const isValid = computed(() => {
      return item.value.name && item.value.references.length
    })

    return {
      guild,
      dialogRef,
      mode,
      item,
      isValid,
      localeStringsMap,

      onConfirm() {
        if (isValid.value) {
          onDialogOK({ mode: mode.value, item: item.value })
        }
      },

      onCancel() {
        onDialogCancel()
      },

      onDismiss() {
        onDialogHide()
      },

      onDelete() {
        onDialogOK({ mode: 'DELETE', item: item.value })
      }
    }
  },

  data() {
    return {
      itemOptions: ['LIMITED_QUANTITY', 'TEMPORARY_REFERENCES', 'CUSTOM_PURCHASE_REPLY']
    }
  },

  methods: {
    onChangeItemType() {
      this.item.references = []

      if (this.item.options.includes('TEMPORARY_REFERENCES')) {
        this.item.options.splice(this.item.options.indexOf('TEMPORARY_REFERENCES'), 1)
      }
    },
    onChangePrice(value) {
      if (isNaN(value) || value < 0) value = 0
      if (value > Math.pow(2, 31) - 1) value = Math.pow(2, 31) - 1

      this.item.purchase_price = value
    },
    onSelectOption(options) {
      if (options.includes('LIMITED_QUANTITY') && !this.item.quantity) {
        this.item.quantity = 100
      }

      if (options.includes('TEMPORARY_REFERENCES') && !this.item.references_duration) {
        this.item.references_duration = { value: 1, measure: 'DAYS' }
      }

      if (options.includes('CUSTOM_PURCHASE_REPLY') && !this.item.custom_purchase_reply) {
        this.item.custom_purchase_reply = {
          content: '',
          embed: {
            active: false,
            title: null,
            description: null,
            url: null,
            timestamp: null,
            color: null,
            footer: { text: null, icon_url: null },
            image: { url: null },
            thumbnail: { url: null },
            author: { name: null, url: null, icon_url: null },
            fields: []
          }
        }
      }

      if (!options.includes('LIMITED_QUANTITY')) {
        delete this.item.quantity
      }

      if (!options.includes('TEMPORARY_REFERENCES')) {
        delete this.item.references_duration
      }

      if (!options.includes('CUSTOM_PURCHASE_REPLY')) {
        delete this.item.custom_purchase_reply
      }
    },
    onChangeQuantity(value) {
      if (isNaN(value) || value < 0) value = 0
      if (value > Math.pow(2, 31) - 1) value = Math.pow(2, 31) - 1

      this.item.quantity = value
    },
    onChangeDuration(value) {
      if (isNaN(value) || value < 1) value = 1
      if (value > Math.pow(2, 12)) value = Math.pow(2, 12)

      this.item.references_duration.value = value
    }
  }
})
</script>
