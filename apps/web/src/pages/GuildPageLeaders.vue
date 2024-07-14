<template>
  <div class="row">
    <div class="col-12">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6">
          <q-select
            v-model="sortBy"
            :options="sortOptions"
            :disable="pageLoading"
            filled
            dense
            hide-bottom-space
            hide-dropdown-icon
            @update:model-value="onUpdateSearchParams"
          >
            <template #prepend>
              <q-icon name="r_sort"></q-icon>
            </template>

            <template #selected-item="{ opt }">
              <span>
                {{ $t(localeStringsMap.leadersSort[opt]) }}
              </span>
            </template>

            <template #option="{ opt, toggleOption, selected }">
              <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                <q-item-section>
                  <q-item-label>
                    {{ $t(localeStringsMap.leadersSort[opt]) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>

        <div class="col-12 col-sm-6">
          <q-select
            v-model="orderBy"
            :options="orderOptions"
            :disable="pageLoading"
            filled
            dense
            hide-bottom-space
            hide-dropdown-icon
            @update:model-value="onUpdateSearchParams"
          >
            <template #prepend>
              <q-icon name="r_swap_vert"></q-icon>
            </template>

            <template #selected-item="{ opt }">
              <span>
                {{ $t(localeStringsMap.sortOrders[opt]) }}
              </span>
            </template>

            <template #option="{ opt, toggleOption, selected }">
              <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                <q-item-section>
                  <q-item-label>
                    {{ $t(localeStringsMap.sortOrders[opt]) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>
      </div>
    </div>

    <div
      class="col-12 rounded-borders bordered-block overflow-auto q-mt-md q-pa-sm"
      style="min-height: max-content; max-height: 50vh"
    >
      <div v-if="pageLoading" class="row q-col-gutter-sm">
        <div v-for="i in 10" :key="i" class="col-12">
          <q-skeleton class="rounded-borders" type="rect" height="136px"></q-skeleton>
        </div>
      </div>

      <div v-else class="row q-col-gutter-sm">
        <div v-if="!leaders.length" class="col-12 text-center">
          <div class="text-h6 text-italic text--secondary">
            {{ $t('Pages.ErrorPage.ThereIsNothingHere') }}
          </div>
        </div>

        <div v-for="leader in leaders" :key="leader.user.id" class="col-12">
          <q-card class="bg-dark-3" flat>
            <q-item class="q-pt-sm">
              <q-item-section side>
                <q-avatar
                  :size="$q.screen.lt.md ? '16px' : '32px'"
                  :style="{ color: getPositionColor(leader.rank) }"
                  square
                >
                  <span style="font-size: 16px; position: absolute">{{
                    numbro(leader.rank).format({ thousandSeparated: true })
                  }}</span>
                </q-avatar>
              </q-item-section>

              <q-item-section avatar>
                <q-avatar :size="$q.screen.lt.md ? '48px' : '64px'">
                  <q-img
                    class="bordered-avatar rounded-circle"
                    :src="leader.user.avatar_url"
                    :placeholder-src="getDefaultAvatarURL(leader.user.id)"
                    :error-src="getDefaultAvatarURL(leader.user.id)"
                    height="100%"
                    width="100%"
                    no-spinner
                    no-transition
                  />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-subtitle1 ellipsis">
                  {{ leader.user.display_name || 'Unknown' }}
                </q-item-label>

                <q-item-label class="text--secondary ellipsis">
                  {{ leader.user.username }}
                </q-item-label>
              </q-item-section>

              <q-item-section v-if="resultType === 1" side>
                <q-circular-progress
                  class="cursor-help ellipsis"
                  show-value
                  :value="leader.data.progress"
                  color="primary"
                  track-color="dark-2"
                  :size="$q.screen.lt.sm ? '32px' : '48px'"
                >
                  <span class="text-body2">{{ leader.data.current_level }}</span>
                  <q-tooltip
                    class="bg-black text-body2"
                    anchor="top middle"
                    self="bottom middle"
                    transition-show=""
                    transition-hide=""
                  >
                    {{ numbro(Math.round(leader.data.current_exp)).format({ thousandSeparated: true }) }} /
                    {{ leader.data.nextLevel }}
                  </q-tooltip>
                </q-circular-progress>
              </q-item-section>

              <q-item-section v-if="resultType === 2" side>
                <q-circular-progress
                  class="cursor-help ellipsis"
                  show-value
                  :value="leader.data.percentage"
                  reverse
                  color="primary"
                  track-color="accent"
                  :size="$q.screen.lt.sm ? '32px' : '48px'"
                >
                  <span class="text-body2">
                    {{ numbro(leader.data.total).format({ average: true }) }}
                  </span>
                  <q-tooltip
                    class="bg-black text-body2"
                    anchor="top middle"
                    self="bottom middle"
                    transition-show=""
                    transition-hide=""
                  >
                    {{ leader.data.text }}
                  </q-tooltip>
                </q-circular-progress>
              </q-item-section>
            </q-item>

            <q-item v-if="resultType === 1" class="q-pb-sm">
              <q-item-section>
                <q-chip class="q-pa-md text--secondary" icon="r_forum" color="dark-2" size="12px" square>
                  <span class="ellipsis">
                    {{ numbro(leader.data.counted_messages).format({ thousandSeparated: true }) }}
                  </span>
                </q-chip>
              </q-item-section>

              <q-item-section>
                <q-chip class="q-pa-md text--secondary" icon="r_mic" color="dark-2" size="12px" square>
                  <span class="ellipsis">
                    {{ numbro(leader.data.counted_voice_time).format({ output: 'time' }) }}
                  </span>
                </q-chip>
              </q-item-section>
            </q-item>
          </q-card>
        </div>
      </div>
    </div>

    <div class="col-12 flex flex-center q-mt-md">
      <q-pagination
        v-if="pageCount"
        v-model.number="currentPage"
        :disable="pageLoading"
        :max="pageCount"
        :max-pages="8"
        :input="$q.screen.lt.md"
        unelevated
        color="dark-3"
        active-color="primary"
        direction-links
        boundary-numbers
        gutter="md"
        @update:model-value="onUpdatePage"
      />

      <div v-if="pageLoading && !pageCount" class="flex">
        <q-skeleton v-for="i in 6" :key="i" class="q-ml-md" type="rect" width="28px" height="30px"></q-skeleton>
      </div>
    </div>
  </div>
</template>

<script setup>
import numbro from 'numbro'
import { useQuasar } from 'quasar'
import { interfaces } from 'src/boot/axios'
import { localeStringsMap } from 'src/utils/Constants'
import { getDefaultAvatarURL, handleAxiosError } from 'src/utils/Utils'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  parentLoading: {
    type: Boolean,
    default: true
  }
})

const $q = useQuasar(),
  route = useRoute(),
  router = useRouter()

const pageLoading = ref(true)
const guildId = route.params.guild_id

const pageCount = ref(0),
  resultType = ref(0),
  resultCount = ref(0)
const leadersCache = ref({}),
  currentPage = ref(Math.abs(+route.query.page || 1)),
  sortBy = ref(route.query.sortBy || 'Level'),
  orderBy = ref(route.query.orderBy || 'Desc')
const leaders = computed(() => {
  return leadersCache.value[currentPage.value] ?? []
})

const sortOptions = ['Level', 'MessageCount', 'VoiceTime', 'Currencies'],
  orderOptions = ['Asc', 'Desc']

if (!sortOptions.includes(sortBy.value)) sortBy.value = 'Level'
if (!orderOptions.includes(orderBy.value)) orderBy.value = 'Desc'

const getLeaders = async () => {
  const query = new URLSearchParams()
  query.append('page', currentPage.value - 1)
  query.append('sortBy', sortBy.value)
  query.append('orderBy', orderBy.value)
  query.append('limit', 50)

  try {
    const response = await interfaces.guilds.getLeaders(guildId, query),
      { data } = response

    pageCount.value = data.page_count
    resultType.value = data.result_type
    resultCount.value = data.result_count

    if (resultType.value === 1) {
      for (const result of data.results) {
        const lvProgress = getLevelProgress(result.data.current_level, result.data.current_exp)
        result.data.nextLevel = lvProgress.nextLevel
        result.data.progress = lvProgress.progress
      }
    } else if (resultType.value === 2) {
      for (const result of data.results) {
        result.data = getCurrencyValues(result.data)
      }
    }

    leadersCache.value[currentPage.value] = data.results

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

  return true
}

const onUpdateSearchParams = async () => {
  pageLoading.value = true
  leadersCache.value = {}
  const getLeadersSuccess = await getLeaders()
  pageLoading.value = !getLeadersSuccess
  setQueryString()
}

const onUpdatePage = async () => {
  const cache = leadersCache.value[currentPage.value]

  if (!cache) {
    pageLoading.value = true
    const getLeadersSuccess = await getLeaders()
    pageLoading.value = !getLeadersSuccess
  }

  setQueryString()
}

const setQueryString = () => {
  router.replace({ query: { page: currentPage.value, sortBy: sortBy.value, orderBy: orderBy.value } })
}

const getPositionColor = index => {
    if (index === 1) return 'gold'
    if (index === 2) return 'silver'
    if (index === 3) return '#CD7F32'
    return 'grey'
  },
  getLevelProgress = (lvl, exp) => {
    const formula = 150 + lvl * lvl * 8
    return {
      nextLevel: numbro(formula).format({ thousandSeparated: true }),
      progress: Math.floor((exp * 100) / formula)
    }
  },
  getCurrencyValues = data => {
    const keys = Object.keys(data)
    const totalAmount = keys.reduce((x, y) => (x += data?.[y]?.amount ?? 0), 0),
      firstAmount = data?.[keys[0]]?.amount ?? 0

    return {
      total: totalAmount,
      percentage: Math.round((firstAmount * 100) / totalAmount),
      text: keys
        .map(v => {
          const curr = data?.[v]
          return `${numbro(curr?.amount ?? 0).format({ average: true })} ${curr?.currency_name ?? 'Unknown'}`
        })
        .join(' / ')
    }
  }

onMounted(async () => {
  const hook = async () => {
    const getLeadersSuccess = await getLeaders()
    setQueryString()

    return (pageLoading.value = !getLeadersSuccess)
  }

  if (props.parentLoading) {
    watch(() => props.parentLoading, hook)
  } else {
    await hook()
  }
})
</script>
