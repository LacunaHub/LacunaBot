<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="bg-dark-1" flat style="width: 800px; max-width: 90vw">
      <q-card-section v-if="guild.premium.available">
        <q-banner class="bg-dark-2 rounded-borders" dense>
          <span v-if="guild.premium.expires_at">
            {{
              $t('Components.LacunaDiamond.HasSubscription', {
                date: $dt.fromMillis(guild.premium.expires_at).toFormat('ff')
              })
            }}
          </span>

          <span v-else>
            {{ $t('Components.LacunaDiamond.UnlimitedSubscription') }}
          </span>

          <template #avatar>
            <q-avatar class="q-ml-xs" size="28px">
              <img src="~assets/lacuna-diamond.svg" alt="" />
            </q-avatar>
          </template>
        </q-banner>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6" v-for="(bonus, i) in lacunaDiamondFeatures" :key="i">
            <q-item :class="`no-padding q-item__${bonus.name}`">
              <q-item-section avatar top>
                <q-avatar size="64px" square>
                  <lord-icon
                    :src="bonus.icon"
                    trigger="hover"
                    :colors="bonus.iconColors"
                    style="width: 100%; height: 100%"
                    :target="`.q-item__${bonus.name}`"
                  >
                  </lord-icon>
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ $t(bonus.description) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </div>
        </div>
      </q-card-section>

      <div class="q-pa-md">
        <q-list class="bg-dark-2 overflow-hidden rounded-borders">
          <q-expansion-item :label="$t('Components.LacunaDiamond.PlanComparison')">
            <q-markup-table class="no-border-top no-border-radius" flat bordered separator="vertical" wrap-cells>
              <thead class="bg-dark-1">
                <tr>
                  <th style="min-width: 220px; width: 50%">
                    <div class="text-h4"></div>
                  </th>
                  <th style="min-width: 100px; width: 20%">
                    <div class="text-h5">Free</div>
                  </th>
                  <th style="min-width: 140px; width: 30%">
                    <div class="text-h5 text-primary">Diamond</div>
                  </th>
                </tr>
              </thead>

              <tbody v-for="(plan, i) in lacunaDiamondPlanComparison" :key="i" class="bg-dark-1">
                <tr class="q-tr--no-hover">
                  <td style="min-width: 220px; width: 50%">
                    <div class="text-h6">
                      {{ $t(plan.categoryName) }}
                    </div>
                  </td>
                  <td class="text-center" style="min-width: 100px; width: 20%"></td>
                  <td class="text-center" style="min-width: 140px; width: 30%"></td>
                </tr>

                <tr v-for="(feature, ii) in plan.features" :key="ii" class="q-tr--no-hover">
                  <td class="text-almost-white-2" style="min-width: 220px; width: 50%">
                    {{ $t(feature.name) }}
                  </td>
                  <td class="text-center" style="min-width: 100px; width: 20%">
                    <div v-if="feature.free.type === 'text'" class="text-subtitle1">
                      {{ feature.free.value }}
                    </div>
                    <q-icon
                      v-if="feature.free.type === 'icon'"
                      :name="feature.free.value"
                      class="text-subtitle1"
                    ></q-icon>
                    <q-icon
                      v-if="feature.free.type === 'boolean'"
                      :name="feature.free.value ? 'check' : 'close'"
                      :color="feature.free.value ? 'positive' : 'negative'"
                      class="text-subtitle1"
                    ></q-icon>
                  </td>
                  <td class="text-center text-primary" style="min-width: 140px; width: 30%">
                    <div v-if="feature.diamond.type === 'text'" class="text-subtitle1">
                      {{ feature.diamond.value }}
                    </div>
                    <q-icon
                      v-if="feature.diamond.type === 'icon'"
                      :name="feature.diamond.value"
                      class="text-subtitle1"
                    ></q-icon>
                    <q-icon
                      v-if="feature.diamond.type === 'boolean'"
                      :name="feature.diamond.value ? 'check' : 'close'"
                      :color="feature.diamond.value ? 'positive' : 'negative'"
                      class="text-subtitle1"
                    ></q-icon>
                  </td>
                </tr>
              </tbody>
            </q-markup-table>
          </q-expansion-item>
        </q-list>
      </div>

      <q-card-section v-if="selectedMethod === 'DiscordNitroBoost'">
        <q-card class="bg-dark-2" flat>
          <q-card-section>
            <q-btn
              class="full-width"
              style="background-color: #5662f6"
              unelevated
              no-caps
              href="https://discord.gg/srfhGjbKce"
              target="_blank"
            >
              <q-icon class="q-mr-sm" name="fab fa-discord" size="24px"></q-icon>

              <span>Lacuna Hub</span>
            </q-btn>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-banner class="bg-dark-1 rounded-borders" dense>
              <span>
                {{ $t('Components.LacunaDiamond.DNBBonusesInfo') }}
              </span>

              <template #avatar>
                <q-icon name="info" color="info"></q-icon>
              </template>
            </q-banner>
          </q-card-section>
        </q-card>
      </q-card-section>

      <q-card-section v-else-if="selectedMethod === 'Patreon'">
        <q-card class="bg-dark-2" flat>
          <q-card-section>
            <q-btn
              class="full-width"
              style="background-color: #ff424d"
              unelevated
              no-caps
              href="https://www.patreon.com/xelitte/join"
              target="_blank"
            >
              <q-icon class="q-mr-sm" name="fab fa-patreon" size="24px"></q-icon>

              <span>Become a Patron</span>
            </q-btn>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-banner class="bg-dark-1 rounded-borders" dense>
              <span>
                {{ $t('Components.LacunaDiamond.PatreonAfterCheckout') }}

                <b>
                  {{ $t('Components.LacunaDiamond.PatreonAfterCheckoutImportantInfo', { platform: 'Patreon' }) }}
                </b>
              </span>

              <template #avatar>
                <q-icon name="info" color="info"></q-icon>
              </template>
            </q-banner>
          </q-card-section>
        </q-card>
      </q-card-section>

      <q-card-section v-else-if="selectedMethod === 'Boosty'">
        <q-card class="bg-dark-2" flat>
          <q-card-section>
            <q-btn
              class="full-width"
              style="background-color: #f15f2c"
              unelevated
              no-caps
              href="https://boosty.to/xelitte/purchase/2710502"
              target="_blank"
            >
              <q-avatar class="q-mr-xs" size="24px" square>
                <img src="~assets/boosty-logo-white.svg" />
              </q-avatar>

              <span>Subscribe</span>
            </q-btn>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-banner class="bg-dark-1 rounded-borders" dense>
              <span>
                {{ $t('Components.LacunaDiamond.PatreonAfterCheckout') }}

                <b>
                  {{ $t('Components.LacunaDiamond.PatreonAfterCheckoutImportantInfo', { platform: 'Boosty' }) }}
                </b>
              </span>

              <template #avatar>
                <q-icon name="info" color="info"></q-icon>
              </template>
            </q-banner>
          </q-card-section>
        </q-card>
      </q-card-section>

      <div v-else-if="selectedMethod === 'ProjectTeam'"></div>

      <q-card-section v-else>
        <div>
          {{ $t('Components.LacunaDiamond.SelectPlan') }}
        </div>

        <q-skeleton v-if="pageLoading" class="q-mt-sm" type="rect" height="62px"></q-skeleton>

        <q-tabs
          v-else
          v-model.number="selectedTier"
          class="bg-dark-2 rounded-borders q-mt-sm"
          align="justify"
          active-bg-color="secondary"
          indicator-color="transparent"
        >
          <q-tab
            v-for="(price, i) of selectedMethodPrices"
            :key="i"
            :name="price.tier"
            no-caps
            :style="{ width: $q.screen.lt.sm ? 'fit-content' : `calc(100% / ${price.length})` }"
          >
            <div>
              <del v-if="price.salePrice" class="q-mr-xs opacity-lg">
                {{ price.price }}{{ selectedMethodCurrency.symbol }}
              </del>
              <span class="text-h5 text-white">
                {{ price.salePrice ? price.salePrice : price.price }}{{ selectedMethodCurrency.symbol }}
              </span>
              <br />
              <span class="text-caption">
                {{
                  DateTime.fromMillis(Date.now() + price.durationSeconds * 1000)
                    .diffNow(
                      price.durationSeconds > 604800 ? 'months' : price.durationSeconds > 86400 ? 'days' : 'hours'
                    )
                    .toHuman({ maximumFractionDigits: 0 })
                }}
              </span>
            </div>
          </q-tab>
        </q-tabs>
      </q-card-section>

      <q-card-section v-if="selectedMethod === 'Tokens'">
        <q-card class="bg-dark-2" flat>
          <q-card-section>
            <q-btn
              class="full-width"
              style="background-color: #ff3366"
              unelevated
              no-caps
              href="https://top.gg/bot/740585412560420914/vote"
              target="_blank"
            >
              <q-icon class="q-mr-sm" name="fas fa-angle-up" size="24px"></q-icon>

              <span>Vote for Lacuna</span>
            </q-btn>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-banner class="bg-dark-1 rounded-borders" dense>
              <span>
                {{
                  $t('Components.LacunaDiamond.TokensInfo', {
                    bonusesDurationInHours: splitRelativeTime(guild.locale, 24, 'hours')
                  })
                }}
              </span>

              <template #avatar>
                <q-icon name="info" color="info"></q-icon>
              </template>
            </q-banner>
          </q-card-section>
        </q-card>
      </q-card-section>

      <q-card-section>
        <div>
          {{ $t('Components.LacunaDiamond.SelectPaymentMethod') }}
        </div>

        <q-skeleton v-if="pageLoading" class="q-mt-sm" type="rect" height="62px"></q-skeleton>

        <q-tabs
          v-else
          v-model="selectedMethod"
          class="bg-dark-2 rounded-borders q-mt-sm"
          align="justify"
          active-bg-color="secondary"
          indicator-color="transparent"
          @update:model-value="onUpdatePaymentMethod"
        >
          <q-tab
            v-for="method in paymentMethods"
            :key="method.value"
            :name="method.value"
            no-caps
            :style="{ width: $q.screen.lt.sm ? 'fit-content' : `calc(100% / ${paymentMethods.length})` }"
          >
            <q-avatar size="32px" square>
              <q-icon
                v-if="method.value === 'Patreon'"
                name="fab fa-patreon"
                size="20px"
                style="color: #ff424d"
              ></q-icon>

              <q-icon
                v-else-if="method.value === 'Tokens'"
                name="fas fa-angle-up"
                size="20px"
                style="color: #ff3366"
              ></q-icon>

              <img v-else :src="method.icon" />
            </q-avatar>

            <div class="text-white">
              {{ method.name }}
            </div>
          </q-tab>
        </q-tabs>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-btn class="full-width" :label="$t('Common.Close')" unelevated no-caps color="dark-2" @click="onCancel" />
          </div>

          <div class="col-12 col-md-6">
            <q-btn-dropdown
              class="full-width"
              :label="
                $t(
                  `Components.LacunaDiamond.${
                    ['Patreon', 'Boosty', 'DiscordNitroBoost', 'ProjectTeam'].includes(selectedMethod) ? 'Check' : 'Pay'
                  }`
                )
              "
              unelevated
              @click="onConfirm"
              :loading="confirmLoading"
              :disable="pageLoading || (guild.premium.available && guild.premium.expires_at === 0)"
              no-caps
              color="primary"
              split
            >
              <q-list>
                <q-item clickable v-close-popup @click="transferDialog">
                  <q-item-section>
                    <q-item-label>
                      {{ $t('Common.Transfer') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <template #loading>
                <q-spinner-dots color="white"></q-spinner-dots>
              </template>
            </q-btn-dropdown>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useDialogPluginComponent, useQuasar } from 'quasar'
import boostyLogo from 'src/assets/boosty-logo.svg'
import discordNitroBoost from 'src/assets/discord-nitro-boost.svg'
import lacunaLogo from 'src/assets/lacuna-logo.svg'
import paypalLogo from 'src/assets/paypal-logo.svg'
import { interfaces } from 'src/boot/axios'
import { DateTime } from 'src/boot/luxon'
import { useGuildStore } from 'src/stores/guild'
import { lacunaDiamondFeatures, lacunaDiamondPlanComparison } from 'src/utils/Constants'
import { handleAxiosError, openPopupWindow, splitRelativeTime } from 'src/utils/Utils'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { event } from 'vue-gtag'
import { useI18n } from 'vue-i18n'
import LacunaDiamondTransfer from './LacunaDiamondTransfer.vue'

defineEmits(useDialogPluginComponent.emits)

const $q = useQuasar(),
  { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()
const { t: $t } = useI18n()

const pageLoading = ref(true),
  confirmLoading = ref(false)
const guild = useGuildStore()
const products = ref([])
const paymentMethods = ref([]),
  selectedMethod = ref('PayPal'),
  selectedMethodCurrency = computed(() => {
    if (selectedMethod.value === 'Tokens') return { code: 'TKN', symbol: 't' }

    return { code: 'USD', symbol: '$' }
  }),
  selectedMethodPrices = computed(() => {
    return products.value
      .filter(v => v.prices.some(vv => vv.currency_code === selectedMethodCurrency.value.code))
      .map(v => {
        const price = v.prices.find(vv => vv.currency_code === selectedMethodCurrency.value.code)

        return {
          type: v.type,
          currencyCode: price.currency_code,
          price: price.amount,
          salePrice: price.sale_amount,
          tier: v.tier,
          durationSeconds: v.duration_seconds
        }
      })
  }),
  selectedTier = ref(0)

const onUpdatePaymentMethod = () => {
  const paymentMethodProducts = products.value.filter(v =>
    v.prices.some(vv => vv.currency_code === selectedMethodCurrency.value.code)
  )

  selectedTier.value = paymentMethodProducts.at(0).tier
}

const transferDialog = () => {
  return $q
    .dialog({
      component: LacunaDiamondTransfer
    })
    .onOk(() => {
      window.location.reload()
    })
}

const iddqd = ref({
  keys: [],
  timeout: null
})
const onKeyUp = keyboardEvent => {
  clearTimeout(iddqd.value.timeout)
  iddqd.value.keys.push(keyboardEvent.key)

  const correct = iddqd.value.keys.join('').toLowerCase() === 'iddqd'

  if (correct) {
    paymentMethods.value.pop()
    paymentMethods.value.push({ name: 'Team', value: 'ProjectTeam', icon: lacunaLogo })
    selectedMethod.value = 'ProjectTeam'
    iddqd.value.keys = []

    return
  }

  iddqd.value.timeout = setTimeout(() => {
    iddqd.value.keys = []

    clearTimeout(iddqd.value.timeout)
  }, 5000)
}

const onConfirm = async () => {
    confirmLoading.value = true

    try {
      const isSubscription = ['Patreon', 'Boosty', 'DiscordNitroBoost', 'ProjectTeam'].includes(selectedMethod.value)

      event('checkout_progress', { event_label: selectedMethod.value, selected_tier: selectedTier.value })

      if (isSubscription) {
        await interfaces.billing.createSubscription({
          data: {
            subscription_method: selectedMethod.value,
            guild_id: guild._id
          }
        })

        location.reload()
      } else {
        const response = await interfaces.billing.createPayment({
          data: {
            product: products.value.find(v => v.tier === selectedTier.value),
            payment_method: selectedMethod.value,
            guild_id: guild._id,
            guild_name: guild.guild.name
          }
        })

        const payUrl = response.data

        if (payUrl) {
          const popup = openPopupWindow({ url: payUrl, title: `Diamond for ${guild.guild.name}`, w: 520, h: 720 })
          const listener = () => {
            window.onmessage = null
            popup.close()
            location.reload()
          }

          window.onmessage = listener

          const interval = setInterval(() => {
            if (popup.closed) {
              window.onmessage = null
              clearInterval(interval)
            }
          }, 1000)
        }
      }

      onDialogOK()
    } catch (err) {
      const error = handleAxiosError(err)

      $q.notify({
        message: error.message,
        classes: 'q-notification-custom',
        color: 'black',
        icon: 'error',
        iconColor: 'negative',
        timeout: 5000
      })
    } finally {
      confirmLoading.value = false
    }
  },
  onCancel = () => {
    onDialogCancel()
  },
  onDismiss = () => {
    onDialogHide()
  }

onMounted(async () => {
  try {
    const response = await interfaces.common.getProducts()

    products.value = response.data.products
    paymentMethods.value = response.data.payment_methods.map(v => {
      let icon

      if (v.value === 'PayPal') icon = paypalLogo
      if (v.value === 'Boosty') icon = boostyLogo
      if (v.value === 'DiscordNitroBoost') icon = discordNitroBoost

      return { ...v, icon }
    })
  } catch (err) {
    const error = handleAxiosError(err)

    $q.notify({
      message: error.message,
      classes: 'q-notification-custom',
      color: 'black',
      icon: 'error',
      iconColor: 'negative',
      timeout: 5000
    })

    return
  }

  onUpdatePaymentMethod()
  pageLoading.value = false
  window.addEventListener('keyup', onKeyUp)
})

onBeforeUnmount(() => {
  window.removeEventListener('keyup', onKeyUp)
})
</script>
