<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="rounded-lg bg-dark-1" flat style="width: 800px; max-width: 90vw">
      <q-card-section v-if="guild.premium.available">
        <q-banner class="rounded-lg bg-dark-2" dense>
          <span v-if="guild.premium.will_expire_on">
            {{
              $t('lacuna_diamond.has_subscription', {
                date: $dt.fromMillis(guild.premium.will_expire_on).toFormat('ff')
              })
            }}
          </span>

          <span v-else>
            {{ $t('lacuna_diamond.unlimited_subscription') }}
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
          <div class="col-12 col-md-6" v-for="(bonus, i) in bonuses" :key="i">
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
                  {{ bonus.description }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </div>
        </div>
      </q-card-section>

      <q-card-section v-if="provider === 'DISCORD_NITRO_BOOST'">
        <q-card class="rounded-lg bg-dark-2" flat>
          <q-card-section>
            <ol class="q-pl-md q-my-none" type="1">
              <i18n-t keypath="lacuna_diamond.dnb_step_1" tag="li">
                <template #server>
                  <a class="origin" href="https://discord.gg/srfhGjbKce" target="_blank">
                    {{ $t('support_server').toLowerCase() }}
                  </a>
                </template>
              </i18n-t>
              <i18n-t keypath="lacuna_diamond.dnb_step_2" tag="li">
                <template #article>
                  <a
                    class="origin"
                    href="https://support.discord.com/hc/articles/360028038352-Server-Boosting-FAQ-#h_9dfb44db-c394-4339-863b-e6d1e3fb0469"
                    target="_blank"
                  >
                    {{ $t('lacuna_diamond.dnb_step_2_article') }}
                  </a>
                </template>
              </i18n-t>
              <i18n-t keypath="lacuna_diamond.dnb_step_3" tag="li">
                <template #server>
                  <a class="origin" href="https://discord.gg/srfhGjbKce" target="_blank">
                    {{ $t('support_server').toLowerCase() }}
                  </a>
                </template>
              </i18n-t>
              <li>
                {{ $t('lacuna_diamond.dnb_step_4') }}
              </li>
            </ol>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-banner class="rounded-lg bg-dark-1" dense>
              <span>
                {{ $t('lacuna_diamond.dnb_bonuses_info') }}
              </span>

              <template #avatar>
                <q-icon name="info" color="info"></q-icon>
              </template>
            </q-banner>
          </q-card-section>
        </q-card>
      </q-card-section>

      <q-card-section v-else-if="provider === 'PATREON'">
        <q-card class="rounded-lg bg-dark-2" flat>
          <q-card-section>
            <q-btn
              class="full-width"
              style="background-color: #ff424d"
              unelevated
              no-caps
              href="https://www.patreon.com/xelitte/join"
              target="_blank"
            >
              <q-icon class="q-mr-xs" name="fab fa-patreon" size="24px"></q-icon>

              <span>Become a Patron</span>
            </q-btn>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-banner class="rounded-lg bg-dark-1" dense>
              <span>
                {{ $t('lacuna_diamond.patreon_after_checkout') }}

                <b>
                  {{ $t('lacuna_diamond.patreon_after_checkout_important_info') }}
                </b>
              </span>

              <template #avatar>
                <q-icon name="info" color="info"></q-icon>
              </template>
            </q-banner>
          </q-card-section>
        </q-card>
      </q-card-section>

      <q-card-section v-else>
        <div>
          {{ $t('lacuna_diamond.select_plan') }}
        </div>

        <q-tabs
          v-model.number="tier"
          class="rounded-lg bg-dark-2 q-mt-sm"
          align="justify"
          active-bg-color="secondary"
          indicator-color="transparent"
        >
          <q-tab
            v-for="(period, i) in periods"
            :key="period.name"
            :name="i"
            no-caps
            :style="{ width: $q.screen.lt.sm ? 'fit-content' : `calc(100% / ${periods.length})` }"
          >
            <div>
              <del v-if="period.discounts[currency.name]" class="q-mr-xs opacity-lg">
                {{ period.prices[currency.name] }}{{ currency.symbol }}
              </del>
              <span class="text-h5 text-white">
                {{ period.prices[currency.name] - period.discounts[currency.name] }}{{ currency.symbol }}
              </span>
              <br />
              <span class="text-caption">{{ period.name }}</span>
            </div>
          </q-tab>
        </q-tabs>
      </q-card-section>

      <q-card-section>
        <div>
          {{ $t('lacuna_diamond.select_payment_method') }}
        </div>

        <q-tabs
          v-model="provider"
          class="rounded-lg bg-dark-2 q-mt-sm"
          align="justify"
          active-bg-color="secondary"
          indicator-color="transparent"
        >
          <q-tab
            v-for="provider in paymentProviders"
            :key="provider.value"
            :name="provider.value"
            no-caps
            :style="{ width: $q.screen.lt.sm ? 'fit-content' : `calc(100% / ${paymentProviders.length})` }"
          >
            <q-avatar size="32px" square>
              <q-icon
                v-if="provider.value === 'PATREON'"
                name="fab fa-patreon"
                size="20px"
                style="color: #ff424d"
              ></q-icon>

              <img v-else :src="provider.icon" />
            </q-avatar>

            <div class="text-white">
              {{ provider.name }}
            </div>
          </q-tab>
        </q-tabs>

        <!-- <q-select
          v-model="provider"
          :options="paymentProviders"
          option-label="name"
          class="q-pt-sm"
          filled
          dense
          hide-bottom-space
          emit-value
          map-options
        >
          <template #prepend>
            <q-avatar size="32px" square>
              <img :src="paymentProviders.find(i => i.value === provider).icon" alt="" />
            </q-avatar>
          </template>

          <template #option="{ opt, toggleOption, selected }">
            <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
              <q-item-section avatar>
                <q-avatar size="32px">
                  <img :src="opt.icon" alt="" />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label>{{ opt.name }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select> -->
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-btn class="full-width" :label="$t('close')" unelevated no-caps color="dark-2" @click="onCancel" />
          </div>

          <div class="col-6">
            <q-btn
              class="full-width"
              :label="$t(`lacuna_diamond.${['DISCORD_NITRO_BOOST', 'PATREON'].includes(provider) ? 'check' : 'pay'}`)"
              unelevated
              @click="onConfirm"
              :loading="confirmLoading"
              :disable="guild.premium.available && guild.premium.will_expire_on === 0"
              no-caps
              color="primary"
            >
              <template #loading>
                <q-spinner-dots color="white"></q-spinner-dots>
              </template>
            </q-btn>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { interfaces } from 'src/boot/axios'
import { useGuildStore } from 'src/stores/guild'
import { defineComponent, ref } from 'vue'
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { event } from 'vue-gtag'

import musicNotesImg from 'src/assets/music-notes.svg'
import plusMoreImg from 'src/assets/plus-more.svg'
import cleanerImg from 'src/assets/cleaner.svg'
import bellSingleImg from 'src/assets/bell-single.svg'
import rankingImg from 'src/assets/ranking.svg'
import respectImg from 'src/assets/respect.svg'
import qiwiLogo from 'src/assets/qiwi-logo.svg'
import paypalLogo from 'src/assets/paypal-logo.svg'
import discordNitroBoost from 'src/assets/discord-nitro-boost.svg'

export default defineComponent({
  name: 'LacunaDiamond',

  emits: [...useDialogPluginComponent.emits],

  setup() {
    const $q = useQuasar()

    const guild = useGuildStore()
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    let confirmLoading = ref(false),
      tier = ref(0),
      provider = ref('QIWI')

    return {
      guild,

      dialogRef,

      onConfirm() {
        confirmLoading.value = true

        return interfaces.payments
          .create({
            data: {
              tier: tier.value,
              provider: provider.value,
              guild_id: guild._id,
              guild_name: guild.guild.name
            }
          })
          .then(response => {
            event('checkout_progress', { event_label: provider.value })

            if (['DISCORD_NITRO_BOOST', 'PATREON'].includes(provider.value)) {
              window.location.reload()
            } else {
              const payUrl = response.data

              if (payUrl) {
                window.open(payUrl, '_blank')
              }
            }

            onDialogOK()
          })
          .catch(err => {
            console.error(err)

            $q.notify({
              message: err.response.data,
              classes: 'rounded-lg q-notification-custom',
              color: 'black',
              icon: 'error',
              iconColor: 'negative',
              timeout: 5000
            })
          })
          .finally(() => (confirmLoading.value = false))
      },

      onCancel() {
        onDialogCancel()
      },

      onDismiss() {
        onDialogHide()
      },

      confirmLoading,
      tier,
      provider
    }
  },

  data() {
    return {
      bonuses: [
        {
          name: 'music',
          description: this.$t('lacuna_diamond.bonus_music_description'),
          icon: 'https://cdn.lordicon.com/pmkcstki.json',
          iconColors: 'primary:#00bcd4'
        },
        {
          name: 'limits',
          description: this.$t('lacuna_diamond.bonus_increased_limits_description'),
          icon: 'https://cdn.lordicon.com/orshjpvs.json',
          iconColors: 'primary:#3a3347,secondary:#ebe6ef'
        },
        {
          name: 'personalization',
          description: this.$t('lacuna_diamond.bonus_personalization_description'),
          icon: 'https://cdn.lordicon.com/pjlunxyy.json',
          iconColors: 'primary:#3a3347,secondary:#646e78,tertiary:#ab6836,quaternary:#51acf7'
        },
        {
          name: 'subscriptions',
          description: this.$t('lacuna_diamond.bonus_custom_behavior_with_code_description'),
          icon: 'https://cdn.lordicon.com/qatykyxz.json',
          iconColors: 'primary:#121331,secondary:#00bcd4'
        },
        {
          name: 'activities',
          description: this.$t('lacuna_diamond.bonus_activities_description'),
          icon: 'https://cdn.lordicon.com/qmcsqnle.json',
          iconColors: 'primary:#ffc738,secondary:#b26836'
        },
        {
          name: 'respect',
          description: this.$t('lacuna_diamond.bonus_respect_description'),
          icon: 'https://cdn.lordicon.com/cmfqmqbx.json',
          iconColors: 'primary:#f9c9c0,secondary:#4bb3fd,tertiary:#f28ba8'
        }
      ],
      paymentProviders: [
        { name: 'QIWI', value: 'QIWI', icon: qiwiLogo },
        { name: 'PayPal', value: 'PAYPAL', icon: paypalLogo },
        { name: 'Patreon', value: 'PATREON' },
        { name: 'Discord Nitro Boost', value: 'DISCORD_NITRO_BOOST', icon: discordNitroBoost }
      ]
    }
  },

  computed: {
    periods() {
      return this.guild.prices.map(i => {
        return {
          name: this.$dt
            .fromMillis(Date.now() + i.months * 2592000 * 1000)
            .diff(this.$dt.now(), 'months')
            .toHuman({ maximumFractionDigits: 0 }),
          ...i
        }
      })
    },
    currency() {
      return this.provider === 'QIWI' ? { name: 'RUB', symbol: '₽' } : { name: 'USD', symbol: '$' }
    }
  }
})
</script>
