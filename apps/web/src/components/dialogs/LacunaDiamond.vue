<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="rounded-lg bg-dark-1" flat style="width: 800px; max-width: 90vw">
      <q-card-section v-if="!guild.premium.available">
        <q-banner class="rounded-lg bg-dark-2" dense>
          <span v-if="guild.premium.will_expire_on">
            {{
              $t('lacuna_diamond.has_subscription', {
                date: $dt.fromMillis(guild.premium.will_expire_on).toFormat('DD')
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
            <q-item class="no-padding">
              <q-item-section avatar top>
                <q-avatar size="38px" square>
                  <img :src="bonus.icon" />
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

      <q-card-section>
        <div>
          {{ $t('lacuna_diamond.select_plan') }}
        </div>

        <q-tabs
          v-model.number="tier"
          class="rounded-lg bg-dark-2 q-mt-sm"
          align="justify"
          active-bg-color="primary"
          indicator-color="transparent"
        >
          <q-tab v-for="(period, i) in periods" :key="period.name" :name="i" no-caps>
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

        <q-select
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
            <q-avatar size="32px">
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
        </q-select>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-btn class="full-width" :label="$t('close')" unelevated no-caps color="dark-2" @click="onCancel" />
          </div>

          <div class="col-6">
            <q-btn
              class="full-width"
              :label="$t('lacuna_diamond.pay')"
              unelevated
              @click="onConfirm"
              :loading="confirmLoading"
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
import { useDialogPluginComponent } from 'quasar'
import { event } from 'vue-gtag'

import musicNotesImg from 'src/assets/music-notes.svg'
import plusMoreImg from 'src/assets/plus-more.svg'
import cleanerImg from 'src/assets/cleaner.svg'
import bellSingleImg from 'src/assets/bell-single.svg'
import rankingImg from 'src/assets/ranking.svg'
import respectImg from 'src/assets/respect.svg'
import qiwiLogo from 'src/assets/qiwi-logo.svg'
import paypalLogo from 'src/assets/paypal-logo.svg'

export default defineComponent({
  name: 'LacunaDiamond',

  emits: [...useDialogPluginComponent.emits],

  setup() {
    const guild = useGuildStore()

    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    let confirmLoading = ref(false),
      confirmError = ref(false),
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
            const payUrl = response.data

            if (payUrl) {
              event('checkout_progress', { event_label: provider.value })
              window.open(payUrl, '_blank')
            }

            onDialogOK()
          })
          .catch(err => {
            console.error(err)
            confirmError.value = true
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
      confirmError,
      tier,
      provider
    }
  },

  data() {
    return {
      bonuses: [
        { description: this.$t('lacuna_diamond.bonus_music_description'), icon: musicNotesImg },
        {
          description: this.$t('lacuna_diamond.bonus_increased_limits_description'),
          icon: plusMoreImg
        },
        { description: this.$t('lacuna_diamond.bonus_personalization_description'), icon: cleanerImg },
        {
          description: this.$t('lacuna_diamond.bonus_more_subscriptions_description'),
          icon: bellSingleImg
        },
        { description: this.$t('lacuna_diamond.bonus_activities_description'), icon: rankingImg },
        { description: this.$t('lacuna_diamond.bonus_respect_description'), icon: respectImg }
      ],
      paymentProviders: [
        { name: 'QIWI', value: 'QIWI', icon: qiwiLogo },
        { name: 'PayPal', value: 'PAYPAL', icon: paypalLogo }
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
