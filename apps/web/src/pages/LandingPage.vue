<template>
  <q-page>
    <section class="q-carousel-section" thanks="SVGBackgrounds.com" @wheel="onWheel">
      <q-carousel
        v-model="currentCarouselSlide"
        ref="carousel"
        control-color="primary"
        transition-prev="slide-right"
        transition-next="slide-left"
        transition-duration="200"
        animated
        navigation
        :swipeable="$q.screen.lt.md"
        @update:model-value="onUpdateCarouselSlide"
      >
        <q-carousel-slide name="introduction" class="row items-center content-center q-col-gutter-md">
          <div class="col-12 col-md-6">
            <div
              :class="`${$q.screen.lt.sm ? 'text-h4' : 'text-h2'} text-weight-bold`"
              v-html="$t('Pages.LandingPage.Title').replace(/\(([^)]+)\)/i, `<em class='gradient'>$1</em>`)"
            ></div>

            <div class="text--secondary q-mt-md">
              {{ $t('Pages.LandingPage.Description') }}
            </div>
          </div>

          <div class="col-12 q-mt-lg">
            <q-btn
              :class="`${$q.screen.lt.sm ? 'full-width' : ''}`"
              :label="$t('Pages.LandingPage.AddToMe')"
              icon="discord"
              @click="addToMe"
              color="primary"
              size="large"
              unelevated
              no-caps
            ></q-btn>

            <q-btn
              :class="`${$q.screen.lt.sm ? 'full-width q-mt-md' : 'q-ml-md'}`"
              :label="$t('Pages.LandingPage.LearnMore')"
              color="dark-1"
              size="large"
              unelevated
              no-caps
              @click="$refs.carousel.next()"
            ></q-btn>
          </div>
        </q-carousel-slide>

        <q-carousel-slide name="custom-behavior" class="row items-center content-center q-col-gutter-md">
          <div :class="`col-12 col-md-6 ${$q.screen.lt.md ? 'text-center' : 'text-left'}`">
            <div :class="`${$q.screen.lt.sm ? 'text-h4' : 'text-h3'} text-weight-bold q-mb-sm`">
              {{ $t('Pages.GuildPage.NavNames.CustomBehavior') }}
            </div>
            <div class="text--secondary">
              {{ $t('Pages.LandingPage.FeatureCustomBehaviorDescription') }}
            </div>
          </div>

          <div :class="`col-12 col-md-6 ${$q.screen.lt.md ? 'text-center' : 'text-right'}`">
            <q-avatar class="q-carousel-slide-icon" square>
              <lord-icon
                class="rotate-5"
                src="https://cdn.lordicon.com/qbaenubu.json"
                trigger="loop"
                delay="2000"
                colors="primary:#b86eab,secondary:#ebe6ef"
                style="width: 100%; height: 100%"
              >
              </lord-icon>
            </q-avatar>
          </div>
        </q-carousel-slide>

        <q-carousel-slide name="moderation" class="row items-center content-center q-col-gutter-md">
          <div :class="`col-12 col-md-6 ${$q.screen.lt.md ? 'text-center' : 'text-left'}`">
            <div :class="`${$q.screen.lt.sm ? 'text-h4' : 'text-h3'} text-weight-bold q-mb-sm`">
              {{ $t('Pages.GuildPage.NavNames.Moderation') }}
            </div>
            <div class="text--secondary">
              {{ $t('Pages.LandingPage.FeatureModerationDescription') }}
            </div>
          </div>

          <div :class="`col-12 col-md-6 ${$q.screen.lt.md ? 'text-center' : 'text-right'}`">
            <q-avatar class="q-carousel-slide-icon" square>
              <lord-icon
                class="rotate-5"
                src="https://cdn.lordicon.com/qgucraxs.json"
                trigger="loop"
                delay="2000"
                colors="primary:#646e78,secondary:#3a3347,tertiary:#b86eab"
                style="width: 100%; height: 100%"
              >
              </lord-icon>
            </q-avatar>
          </div>
        </q-carousel-slide>

        <q-carousel-slide name="activities" class="row items-center content-center q-col-gutter-md">
          <div :class="`col-12 col-md-6 ${$q.screen.lt.md ? 'text-center' : 'text-left'}`">
            <div :class="`${$q.screen.lt.sm ? 'text-h4' : 'text-h3'} text-weight-bold q-mb-sm`">
              {{ $t('Pages.GuildPage.NavNames.Activities') }}
            </div>
            <div class="text--secondary">
              {{ $t('Pages.LandingPage.FeatureActivitiesDescription') }}
            </div>
          </div>

          <div :class="`col-12 col-md-6 ${$q.screen.lt.md ? 'text-center' : 'text-right'}`">
            <q-avatar class="q-carousel-slide-icon" square>
              <lord-icon
                class="rotate-5"
                src="https://cdn.lordicon.com/lbultedj.json"
                trigger="loop"
                delay="2000"
                colors="primary:#3a3347,secondary:#b86eab,tertiary:#4bb3fd,quaternary:#ffc738,quinary:#ebe6ef"
                style="width: 100%; height: 100%"
              >
              </lord-icon>
            </q-avatar>
          </div>
        </q-carousel-slide>

        <q-carousel-slide name="social-alerts" class="row items-center content-center q-col-gutter-md">
          <div :class="`col-12 col-md-6 ${$q.screen.lt.md ? 'text-center' : 'text-left'}`">
            <div :class="`${$q.screen.lt.sm ? 'text-h4' : 'text-h3'} text-weight-bold q-mb-sm`">
              {{ $t('Pages.GuildPage.NavNames.Subscriptions') }}
            </div>
            <div class="text--secondary">
              {{ $t('Pages.LandingPage.FeatureSubscriptionsDescription') }}
            </div>
          </div>

          <div :class="`col-12 col-md-6 ${$q.screen.lt.md ? 'text-center' : 'text-right'}`">
            <q-avatar class="q-carousel-slide-icon" square>
              <lord-icon
                class="rotate-5"
                src="https://cdn.lordicon.com/vhlukkqb.json"
                trigger="loop"
                delay="2000"
                colors="primary:#b86eab,secondary:#ffc738,tertiary:#ebe6ef"
                style="width: 100%; height: 100%"
              >
              </lord-icon>
            </q-avatar>
          </div>
        </q-carousel-slide>

        <q-carousel-slide name="music" class="row items-center content-center q-col-gutter-md">
          <div :class="`col-12 col-md-6 ${$q.screen.lt.md ? 'text-center' : 'text-left'}`">
            <div :class="`${$q.screen.lt.sm ? 'text-h4' : 'text-h3'} text-weight-bold q-mb-sm`">
              {{ $t('Pages.GuildPage.VoiceChannels.Music') }}
            </div>
            <div class="text--secondary">
              {{ $t('Pages.LandingPage.FeatureMusicDescription') }}
            </div>
          </div>

          <div :class="`col-12 col-md-6 ${$q.screen.lt.md ? 'text-center' : 'text-right'}`">
            <q-avatar class="q-carousel-slide-icon" square>
              <lord-icon
                class="rotate-5"
                src="https://cdn.lordicon.com/ryodbtwr.json"
                trigger="loop"
                delay="2000"
                colors="primary:#646e78,secondary:#ffc738,tertiary:#b86eab,quaternary:#ebe6ef"
                style="width: 100%; height: 100%"
              >
              </lord-icon>
            </q-avatar>
          </div>
        </q-carousel-slide>

        <q-carousel-slide name="useful-features" class="row items-center content-center q-col-gutter-md">
          <div :class="`col-12 col-md-6 ${$q.screen.lt.md ? 'text-center' : 'text-left'}`">
            <div :class="`${$q.screen.lt.sm ? 'text-h4' : 'text-h3'} text-weight-bold q-mb-sm`">
              {{ $t('Pages.LandingPage.FeatureUtility') }}
            </div>
            <div class="text--secondary">
              {{ $t('Pages.LandingPage.FeatureUtilityDescription') }}
            </div>
          </div>

          <div :class="`col-12 col-md-6 ${$q.screen.lt.md ? 'text-center' : 'text-right'}`">
            <q-avatar class="q-carousel-slide-icon" square>
              <lord-icon
                class="rotate-5"
                src="https://cdn.lordicon.com/igwjbmqp.json"
                trigger="loop"
                delay="2000"
                colors="primary:#ffc738,secondary:#b86eab,tertiary:#92140c,quaternary:#2ca58d,quinary:#f24c00"
                style="width: 100%; height: 100%"
              >
              </lord-icon>
            </q-avatar>
          </div>
        </q-carousel-slide>

        <q-carousel-slide name="ready-to-start" class="row items-center content-center q-col-gutter-md">
          <div :class="`col-12 col-md-6 ${$q.screen.lt.md ? 'text-center' : 'text-left'}`">
            <div :class="`${$q.screen.lt.sm ? 'text-h4' : 'text-h3'} text-weight-bold q-mb-sm`">
              {{ $t('Pages.LandingPage.ReadyToGetStarted') }}
            </div>
            <div class="text--secondary">
              {{ $t('Pages.LandingPage.ReadyToGetStartedDescription') }}
            </div>

            <q-btn
              :class="`q-mt-lg ${$q.screen.lt.sm ? 'full-width' : ''}`"
              :label="$t('Pages.LandingPage.AddToMe')"
              icon="discord"
              @click="addToMe"
              color="primary"
              size="large"
              unelevated
              no-caps
            ></q-btn>
          </div>

          <div :class="`col-12 col-md-6 ${$q.screen.lt.md ? 'text-center' : 'text-right'}`">
            <q-avatar class="q-carousel-slide-icon" square>
              <lord-icon
                class="rotate-5"
                src="https://cdn.lordicon.com/gomofneh.json"
                trigger="loop"
                delay="2000"
                colors="primary:#3a3347,secondary:#646e78,tertiary:#b86eab,quaternary:#ebe6ef"
                style="width: 100%; height: 100%"
              >
              </lord-icon>
            </q-avatar>
          </div>
        </q-carousel-slide>

        <template #control>
          <q-carousel-control position="top-right" :offset="[18, 18]" class="text-white rounded-borders">
            <q-btn
              v-if="user.access_token"
              class="q-px-md"
              flat
              to="/@me/guilds"
              style="background: rgba(0, 0, 0, 0.3)"
            >
              {{ $t('Pages.DashboardPage.Profile') }}
              <q-avatar class="q-ml-sm" size="32px">
                <img :src="user.avatarURL" />
              </q-avatar>
            </q-btn>
            <q-btn v-else class="q-px-md" flat to="/authorize" style="background: rgba(0, 0, 0, 0.3)">
              {{ $t('Components.Header.Login') }}
              <q-icon class="q-ml-sm" name="r_login"></q-icon>
            </q-btn>
          </q-carousel-control>
        </template>
      </q-carousel>

      <div v-if="wheelCounter.spins > 20" class="text-center q-mt-xl absolute-bottom">
        <div>
          <span v-if="wheelCounter.spins < 100000" class="q-mr-xs">
            {{ $numbro(100000 - wheelCounter.spins).format({ thousandSeparated: true }) }}
          </span>
          <span v-if="wheelCounter.spins < 500">more to go</span>
          <span v-if="wheelCounter.spins > 500 && wheelCounter.spins < 1000">wow cool</span>
          <span v-if="wheelCounter.spins > 1000 && wheelCounter.spins < 2000">you're on fire</span>
          <span v-if="wheelCounter.spins > 2000 && wheelCounter.spins < 5000">will you stop it?</span>
          <span v-if="wheelCounter.spins > 5000 && wheelCounter.spins < 10000">are you crazy?</span>
          <span v-if="wheelCounter.spins > 10000 && wheelCounter.spins < 20000"> hey bro just relax on your bed </span>
          <span v-if="wheelCounter.spins > 20000 && wheelCounter.spins < 50000">you're stubborn</span>
          <span v-if="wheelCounter.spins > 50000 && wheelCounter.spins < 100000">OMG LOOK AT THIS MAN</span>
          <span v-if="wheelCounter.spins > 100000">
            you've wasted {{ $numbro((Date.now() - wheelCounter.firstSpin) / 1000).format({ output: 'time' }) }} of your
            life
          </span>
        </div>
      </div>
    </section>
  </q-page>
</template>

<script>
import { useMeta } from 'quasar'
import { useUserStore } from 'src/stores/user'
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'LandingPage',

  setup() {
    const user = useUserStore()

    useMeta({
      title: 'Lacuna',
      titleTemplate: title => `${title} – Discord Bot`,
      meta: {
        description: {
          name: 'description',
          content:
            "Lacuna is a feature-rich Discord bot designed to enhance your server's community management and moderation experience. With a wide range of commands and customizable settings, Lacuna offers powerful tools to help you maintain a thriving and well-governed server."
        },
        keywords: {
          name: 'keywords',
          content:
            'discord bot, community management, moderation, server management, customizable commands, automated tasks, server analytics, user moderation, automated moderation, custom roles, server settings'
        }
      }
    })

    return {
      user,
      currentCarouselSlide: ref('introduction'),
      availableCarouselSlides: [
        'introduction',
        'custom-behavior',
        'moderation',
        'activities',
        'social-alerts',
        'music',
        'useful-features',
        'ready-to-start'
      ],
      wheelCounter: ref({
        spins: 0,
        firstSpin: null,
        timeout: null
      })
    }
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
    onWheel(event) {
      const wheelUp = event.deltaY > 0

      if (wheelUp) {
        this.$refs.carousel.next()

        clearTimeout(this.wheelCounter.timeout)
        this.wheelCounter.spins++

        if (this.wheelCounter.firstSpin === null) {
          this.wheelCounter.firstSpin = Date.now()
        }

        this.wheelCounter.timeout = setTimeout(() => {
          this.wheelCounter.spins = 0
          this.wheelCounter.firstSpin = null

          clearTimeout(this.wheelCounter.timeout)
        }, 10000)
      } else {
        this.$refs.carousel.previous()
      }
    },
    onUpdateCarouselSlide(value) {
      const carouselSlideIndex = this.availableCarouselSlides.indexOf(value),
        positionHorizontal = carouselSlideIndex * 10,
        backgroundPosition = `${positionHorizontal}% 0%`

      if (positionHorizontal >= 0 && positionHorizontal < this.availableCarouselSlides.length * 10) {
        document.querySelector('.q-carousel-section > .q-carousel').style.backgroundPosition = backgroundPosition
      }
    }
  }
})
</script>

<style lang="scss" scoped>
.q-carousel-section {
  height: 100dvh;
}

.q-carousel-section > .q-carousel {
  height: 100% !important;
  width: 100% !important;
  background-image: url(../assets/endless-constellation.svg);
  transition: 1s ease-out;
}

.q-carousel-section > .q-carousel .q-carousel__slides-container {
  height: 90%;
}

.q-carousel-section > .q-carousel .q-carousel__slide {
  max-width: 1280px;
  width: 100vw;
}

.q-carousel-slide-icon {
  font-size: calc(10vw + 10vh + 2vmin);
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
