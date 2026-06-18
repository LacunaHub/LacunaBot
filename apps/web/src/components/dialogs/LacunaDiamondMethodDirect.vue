<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDismiss"
    transition-show="jump-down"
    transition-hide="jump-up"
    backdrop-filter="blur(8px)"
    :maximized="$q.screen.lt.sm"
  >
    <q-card class="q-dialog-card q-dialog-card-sm bg-dark-1" flat>
      <q-card-section class="q-dialog-card-content">
        <q-item class="q-py-md rounded-t-lg">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('Components.LacunaDiamond.SelectPlan') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12" v-for="(price, i) of prices" :key="i">
              <q-card :class="`bg-dark-2 ${price.tier === selectedTier ? 'bordered-block bordered-primary' : ''}`" flat>
                <q-item class="rounded-lg" tag="label">
                  <q-item-section>
                    <q-item-label>
                      <del v-if="price.salePrice" class="q-mr-xs opacity-md">
                        {{ price.price }}{{ currency.symbol }}
                      </del>
                      <span class="text-h6 text-white">
                        {{ price.salePrice ? price.salePrice : price.price }}{{ currency.symbol }}
                      </span>
                      <span class="q-mx-sm">/</span>
                      <span class="text-caption">
                        {{
                          DateTime.fromMillis(Date.now() + price.durationSeconds * 1000)
                            .diffNow(
                              price.durationSeconds > 604800
                                ? 'months'
                                : price.durationSeconds > 86400
                                  ? 'days'
                                  : 'hours'
                            )
                            .toHuman({ maximumFractionDigits: 0 })
                        }}
                      </span>

                      <q-badge v-if="price.salePrice" class="q-ml-sm" color="primary">
                        <span>-{{ Math.round(((price.price - price.salePrice) * 100) / price.price) }}%</span>
                      </q-badge>
                    </q-item-label>
                  </q-item-section>

                  <q-item-section side>
                    <q-radio v-model="selectedTier" :val="price.tier" dense />
                  </q-item-section>
                </q-item>
              </q-card>
            </div>
          </div>
        </q-card-section>

        <q-list v-if="method === 'Tokens'" class="bg-dark-2 overflow-hidden rounded-borders q-ma-md">
          <q-expansion-item :label="$t('Components.LacunaDiamond.FAQ.Q4')" group="default" expand-separator>
            <q-card class="bg-dark-1 no-border-radius" bordered>
              <q-card-section>
                <div
                  v-html="
                    parseMarkdown(
                      $t('Components.LacunaDiamond.FAQ.A4', { topggLink: 'https://top.gg/bot/740585412560420914/vote' })
                    )
                  "
                ></div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-list>
      </q-card-section>

      <q-card-section class="q-dialog-card-actions row reverse q-col-gutter-md">
        <div class="col-12">
          <q-btn
            class="full-width"
            :label="$t('Components.LacunaDiamond.Pay')"
            unelevated
            @click="onConfirm"
            no-caps
            color="primary"
          >
            <template #loading>
              <q-spinner-dots color="white"></q-spinner-dots>
            </template>
          </q-btn>
        </div>

        <div class="col-12">
          <q-btn class="full-width" :label="$t('Common.Close')" unelevated no-caps color="dark-2" @click="onCancel" />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { DateTime } from 'src/boot/luxon'
import { parseMarkdown } from 'src/utils/Markdown'
import { ref } from 'vue'

defineEmits(useDialogPluginComponent.emits)
const props = defineProps({
  method: {
    type: String,
    required: true
  },
  currency: {
    type: Object,
    required: true
  },
  prices: {
    type: Array,
    required: true
  }
})

const $q = useQuasar(),
  { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()
const middlePriceIndex = Math.floor((props.prices.length - 1) / 2),
  middlePrice = props.prices.at(middlePriceIndex)
const selectedTier = ref(middlePrice.tier)

const onConfirm = async () => {
    onDialogOK({ tier: selectedTier.value })
  },
  onCancel = () => {
    onDialogCancel()
  },
  onDismiss = () => {
    onDialogHide()
  }
</script>
