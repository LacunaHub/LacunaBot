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

      <q-card-section>
        <div>
          {{ $t('Components.LacunaDiamond.WaysToGet') }}
        </div>

        <div
          class="q-mt-sm"
          style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px"
        >
          <q-skeleton v-for="i in pageLoading ? 4 : 0" :key="i" type="rect" height="54px"></q-skeleton>

          <div v-for="method in paymentMethods" :key="method.value">
            <q-card class="bg-dark-2" flat @click="paymentMethodDialog(method.value)">
              <q-item clickable>
                <q-item-section avatar>
                  <q-avatar size="lg">
                    <q-icon
                      v-if="method.value === 'Tokens'"
                      name="group_work"
                      size="md"
                      style="color: #ff3366"
                    ></q-icon>

                    <q-icon
                      v-else-if="method.value === 'Patreon'"
                      name="fab fa-patreon"
                      size="md"
                      style="color: #ff424d"
                    ></q-icon>

                    <img v-else :src="method.icon" />
                  </q-avatar>
                </q-item-section>

                <q-item-section class="ellipsis">
                  <div>{{ method.name }}</div>
                </q-item-section>
              </q-item>
            </q-card>
          </div>

          <div v-if="!pageLoading">
            <q-card class="bg-dark-2" flat @click="transferDiamondDialog">
              <q-item clickable>
                <q-item-section avatar>
                  <q-avatar size="lg">
                    <q-icon name="r_move_down" size="md" color="primary"></q-icon>
                  </q-avatar>
                </q-item-section>

                <q-item-section class="ellipsis">
                  <div>{{ $t('Common.Transfer') }}</div>
                </q-item-section>
              </q-item>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-btn class="full-width" :label="$t('Common.Close')" unelevated no-caps color="dark-2" @click="onCancel" />
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
import { useGuildStore } from 'src/stores/guild'
import { lacunaDiamondFeatures, lacunaDiamondPlanComparison } from 'src/utils/Constants'
import { handleAxiosError, openPopupWindow } from 'src/utils/Utils'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { event } from 'vue-gtag'
import { useI18n } from 'vue-i18n'
import LacunaDiamondMethodDirect from './LacunaDiamondMethodDirect.vue'
import LacunaDiamondMethodDiscordRoles from './LacunaDiamondMethodDiscordRoles.vue'
import LacunaDiamondTransfer from './LacunaDiamondTransfer.vue'

defineEmits(useDialogPluginComponent.emits)

const $q = useQuasar(),
  { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()
const { t: $t } = useI18n()

const pageLoading = ref(true)
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

const isSubscriptionMethod = method => {
  return ['Patreon', 'Boosty', 'DiscordNitroBoost', 'ProjectTeam'].includes(method)
}

const paymentMethodDialog = method => {
  selectedMethod.value = method
  const isSubscription = isSubscriptionMethod(selectedMethod.value)
  let component = LacunaDiamondMethodDirect,
    componentProps = {
      method: selectedMethod.value,
      currency: selectedMethodCurrency.value,
      prices: selectedMethodPrices.value
    }

  if (isSubscription) {
    component = LacunaDiamondMethodDiscordRoles
    componentProps = {
      currentPlatform: selectedMethod.value,
      platforms: paymentMethods.value.filter(v => isSubscriptionMethod(v.value))
    }
  }

  return $q.dialog({ component, componentProps }).onOk(data => {
    if (isSubscriptionMethod(data.platform)) selectedMethod.value = data.platform
    if (typeof data.tier === 'number') selectedTier.value = data.tier
    onConfirm()
  })
}
const transferDiamondDialog = () => {
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
    paymentMethods.value.push({ name: 'Team', value: 'ProjectTeam', icon: lacunaLogo })
    iddqd.value.keys = []

    return
  }

  iddqd.value.timeout = setTimeout(() => {
    iddqd.value.keys = []

    clearTimeout(iddqd.value.timeout)
  }, 5000)
}

const onConfirm = async () => {
    $q.loading.show()

    try {
      const isSubscription = isSubscriptionMethod(selectedMethod.value)

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
      $q.loading.hide()
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
