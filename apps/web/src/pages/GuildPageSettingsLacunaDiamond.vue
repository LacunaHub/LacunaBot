<template>
  <div class="row q-col-gutter-md">
    <div class="col-12">
      <q-banner class="bg-dark-1 rounded-borders" dense>
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
          <q-avatar class="q-ml-xs" size="md">
            <img src="~assets/lacuna-diamond.svg" alt="" />
          </q-avatar>
        </template>
      </q-banner>
    </div>

    <div class="col-12">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-4" v-for="(feature, i) in lacunaDiamondFeatures" :key="i">
          <q-card class="bg-dark-1" flat>
            <q-item :class="`q-item__${feature.name}`">
              <q-item-section avatar top>
                <q-avatar size="64px" square>
                  <lord-icon
                    :src="feature.icon"
                    trigger="hover"
                    :colors="feature.iconColors"
                    style="width: 100%; height: 100%"
                    :target="`.q-item__${feature.name}`"
                  >
                  </lord-icon>
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ $t(feature.description) }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-card>
        </div>
      </div>
    </div>

    <div class="col-12">
      <q-list class="bg-dark-1 overflow-hidden rounded-borders">
        <q-expansion-item>
          <template #header>
            <q-item-section>
              <q-item-label class="text-subtitle1">
                {{ $t('Components.LacunaDiamond.PlanComparison') }}
              </q-item-label>
            </q-item-section>
          </template>

          <q-markup-table class="no-border-top no-border-radius" flat separator="vertical" wrap-cells>
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

    <div class="col-12">
      <q-card class="bg-dark-1" flat>
        <q-item class="q-py-md rounded-t-lg">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('Components.LacunaDiamond.SelectPaymentMethod') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-btn-toggle
              v-model="selectedPaymentType"
              color="dark-2"
              toggle-color="primary"
              no-caps
              unelevated
              :options="[
                { label: 'Единовременная оплата', value: 'OneTime', icon: 'paid' },
                { label: 'Подписаться', value: 'Subscription', icon: 'currency_exchange' }
              ]"
              @update:model-value="onUpdatePaymentType"
            />
          </q-item-section>
        </q-item>

        <div v-if="selectedPaymentType === 'OneTime'">
          <q-card-section>
            <q-skeleton v-if="pageLoading" class="q-mt-sm" type="rect" height="62px"></q-skeleton>

            <q-select
              v-model="selectedMethod"
              :options="paymentMethods.filter(v => !isSubscriptionMethod(v.value))"
              option-label="name"
              filled
              dense
              hide-bottom-space
              emit-value
              map-options
            >
              <template #selected-item="{ opt }">
                <span>
                  <q-icon v-if="opt.value === 'Tokens'" name="group_work" size="md" style="color: #ff3366"></q-icon>

                  <q-avatar v-else size="md">
                    <img :src="opt.icon" alt="" />
                  </q-avatar>
                </span>

                <span class="q-ml-sm">{{ opt.name }}</span>
              </template>

              <template #option="{ opt, toggleOption, selected }">
                <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                  <q-item-section avatar>
                    <q-icon v-if="opt.value === 'Tokens'" name="group_work" size="md" style="color: #ff3366"></q-icon>

                    <q-avatar v-else size="md">
                      <img :src="opt.icon" alt="" />
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label>{{ opt.name }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <!-- <q-tabs
              v-model="selectedMethod"
              class="bg-dark-2 rounded-borders q-mt-sm"
              align="justify"
              active-bg-color="secondary"
              indicator-color="transparent"
              @update:model-value="onUpdatePaymentMethod"
            >
              <q-tab
                v-for="method in paymentMethods.filter(v => !isSubscriptionMethod(v.value))"
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
            </q-tabs> -->
          </q-card-section>

          <q-item class="q-py-md">
            <q-item-section>
              <q-item-label class="text-subtitle1">
                {{ $t('Components.LacunaDiamond.SelectPlan') }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-4" v-for="(price, i) of selectedMethodPrices" :key="i">
                <q-btn
                  class="full-width"
                  unelevated
                  @click="onPay(price.tier)"
                  :loading="loadingStates.includes(price.tier)"
                  :disable="
                    pageLoading ||
                    (guild.premium.available && guild.premium.expires_at === 0) ||
                    loadingStates.length > 0
                  "
                  no-caps
                  color="primary"
                  push
                >
                  <template #default>
                    <del v-if="price.salePrice" class="q-mr-xs opacity-md">
                      {{ price.price }}{{ selectedMethodCurrency.symbol }}
                    </del>
                    <span class="text-h6 text-white">
                      {{ price.salePrice ? price.salePrice : price.price }}{{ selectedMethodCurrency.symbol }}
                    </span>
                    <span class="q-mx-sm">/</span>
                    <span class="text-caption">
                      {{
                        DateTime.fromMillis(Date.now() + price.durationSeconds * 1000)
                          .diffNow(
                            price.durationSeconds > 604800 ? 'months' : price.durationSeconds > 86400 ? 'days' : 'hours'
                          )
                          .toHuman({ maximumFractionDigits: 0 })
                      }}
                    </span>
                  </template>

                  <template #loading>
                    <q-spinner-dots color="white"></q-spinner-dots>
                  </template>
                </q-btn>
              </div>
            </div>
          </q-card-section>

          <q-card-section v-if="selectedMethod === 'Tokens'">
            <q-banner class="bg-dark-2 rounded-borders" :inline-actions="$q.screen.gt.sm" dense>
              <span>
                {{
                  $t('Components.LacunaDiamond.TokensInfo', {
                    bonusesDurationInHours: splitRelativeTime(null, 24, 'hours')
                  })
                }}
              </span>

              <template #avatar>
                <q-icon name="info" color="info" size="md"></q-icon>
              </template>

              <template #action>
                <q-btn
                  style="background-color: #ff3366"
                  unelevated
                  no-caps
                  href="https://top.gg/bot/740585412560420914/vote"
                  target="_blank"
                >
                  <span>Vote for Lacuna</span>
                </q-btn>
              </template>
            </q-banner>
          </q-card-section>
        </div>

        <div v-else-if="selectedPaymentType === 'Subscription'">
          <q-card-section>
            <div class="row q-col-gutter-md">
              <div
                class="col-12 col-md-4"
                v-for="method in paymentMethods.filter(v => isSubscriptionMethod(v.value))"
                :key="method.value"
              >
                <q-btn-group
                  v-if="method.value === 'Patreon'"
                  class="full-width"
                  push
                  unelevated
                  :style="{ backgroundColor: '#ff424d', opacity: selectedMethod === 'Patreon' ? '1' : '0.75' }"
                >
                  <q-btn class="full-width" push unelevated no-caps @click="selectedMethod = 'Patreon'">
                    <q-icon class="q-mr-sm" name="fab fa-patreon" size="md"></q-icon>

                    <span>{{ method.name }}</span>
                  </q-btn>

                  <q-separator vertical color="white" inset></q-separator>

                  <q-btn
                    push
                    unelevated
                    icon="link"
                    href="https://www.patreon.com/xelitte/join"
                    target="_blank"
                  ></q-btn>
                </q-btn-group>

                <q-btn-group
                  v-if="method.value === 'Boosty'"
                  class="full-width"
                  push
                  unelevated
                  :style="{ backgroundColor: '#f15f2c', opacity: selectedMethod === 'Boosty' ? '1' : '0.75' }"
                >
                  <q-btn class="full-width" push unelevated no-caps @click="selectedMethod = 'Boosty'">
                    <q-avatar class="q-mr-sm" size="md">
                      <img src="~assets/boosty-logo-white.svg" />
                    </q-avatar>

                    <span>{{ method.name }}</span>
                  </q-btn>

                  <q-separator vertical color="white" inset></q-separator>

                  <q-btn
                    push
                    unelevated
                    icon="link"
                    href="https://boosty.to/xelitte/purchase/2710502"
                    target="_blank"
                  ></q-btn>
                </q-btn-group>

                <q-btn-group
                  v-if="method.value === 'DiscordNitroBoost'"
                  class="full-width"
                  push
                  unelevated
                  :style="{
                    backgroundColor: '#5662f6',
                    opacity: selectedMethod === 'DiscordNitroBoost' ? '1' : '0.75'
                  }"
                >
                  <q-btn class="full-width" push unelevated no-caps @click="selectedMethod = 'DiscordNitroBoost'">
                    <q-icon class="q-mr-sm" name="fab fa-discord" size="md"></q-icon>

                    <span>{{ method.name }}</span>
                  </q-btn>

                  <q-separator vertical color="white" inset></q-separator>

                  <q-btn push unelevated icon="link" href="https://discord.gg/srfhGjbKce" target="_blank"></q-btn>
                </q-btn-group>
              </div>
            </div>
          </q-card-section>

          <q-card-section>
            <q-banner class="bg-dark-2 rounded-borders" :inline-actions="$q.screen.gt.sm" dense>
              <span v-if="selectedMethod === 'Patreon'">
                {{ $t('Components.LacunaDiamond.PatreonAfterCheckout') }}

                <b>
                  {{ $t('Components.LacunaDiamond.PatreonAfterCheckoutImportantInfo', { platform: 'Patreon' }) }}
                </b>
              </span>

              <span v-if="selectedMethod === 'Boosty'">
                {{ $t('Components.LacunaDiamond.PatreonAfterCheckout') }}

                <b>
                  {{ $t('Components.LacunaDiamond.PatreonAfterCheckoutImportantInfo', { platform: 'Boosty' }) }}
                </b>
              </span>

              <span v-if="selectedMethod === 'DiscordNitroBoost'">
                {{ $t('Components.LacunaDiamond.DNBBonusesInfo') }}
              </span>

              <template #avatar>
                <q-icon name="info" color="info" size="md"></q-icon>
              </template>

              <template #action>
                <q-btn
                  color="primary"
                  unelevated
                  no-caps
                  href="https://top.gg/bot/740585412560420914/vote"
                  target="_blank"
                >
                  <span>Проверить наличие подписки</span>
                </q-btn>
              </template>
            </q-banner>
          </q-card-section>
        </div>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { useQuasar } from 'quasar'
import boostyLogo from 'src/assets/boosty-logo.svg'
import discordNitroBoost from 'src/assets/discord-nitro-boost.svg'
import paypalLogo from 'src/assets/paypal-logo.svg'
import { interfaces } from 'src/boot/axios'
import { DateTime } from 'src/boot/luxon'
import { useGuildStore } from 'src/stores/guild'
import { lacunaDiamondFeatures, lacunaDiamondPlanComparison } from 'src/utils/Constants'
import { handleAxiosError, openPopupWindow, splitRelativeTime } from 'src/utils/Utils'
import { computed, onMounted, ref } from 'vue'
import { event } from 'vue-gtag'

const $q = useQuasar(),
  guild = useGuildStore()

const pageLoading = ref(true),
  loadingStates = ref([])
const selectedPaymentType = ref('OneTime')
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
  })
const products = ref([])

const isSubscriptionMethod = method => {
  return ['Patreon', 'Boosty', 'DiscordNitroBoost', 'ProjectTeam'].includes(method)
}

const onUpdatePaymentType = () => {
  if (selectedPaymentType.value === 'OneTime') {
    selectedMethod.value = 'PayPal'
  } else {
    selectedMethod.value = 'Patreon'
  }
}

const onPay = async tier => {
  loadingStates.value.push(tier)

  try {
    const isSubscription = isSubscriptionMethod(selectedMethod.value)

    event('checkout_progress', { event_label: selectedMethod.value, selected_tier: tier })

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
          product: products.value.find(v => v.tier === tier),
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
    loadingStates.value.splice(loadingStates.value.indexOf(tier), 1)
  }
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

  pageLoading.value = false
})
</script>
