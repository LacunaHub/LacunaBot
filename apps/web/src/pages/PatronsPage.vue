<template>
  <q-page class="q-pa-md row justify-center items-start">
    <div class="row q-col-gutter-md" style="max-width: 960px">
      <div class="col-12 text-body1">
        {{ $t('pages.patrons.gratitude_message_p1') }}
        <br /><br />
        {{ $t('pages.patrons.gratitude_message_p2') }}
        <br /><br />
        {{ $t('pages.patrons.gratitude_message_p3') }}
      </div>

      <div class="col-12">
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-btn
              class="full-width"
              style="background-color: #ff424d"
              unelevated
              no-caps
              href="https://www.patreon.com/xelitte"
              target="_blank"
            >
              <q-icon class="q-mr-xs" name="fab fa-patreon" size="24px"></q-icon>

              <span>Patreon</span>
            </q-btn>
          </div>

          <div class="col-6">
            <q-btn
              class="full-width"
              style="background-color: #f15f2c"
              unelevated
              no-caps
              href="https://boosty.to/xelitte"
              target="_blank"
            >
              <q-avatar class="q-mr-xs" size="24px">
                <img src="~assets/boosty-logo-white.svg" />
              </q-avatar>

              <span>Boosty</span>
            </q-btn>
          </div>
        </div>
      </div>

      <div class="col-12 text-center">
        <q-icon class="heart cursor-pointer" name="favorite" color="primary" size="64px" @click="onHeartClick"></q-icon>
      </div>

      <div class="col-12">
        <div class="text-h5 text-center q-pb-md">
          {{ $t('pages.patrons.active_patrons_title') }}
        </div>

        <div v-if="pageLoading" class="row q-col-gutter-md justify-center items-start">
          <div v-for="n in 36" :key="n" class="col-shrink">
            <q-skeleton class="rounded-circle" type="QAvatar" size="64px"></q-skeleton>
          </div>
        </div>

        <div v-else class="row q-col-gutter-md justify-center items-start">
          <div v-for="patron in activePatrons" :key="patron._id" class="col-shrink">
            <PatronAvatar :patron="patron" />
          </div>
        </div>
      </div>

      <div class="col-12">
        <div class="text-h5 text-center q-pb-md">
          {{ $t('pages.patrons.former_patrons_title') }}
        </div>

        <div v-if="pageLoading" class="row q-col-gutter-md justify-center items-start">
          <div v-for="n in 120" :key="n" class="col-shrink">
            <q-skeleton class="rounded-circle" type="QAvatar" size="48px"></q-skeleton>
          </div>
        </div>

        <div v-else class="row q-col-gutter-md justify-center items-start">
          <div v-for="patron in formerPatrons" :key="patron._id" class="col-shrink">
            <PatronAvatar :patron="patron" />
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { useMeta, useQuasar } from 'quasar'
import { interfaces } from 'src/boot/axios'
import PatronAvatar from 'src/components/PatronAvatar.vue'
import { decimalToHex, handleAxiosError } from 'src/utils/Utils'
import { computed, onMounted, ref } from 'vue'
import { event } from 'vue-gtag'

const $q = useQuasar()

const pageLoading = ref(true)
const patrons = ref([])

const activePatrons = computed(() => {
  return patrons.value.filter(i => i.is_active)
})
const formerPatrons = computed(() => {
  return patrons.value.filter(i => !i.is_active)
})

useMeta({
  title: 'Patrons',
  meta: {
    description: {
      name: 'description',
      content:
        "Acknowledge and appreciate the active and former patrons who have supported Lacuna Discord Bot. Join our community of supporters and help us enhance the bot's features and services."
    },
    keywords: {
      name: 'keywords',
      content: 'patrons, supporters, community, active patrons, former patrons'
    }
  }
})

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
  const getPatronsSuccess = await getPatrons()

  return (pageLoading.value = !getPatronsSuccess)
})
</script>
