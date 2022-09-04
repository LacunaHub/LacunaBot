<template>
  <q-page>
    <section class="flex flex-center about-section">
      <div class="row items-center">
        <div class="col-12 text-center">
          <q-avatar :size="$q.screen.lt.sm ? '128px' : '256px'">
            <img src="~assets/lacuna-logo.svg" alt="Lacuna" />
          </q-avatar>
        </div>

        <div class="col-12 text-center">
          <div :class="`${$q.screen.lt.sm ? 'text-h5' : 'text-h4'}`">
            {{ $t('pages.landing.title') }}
          </div>
          <div class="text--secondary">
            {{ $t('pages.landing.description') }}
          </div>

          <div class="q-mt-lg"></div>

          <q-btn
            :class="`${$q.screen.lt.sm ? 'partial-full-width' : 'q-mr-lg'}`"
            :label="$t('pages.landing.add_to_me')"
            icon="discord"
            @click="addToMe"
            color="primary"
            size="large"
            unelevated
            no-caps
          ></q-btn>

          <div v-if="$q.screen.lt.sm" class="q-my-md"></div>

          <q-btn
            :class="`${$q.screen.lt.sm ? 'partial-full-width' : ''}`"
            :label="$t('pages.landing.learn_more')"
            color="dark-1"
            size="large"
            unelevated
            no-caps
            @click="scrollToFeatures"
          ></q-btn>
        </div>
      </div>
    </section>

    <section class="flex flex-center details-sector">
      <div
        :class="`row items-start q-col-gutter-md q-pa-lg ${$q.screen.lt.md ? 'text-center' : ''}`"
        style="width: 1280px"
      >
        <div class="col-12 col-sm-6 col-md-4">
          <div class="text-h5">
            {{ $t('pages.landing.bf_stability_title') }}
          </div>
          <p class="text--secondary">
            {{ $t('pages.landing.bf_stability_description') }}
          </p>
        </div>

        <div class="col-12 col-sm-6 col-md-4">
          <div class="text-h5">
            {{ $t('pages.landing.bf_ease_title') }}
          </div>
          <p class="text--secondary">
            {{ $t('pages.landing.bf_ease_description') }}
          </p>
        </div>

        <div class="col-12 col-md-4">
          <div class="text-h5">
            {{ $t('pages.landing.bf_functionality_title') }}
          </div>
          <p class="text--secondary">
            {{ $t('pages.landing.bf_functionality_description') }}
          </p>
        </div>
      </div>
    </section>

    <section class="flex flex-center features-sector">
      <div class="row items-center q-col-gutter-md q-pa-lg" style="width: 1280px">
        <div class="col-12 feature">
          <q-intersection transition="slide-up" transition-duration="900" once>
            <div class="row items-center q-col-gutter-lg">
              <div :class="`col-12 col-md-6 ${$q.screen.lt.md ? 'text-center' : 'text-left'}`">
                <div class="text-h5">
                  {{ $t('pages.landing.ft_activities_title') }}
                </div>
                <div class="text--secondary">
                  {{ $t('pages.landing.ft_activities_description') }}
                </div>
              </div>

              <div :class="`col-12 col-md-6 ${$q.screen.lt.md ? 'text-center' : 'text-right'}`">
                <q-avatar class="rotate-5" :size="$q.screen.lt.md ? '192px' : '384px'" square>
                  <img src="~assets/activities.png" alt="Activities" />
                </q-avatar>
              </div>
            </div>
          </q-intersection>
        </div>

        <div class="col-12 feature">
          <q-intersection transition="slide-up" transition-duration="900" once>
            <div class="row reverse items-center q-col-gutter-lg">
              <div :class="`col-12 col-md-6 ${$q.screen.lt.md ? 'text-center' : 'text-right'}`">
                <div class="text-h5">
                  {{ $t('pages.landing.ft_moderation_title') }}
                </div>
                <div class="text--secondary">
                  {{ $t('pages.landing.ft_moderation_description') }}
                </div>
              </div>

              <div :class="`col-12 col-md-6 ${$q.screen.lt.md ? 'text-center' : 'text-left'}`">
                <q-avatar class="rotate-5-reverse" :size="$q.screen.lt.md ? '192px' : '384px'" square>
                  <img src="~assets/moderation.png" alt="Moderation" />
                </q-avatar>
              </div>
            </div>
          </q-intersection>
        </div>

        <div class="col-12 feature">
          <q-intersection transition="slide-up" transition-duration="900" once>
            <div class="row items-center q-col-gutter-lg">
              <div :class="`col-12 col-md-6 ${$q.screen.lt.md ? 'text-center' : 'text-left'}`">
                <div class="text-h5">
                  {{ $t('pages.landing.ft_subscriptions_title') }}
                </div>
                <div class="text--secondary">
                  {{ $t('pages.landing.ft_subscriptions_description') }}
                </div>
              </div>

              <div :class="`col-12 col-md-6 ${$q.screen.lt.md ? 'text-center' : 'text-right'}`">
                <q-avatar class="rotate-5" :size="$q.screen.lt.md ? '192px' : '384px'" square>
                  <img src="~assets/notifications.png" alt="Subscriptions" />
                </q-avatar>
              </div>
            </div>
          </q-intersection>
        </div>

        <div class="col-12 feature">
          <q-intersection transition="slide-up" transition-duration="900" once>
            <div class="row reverse items-center q-col-gutter-lg">
              <div :class="`col-12 col-md-6 ${$q.screen.lt.md ? 'text-center' : 'text-right'}`">
                <div class="text-h5">
                  {{ $t('pages.landing.ft_music_title') }}
                </div>
                <div class="text--secondary">
                  {{ $t('pages.landing.ft_music_description') }}
                </div>
              </div>

              <div :class="`col-12 col-md-6 ${$q.screen.lt.md ? 'text-center' : 'text-left'}`">
                <q-avatar class="rotate-5-reverse" :size="$q.screen.lt.md ? '192px' : '384px'" square>
                  <img src="~assets/music.png" alt="Music" />
                </q-avatar>
              </div>
            </div>
          </q-intersection>
        </div>

        <div class="col-12 feature">
          <q-intersection transition="slide-up" transition-duration="900" once>
            <div class="row items-center q-col-gutter-lg">
              <div :class="`col-12 col-md-6 ${$q.screen.lt.md ? 'text-center' : 'text-left'}`">
                <div class="text-h5">
                  {{ $t('pages.landing.ft_utility_title') }}
                </div>
                <div class="text--secondary">
                  {{ $t('pages.landing.ft_utility_description') }}
                </div>
              </div>

              <div :class="`col-12 col-md-6 ${$q.screen.lt.md ? 'text-center' : 'text-right'}`">
                <q-avatar class="rotate-5" :size="$q.screen.lt.md ? '192px' : '384px'" square>
                  <img src="~assets/utility.png" alt="Utility" />
                </q-avatar>
              </div>
            </div>
          </q-intersection>
        </div>
      </div>
    </section>

    <section class="flex flex-center ready-sector">
      <q-intersection transition="slide-up" transition-duration="900" once>
        <div class="row items-center q-col-gutter-md q-pa-lg" style="max-width: 1280px; width: 100vw">
          <div :class="`col-12 col-sm-6 ${$q.screen.lt.sm ? 'text-center' : ''}`">
            <div class="text-h5">
              {{ $t('pages.landing.ready_title') }}
            </div>
            <div class="text--secondary">
              {{ $t('pages.landing.ready_description') }}
            </div>
          </div>

          <div :class="`col-12 col-sm-6 ${$q.screen.lt.sm ? 'text-center' : 'text-right'}`">
            <q-btn
              :class="`${$q.screen.lt.sm ? 'partial-full-width' : ''}`"
              :label="$t('pages.landing.add_to_me')"
              icon="discord"
              @click="addToMe"
              color="primary"
              size="large"
              unelevated
              no-caps
            ></q-btn>
          </div>
        </div>
      </q-intersection>
    </section>
  </q-page>
</template>

<script>
import { scroll, useMeta } from 'quasar'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'LandingPage',

  setup() {
    useMeta({
      title: 'Lacuna',
      titleTemplate: title => `${title} – Discord Bot`
    })
  },

  data() {
    return {}
  },

  methods: {
    addToMe() {
      const route = this.$router.resolve({
        path: '/authorize/add',
        query: { scope: 'bot applications.commands', redirect_uri: window.location.origin, response_type: 'code' }
      })
      const popup = window.open(route.href, 'add', 'width=400,height=620,top=5')
      const popupOpenTimestamp = Date.now()

      const listener = event => {
        if (event.data.guild_id) this.$router.push('/@me/guilds')

        window.onmessage = null
        popup.close()
      }

      window.onmessage = listener

      const interval = setInterval(() => {
        if (Date.now() - popupOpenTimestamp > 300000 || popup.closed) {
          window.onmessage = null
          clearInterval(interval)
        }
      }, 1000)
    },
    scrollToFeatures() {
      const element = document.querySelector('.features-sector')
      const target = scroll.getScrollTarget(element)
      const offset = element.offsetTop
      scroll.setVerticalScrollPosition(target, offset, 150)
    }
  }
})
</script>

<style lang="scss" scoped>
.about-section {
  @media (max-width: $breakpoint-sm-max) {
    margin-top: 2vh;
  }
  margin-top: 14vh;
  margin-bottom: 14vh;
}

.details-sector {
  background: $dark-1;
}

.features-sector {
  margin-top: 10vh;
  margin-bottom: 10vh;
}

.feature {
  margin-top: 10vh;
  margin-bottom: 10vh;
}

.ready-sector {
  margin-top: 10vh;
  margin-bottom: 10vh;
}
</style>
