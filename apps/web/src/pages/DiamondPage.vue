<template>
  <q-page class="q-pa-md row q-col-gutter-md justify-center items-start">
    <div id="diamond-page-container" class="row q-col-gutter-lg">
      <div class="col-12 text-center">
        <span
          class="diamond-page-title"
          v-html="$t('Pages.DiamondPage.Title').replace(/\(([^)]+)\)/gi, `<em class='gradient'>$1</em>`)"
        ></span>
      </div>

      <div class="col-12">
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(49%, 1fr)); gap: 16px">
          <div v-for="(feature, i) in lacunaDiamondFeatures" :key="i">
            <q-card class="bg-dark-1" flat style="height: 100%">
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
        <q-separator></q-separator>
      </div>

      <div class="col-12">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6 col-md-4" v-for="i in pageLoading ? 3 : 0" :key="i">
            <q-skeleton type="rect" width="100%" height="116px"></q-skeleton>
          </div>

          <div class="col-12 col-sm-6 col-md-4" v-for="(price, i) in pageLoading ? [] : prices" :key="i">
            <q-card :class="`bg-dark-1 ${i === middlePriceIndex ? 'bordered-block bordered-primary' : ''}`" flat>
              <q-badge v-if="price.salePrice" color="primary" floating>
                <span>-{{ Math.round(((price.price - price.salePrice) * 100) / price.price) }}%</span>
              </q-badge>
              <q-item>
                <q-item-section>
                  <q-item-label>
                    <del v-if="price.salePrice" class="q-mr-xs opacity-md">
                      {{ price.price }}{{ currency.symbol }}
                    </del>
                    <span class="text-h5 text-white">
                      {{ price.salePrice ? price.salePrice : price.price }}{{ currency.symbol }}
                    </span>
                    <span class="q-mx-xs">/</span>
                    <span class="text-caption">
                      {{
                        DateTime.fromMillis(Date.now() + price.durationSeconds * 1000)
                          .diffNow(
                            price.durationSeconds > 604800 ? 'months' : price.durationSeconds > 86400 ? 'days' : 'hours'
                          )
                          .toHuman({ maximumFractionDigits: 0 })
                      }}
                    </span>
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-card-section>
                <q-btn
                  class="full-width"
                  :label="$t('Components.LacunaDiamond.Pay')"
                  unelevated
                  no-caps
                  color="dark-2"
                  to="/@me/guilds?fpp=1"
                />
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <div class="col-12">
        <q-separator></q-separator>
      </div>

      <div class="col-12">
        <q-markup-table class="" flat separator="vertical" wrap-cells>
          <thead class="bg-dark-1">
            <tr>
              <th class="text-left" style="min-width: 220px; width: 50%">
                <div class="text-h5">{{ $t('Components.LacunaDiamond.PlanComparison') }}</div>
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
                <div v-if="feature.free.type === 'number'" class="text-subtitle1">
                  {{ numbro(feature.free.value).format({ thousandSeparated: true }) }}
                </div>
                <q-icon v-if="feature.free.type === 'icon'" :name="feature.free.value" class="text-subtitle1"></q-icon>
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
                <div v-if="feature.diamond.type === 'number'" class="text-subtitle1">
                  {{ numbro(feature.diamond.value).format({ thousandSeparated: true }) }}
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
      </div>
    </div>

    <div class="col-12">
      <div class="row q-col-gutter-md">
        <div class="col-12 text-h4 text-center">
          {{ $t('Pages.DiamondPage.OurPatrons') }}
          <q-icon
            class="heart cursor-pointer"
            name="favorite"
            color="primary"
            size="64px"
            @click="onHeartClick"
          ></q-icon>
        </div>

        <div class="col-12">
          <div class="auto-scroller" v-for="i in pageLoading ? 4 : 0" :key="i">
            <q-intersection
              :class="`auto-scroller-item ${isEven(i) ? 'auto-scroll-right' : 'auto-scroll-left'} q-my-md`"
              v-for="ii in 32"
              :key="ii"
              :style="{
                animationDuration: `calc(2s * 32)`,
                animationDelay: `calc((2s * 32) / 32 * (${32 - ii + 1}) * -1)`,
                [isEven(i) ? 'right' : 'left']: `calc(64px * 32)`
              }"
            >
              <q-skeleton class="rounded-circle" type="QAvatar" size="64px"></q-skeleton>
            </q-intersection>
          </div>

          <div class="auto-scroller" v-for="(patrons, i) in pageLoading ? [] : chunkedPatrons" :key="i">
            <q-intersection
              :class="`auto-scroller-item ${isEven(i) ? 'auto-scroll-right' : 'auto-scroll-left'} q-my-md`"
              v-for="(patron, ii) in patrons"
              :key="patron.id"
              :style="{
                animationDuration: `calc(2s * ${patrons.length})`,
                animationDelay: `calc((2s * ${patrons.length}) / ${patrons.length} * (${patrons.length - ii + 1}) * -1)`,
                [isEven(i) ? 'right' : 'left']: `calc(64px * ${patrons.length})`
              }"
            >
              <PatronAvatar :patron="patron" />
            </q-intersection>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { interfaces } from 'src/boot/axios'
import { DateTime } from 'src/boot/luxon'
import { numbro } from 'src/boot/numbro'
import PatronAvatar from 'src/components/PatronAvatar.vue'
import { lacunaDiamondFeatures, lacunaDiamondPlanComparison } from 'src/utils/Constants'
import { chunkArray, decimalToHex, getLocale, handleAxiosError, isEven } from 'src/utils/Utils'
import { computed, onMounted, ref } from 'vue'
import { event } from 'vue-gtag'

const $q = useQuasar()

const pageLoading = ref(true)
const products = ref([]),
  currency = computed(() => {
    const locale = getLocale()

    if (locale === 'ru') return { code: 'RUB', symbol: '₽' }
    return { code: 'USD', symbol: '$' }
  }),
  prices = computed(() => {
    return products.value
      .filter(v => v.prices.some(vv => vv.currency_code === currency.value.code))
      .map(v => {
        const price = v.prices.find(vv => vv.currency_code === currency.value.code)

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
  middlePriceIndex = computed(() => {
    return Math.floor((prices.value.length - 1) / 2)
  })
const patrons = ref([]),
  chunkedPatrons = computed(() => {
    return chunkArray(patrons.value, patrons.value.length / (patrons.value.length / 100))
  })

const getProducts = async () => {
  try {
    const response = await interfaces.common.getProducts(),
      { data } = response

    products.value = data.products

    return true
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
  }

  return false
}

const getPatrons = async () => {
  try {
    const response = await interfaces.users.getPatrons(),
      { data } = response

    patrons.value = data

    return true
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
  }

  return false
}

const onHeartClick = e => {
  const color = decimalToHex(Math.floor(Math.random() * (0xffffff + 1)))
  e.srcElement.style.setProperty('color', `#${color}`, 'important')
  event('patrons_heart_click', { event_category: 'clicks' })
}

onMounted(async () => {
  const getProductsStatus = await getProducts(),
    getPatronsStatus = await getPatrons()

  pageLoading.value = !(getProductsStatus && getPatronsStatus)
})
</script>

<style lang="scss" scoped>
#diamond-page-container {
  width: 100%;
  max-width: 100%;

  @media (min-width: $breakpoint-lg-min) {
    max-width: 50%;
    min-width: 50%;
  }
}

.diamond-page-title {
  font-size: clamp(1.5rem, 10vw, 3rem);
}

.auto-scroller {
  position: relative;
  overflow: hidden;
  height: 96px;
  mask-image: linear-gradient(to right, transparent, $dark-2 5%, $dark-2 95%, transparent);
}

.auto-scroller-item {
  position: absolute;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}

.auto-scroll-left {
  animation-name: auto-scroll-left;
}

.auto-scroll-right {
  animation-name: auto-scroll-right;
}

@keyframes auto-scroll-left {
  to {
    left: -64px;
  }
}

@keyframes auto-scroll-right {
  to {
    right: -64px;
  }
}

.grid-container {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: 1fr 1fr 1fr 1fr;
  justify-content: start;
  gap: 8px;
  overflow-x: hidden;
}
</style>
