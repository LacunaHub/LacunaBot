<template>
  <q-page class="q-pa-md row justify-center items-start">
    <div v-if="pageLoading" class="absolute-center">
      <q-spinner-tail color="white" size="64px"></q-spinner-tail>
    </div>

    <transition enter-active-class="animated fadeInUp" leave-active-class="animated fadeOutDown" appear>
      <div v-if="!pageLoading" class="row q-col-gutter-md" style="max-width: 960px">
        <div class="col-12 text-body1">
          {{ $t('pages.patrons.gratitude_message_p1') }}
          <br /><br />
          {{ $t('pages.patrons.gratitude_message_p2') }}
          <br /><br />
          {{ $t('pages.patrons.gratitude_message_p3') }}
        </div>

        <div class="col-12 text-center">
          <q-icon class="heart cursor-pointer" name="favorite" color="primary" size="xl" @click="onHeartClick"></q-icon>
        </div>

        <div class="col-12">
          <div class="text-h5 text-center q-pb-md">
            {{ $t('pages.patrons.active_patrons_title') }}
          </div>

          <div class="row q-col-gutter-md justify-center items-start">
            <div v-for="patron in activePatrons" :key="patron._id" class="col-shrink">
              <PatronAvatar :patron="patron" />
            </div>
          </div>
        </div>

        <div class="col-12">
          <div class="text-h5 text-center q-pb-md">
            {{ $t('pages.patrons.former_patrons_title') }}
          </div>

          <div class="row q-col-gutter-md justify-center items-start">
            <div v-for="patron in formerPatrons" :key="patron._id" class="col-shrink">
              <PatronAvatar :patron="patron" />
            </div>
          </div>
        </div>
      </div>
    </transition>
  </q-page>
</template>

<script>
import { useMeta } from 'quasar'
import { defineComponent, ref } from 'vue'
import { interfaces } from 'src/boot/axios'
import { decimalToHex } from 'src/utils/Utils'
import PatronAvatar from 'src/components/PatronAvatar.vue'
import { event } from 'vue-gtag'

export default defineComponent({
  name: 'PatronsPage',

  components: { PatronAvatar },

  setup() {
    useMeta({
      title: 'Patrons'
    })

    const patrons = ref([])

    return { patrons }
  },

  data() {
    return {
      pageLoading: true,
      pageLoadingError: null
    }
  },

  computed: {
    activePatrons() {
      return this.patrons.filter(i => i.is_active)
    },
    formerPatrons() {
      return this.patrons.filter(i => !i.is_active)
    }
  },

  methods: {
    async getPatrons() {
      return interfaces.users
        .getPatrons()
        .then(response => {
          this.patrons = response.data
        })
        .catch(err => (this.pageLoadingError = err.message))
    },
    onHeartClick(e) {
      const color = decimalToHex(Math.floor(Math.random() * (0xffffff + 1)))
      e.srcElement.style.setProperty('color', `#${color}`, 'important')
      event('patrons_heart_click', { event_category: 'clicks' })
    }
  },

  async mounted() {
    await this.getPatrons()

    this.pageLoading = false
  }
})
</script>
