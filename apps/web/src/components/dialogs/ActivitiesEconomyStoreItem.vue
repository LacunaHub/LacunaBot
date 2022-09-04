<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="rounded-lg bg-dark-1" flat style="width: 800px; max-width: 90vw">
      <q-item class="q-py-md rounded-t-lg">
        <q-item-section>
          <q-item-label class="text-subtitle1 text-uppercase">
            {{ $t(mode === 'CREATE' ? 'economy_store_item.add_item' : 'economy_store_item.edit_item') }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-9">
            <div>
              {{ $t('economy_store_item.item_name_title') }}
            </div>

            <q-input v-model="item.name" class="q-pt-sm" :maxlength="32" filled dense hide-bottom-space></q-input>
          </div>

          <div class="col-3">
            <div>
              {{ $t('economy_store_item.item_type_title') }}
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
                  {{ $t(`common.${opt.toLowerCase()}`) }}
                </span>
              </template>

              <template #option="{ opt, toggleOption, selected }">
                <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                  <q-item-section>
                    <q-item-label>
                      {{ $t(`common.${opt.toLowerCase()}`) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div class="col-12">
            <div>
              {{ $t('economy_store_item.item_description_title') }}
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
              {{ $t('economy_store_item.item_purchase_price_title') }}
            </div>
            <div class="text--secondary">
              {{ $t('economy_store_item.item_purchase_price_description') }}
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
              {{ $t('economy_store_item.item_products_title') }}
            </div>
            <div class="text--secondary">
              {{ $t('economy_store_item.item_products_description') }}
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

      <q-list class="q-px-none q-py-md" dense>
        <q-item
          v-for="option in itemOptions"
          :key="option"
          :disable="option === 'TEMPORARY_REFERENCES' && item.type !== 'ROLE'"
          tag="label"
          v-ripple
        >
          <q-item-section>
            <q-item-label>
              {{ $t(`economy_store_item.item_options.${option}`) }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-checkbox
              v-model="item.options"
              :val="option"
              :disable="option === 'TEMPORARY_REFERENCES' && item.type !== 'ROLE'"
              dense
              @update:model-value="onSelectOption"
            ></q-checkbox>
          </q-item-section>
        </q-item>
      </q-list>

      <transition enter-active-class="animated fadeInUp">
        <q-card-section v-if="item.options.includes('LIMITED_QUANTITY')">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('economy_store_item.item_quantity_title') }}
              </div>

              <q-input
                v-model.number="item.quantity"
                class="q-pt-sm"
                type="number"
                filled
                dense
                hide-bottom-space
                @update:model-value="onChangeQuantity"
              ></q-input>
            </div>
          </div>
        </q-card-section>
      </transition>

      <transition enter-active-class="animated fadeInUp">
        <q-card-section v-if="item.options.includes('TEMPORARY_REFERENCES')">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('economy_store_item.item_duration_title') }}
              </div>

              <q-input
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
                        {{ $t(`automoder.nm_age_measures.${opt}`) }}
                      </span>
                    </template>

                    <template #option="{ opt, toggleOption, selected }">
                      <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                        <q-item-section>
                          <q-item-label>
                            {{ $t(`automoder.nm_age_measures.${opt}`) }}
                          </q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </template>
              </q-input>
            </div>
          </div>
        </q-card-section>
      </transition>

      <transition enter-active-class="animated fadeInUp">
        <q-card-section v-if="item.options.includes('CUSTOM_PURCHASE_REPLY')">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('pages.guild.gs_message_template_title') }}
              </div>

              <MessageEditor :message="item.custom_purchase_reply" avlReplacers="guild member" class="q-pt-sm" />
            </div>
          </div>
        </q-card-section>
      </transition>

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
import { suid } from 'src/utils/Utils'
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
