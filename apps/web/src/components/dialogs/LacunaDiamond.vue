<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="bg-dark-1" flat style="width: 800px; max-width: 90vw">
      <q-card-section v-if="guild.premium.available">
        <q-banner class="bg-dark-2 rounded-borders" dense>
          <span v-if="guild.premium.will_expire_on">
            {{
              $t('Components.LacunaDiamond.HasSubscription', {
                date: $dt.fromMillis(guild.premium.will_expire_on).toFormat('ff')
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

              <tbody v-for="(plan, i) in planComparison" :key="i" class="bg-dark-1">
                <tr class="q-tr--no-hover">
                  <td style="min-width: 220px; width: 50%">
                    <div class="text-h6">
                      {{ plan.categoryName }}
                    </div>
                  </td>
                  <td class="text-center" style="min-width: 100px; width: 20%"></td>
                  <td class="text-center" style="min-width: 140px; width: 30%"></td>
                </tr>

                <tr v-for="(feature, ii) in plan.features" :key="ii" class="q-tr--no-hover">
                  <td class="text-almost-white-2" style="min-width: 220px; width: 50%">
                    {{ feature.name }}
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

      <q-card-section v-if="provider === 'DISCORD_NITRO_BOOST'">
        <q-card class="bg-dark-2" flat>
          <q-card-section>
            <ol class="q-pl-md q-my-none" type="1">
              <i18n-t keypath="Components.LacunaDiamond.DNBStep1" tag="li">
                <template #server>
                  <a class="origin" href="https://discord.gg/srfhGjbKce" target="_blank">
                    {{ $t('Common.SupportServer').toLowerCase() }}
                  </a>
                </template>
              </i18n-t>
              <i18n-t keypath="Components.LacunaDiamond.DNBStep2" tag="li">
                <template #article>
                  <a
                    class="origin"
                    href="https://support.discord.com/hc/articles/360028038352-Server-Boosting-FAQ-#h_9dfb44db-c394-4339-863b-e6d1e3fb0469"
                    target="_blank"
                  >
                    {{ $t('Components.LacunaDiamond.DNBStep2Article') }}
                  </a>
                </template>
              </i18n-t>
              <i18n-t keypath="Components.LacunaDiamond.DNBStep3" tag="li">
                <template #server>
                  <a class="origin" href="https://discord.gg/srfhGjbKce" target="_blank">
                    {{ $t('Common.SupportServer').toLowerCase() }}
                  </a>
                </template>
              </i18n-t>
              <li>
                {{ $t('Components.LacunaDiamond.DNBStep4') }}
              </li>
            </ol>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-banner class="bg-dark-1 rounded-borders" dense>
              <span>
                {{ $t('Components.LacunaDiamond.DNBBonusesInfo') }}
              </span>

              <template #avatar>
                <q-icon name="info" color="info"></q-icon>
              </template>
            </q-banner>
          </q-card-section>
        </q-card>
      </q-card-section>

      <q-card-section v-else-if="provider === 'PATREON'">
        <q-card class="bg-dark-2" flat>
          <q-card-section>
            <q-btn
              class="full-width"
              style="background-color: #ff424d"
              unelevated
              no-caps
              href="https://www.patreon.com/xelitte/join"
              target="_blank"
            >
              <q-icon class="q-mr-sm" name="fab fa-patreon" size="24px"></q-icon>

              <span>Become a Patron</span>
            </q-btn>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-banner class="bg-dark-1 rounded-borders" dense>
              <span>
                {{ $t('Components.LacunaDiamond.PatreonAfterCheckout') }}

                <b>
                  {{ $t('Components.LacunaDiamond.PatreonAfterCheckoutImportantInfo', { platform: 'Patreon' }) }}
                </b>
              </span>

              <template #avatar>
                <q-icon name="info" color="info"></q-icon>
              </template>
            </q-banner>
          </q-card-section>
        </q-card>
      </q-card-section>

      <q-card-section v-else-if="provider === 'BOOSTY'">
        <q-card class="bg-dark-2" flat>
          <q-card-section>
            <q-btn
              class="full-width"
              style="background-color: #f15f2c"
              unelevated
              no-caps
              href="https://boosty.to/xelitte/purchase/2062351"
              target="_blank"
            >
              <q-avatar class="q-mr-xs" size="24px" square>
                <img src="~assets/boosty-logo-white.svg" />
              </q-avatar>

              <span>Subscribe</span>
            </q-btn>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-banner class="bg-dark-1 rounded-borders" dense>
              <span>
                {{ $t('Components.LacunaDiamond.PatreonAfterCheckout') }}

                <b>
                  {{ $t('Components.LacunaDiamond.PatreonAfterCheckoutImportantInfo', { platform: 'Boosty' }) }}
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
          {{ $t('Components.LacunaDiamond.SelectPlan') }}
        </div>

        <q-tabs
          v-model.number="tier"
          class="bg-dark-2 rounded-borders q-mt-sm"
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
          {{ $t('Components.LacunaDiamond.SelectPaymentMethod') }}
        </div>

        <q-tabs
          v-model="provider"
          class="bg-dark-2 rounded-borders q-mt-sm"
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
            <q-btn class="full-width" :label="$t('Common.Close')" unelevated no-caps color="dark-2" @click="onCancel" />
          </div>

          <div class="col-6">
            <q-btn-dropdown
              class="full-width"
              :label="
                $t(
                  `Components.LacunaDiamond.${
                    ['DISCORD_NITRO_BOOST', 'PATREON', 'BOOSTY'].includes(provider) ? 'Check' : 'Pay'
                  }`
                )
              "
              unelevated
              @click="onConfirm"
              :loading="confirmLoading"
              :disable="guild.premium.available && guild.premium.will_expire_on === 0"
              no-caps
              color="primary"
              split
            >
              <q-list>
                <q-item
                  clickable
                  v-close-popup
                  @click="transferDialog"
                  :disable="!guild.guild.owner || guild.premium.available"
                >
                  <q-item-section>
                    <q-item-label>
                      {{ $t('Common.Transfer') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <template #loading>
                <q-spinner-dots color="white"></q-spinner-dots>
              </template>
            </q-btn-dropdown>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { interfaces } from 'src/boot/axios'
import { useGuildStore } from 'src/stores/guild'
import { defineComponent, ref } from 'vue'
import { event } from 'vue-gtag'

import boostyLogo from 'src/assets/boosty-logo.svg'
import discordNitroBoost from 'src/assets/discord-nitro-boost.svg'
import paypalLogo from 'src/assets/paypal-logo.svg'
import qiwiLogo from 'src/assets/qiwi-logo.svg'
import { handleAxiosError } from 'src/utils/Utils'
import { useI18n } from 'vue-i18n'
import LacunaDiamondTransfer from './LacunaDiamondTransfer.vue'

export default defineComponent({
  name: 'LacunaDiamond',

  emits: [...useDialogPluginComponent.emits],

  setup() {
    const $q = useQuasar(),
      { t: $t } = useI18n()

    const guild = useGuildStore()
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const planComparison = [
      {
        categoryName: $t('Pages.GuildPage.NavNames.CustomBehavior'),
        features: [
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.ExecuteCode'),
            free: { value: false, type: 'boolean' },
            diamond: { value: true, type: 'boolean' }
          },
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.CustomCommandsNumber'),
            free: { value: '25', type: 'text' },
            diamond: { value: '100', type: 'text' }
          },
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.AutomationNumber'),
            free: { value: '5', type: 'text' },
            diamond: { value: '20', type: 'text' }
          },
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.AutomationSequentialExecutionsWithOneTrigger'),
            free: { value: '1', type: 'text' },
            diamond: { value: '5', type: 'text' }
          }
        ]
      },
      {
        categoryName: $t('Pages.LandingPage.FeatureUtility'),
        features: [
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.InteractiveMessagesNumber'),
            free: { value: '5', type: 'text' },
            diamond: { value: '50', type: 'text' }
          },
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.InteractiveReactionsNumber'),
            free: { value: '50', type: 'text' },
            diamond: { value: '200', type: 'text' }
          },
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.TempVoiceChannelsNumber'),
            free: { value: '2', type: 'text' },
            diamond: { value: '20', type: 'text' }
          },
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.VoiceRolesNumber'),
            free: { value: '2', type: 'text' },
            diamond: { value: '20', type: 'text' }
          },
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.AutoThreadsNumber'),
            free: { value: '2', type: 'text' },
            diamond: { value: '20', type: 'text' }
          },
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.AutoReactionsNumber'),
            free: { value: '2', type: 'text' },
            diamond: { value: '20', type: 'text' }
          }
        ]
      },
      {
        categoryName: $t('Pages.GuildPage.NavNames.Moderation'),
        features: [
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.ActionLogWebhookModifying'),
            free: { value: false, type: 'boolean' },
            diamond: { value: true, type: 'boolean' }
          },
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.ActionLogEventsProcessedPerMinuteNumber'),
            free: { value: '15', type: 'text' },
            diamond: { value: 'all_inclusive', type: 'icon' }
          }
        ]
      },
      {
        categoryName: $t('Pages.GuildPage.VoiceChannels.Music'),
        features: [
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.PlaylistsPlayback'),
            free: { value: false, type: 'boolean' },
            diamond: { value: true, type: 'boolean' }
          },
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.AudioStreamingPlayback'),
            free: { value: false, type: 'boolean' },
            diamond: { value: true, type: 'boolean' }
          },
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.PlaybackVolumeChanging'),
            free: { value: false, type: 'boolean' },
            diamond: { value: true, type: 'boolean' }
          },
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.PlaybackQueueTrackNumber'),
            free: { value: '15', type: 'text' },
            diamond: { value: 'all_inclusive', type: 'icon' }
          },
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.PlaybackFilters'),
            free: { value: false, type: 'boolean' },
            diamond: { value: true, type: 'boolean' }
          },
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.PlaybackSeek'),
            free: { value: false, type: 'boolean' },
            diamond: { value: true, type: 'boolean' }
          }
        ]
      },
      {
        categoryName: $t('Pages.GuildPage.NavNames.Activities'),
        features: [
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.EarnCurrenciesInVoiceChannels'),
            free: { value: false, type: 'boolean' },
            diamond: { value: true, type: 'boolean' }
          },
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.VoiceExpMembersNumber'),
            free: { value: '15', type: 'text' },
            diamond: { value: 'all_inclusive', type: 'icon' }
          },
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.LevelAwardsNumber'),
            free: { value: '50', type: 'text' },
            diamond: { value: '200', type: 'text' }
          },
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.StoreItemsNumber'),
            free: { value: '50', type: 'text' },
            diamond: { value: '200', type: 'text' }
          },
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.ActivityMultipliersNumber'),
            free: { value: '1', type: 'text' },
            diamond: { value: '10', type: 'text' }
          }
        ]
      },
      {
        categoryName: $t('Pages.GuildPage.NavNames.Subscriptions'),
        features: [
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.SocialPlatformNumber', {
              socialPlatform: 'Telegram'
            }),
            free: { value: '1', type: 'text' },
            diamond: { value: '10', type: 'text' }
          },
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.SocialPlatformNumber', {
              socialPlatform: 'YouTube'
            }),
            free: { value: '1', type: 'text' },
            diamond: { value: '10', type: 'text' }
          },
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.SocialPlatformNumber', {
              socialPlatform: 'Twitch'
            }),
            free: { value: '1', type: 'text' },
            diamond: { value: '10', type: 'text' }
          }
        ]
      },
      {
        categoryName: $t('Common.Other'),
        features: [
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.PrioritySupport'),
            free: { value: false, type: 'boolean' },
            diamond: { value: true, type: 'boolean' }
          },
          {
            name: $t('Components.LacunaDiamond.PlanComparisonFeatures.ImageEditorElementsNumber'),
            free: { value: '5', type: 'text' },
            diamond: { value: '50', type: 'text' }
          }
        ]
      }
    ]

    let confirmLoading = ref(false),
      tier = ref(0),
      provider = ref('QIWI')

    const transferDialog = () => {
      return $q
        .dialog({
          component: LacunaDiamondTransfer
        })
        .onOk(() => {
          window.location.reload()
        })
    }

    return {
      guild,
      dialogRef,

      planComparison,

      transferDialog,

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

            if (['DISCORD_NITRO_BOOST', 'PATREON', 'BOOSTY'].includes(provider.value)) {
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
            const error = handleAxiosError(err)

            $q.notify({
              message: error.message,
              classes: 'q-notification-custom',
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
          description: this.$t('Components.LacunaDiamond.BonusMusicDescription'),
          icon: 'https://cdn.lordicon.com/pmkcstki.json',
          iconColors: 'primary:#00bcd4'
        },
        {
          name: 'limits',
          description: this.$t('Components.LacunaDiamond.BonusIncreasedLimitsDescription'),
          icon: 'https://cdn.lordicon.com/orshjpvs.json',
          iconColors: 'primary:#3a3347,secondary:#ebe6ef'
        },
        {
          name: 'personalization',
          description: this.$t('Components.LacunaDiamond.BonusPersonalizationDescription'),
          icon: 'https://cdn.lordicon.com/pjlunxyy.json',
          iconColors: 'primary:#3a3347,secondary:#646e78,tertiary:#ab6836,quaternary:#51acf7'
        },
        {
          name: 'subscriptions',
          description: this.$t('Components.LacunaDiamond.BonusCustomBehaviorWithCodeDescription'),
          icon: 'https://cdn.lordicon.com/qatykyxz.json',
          iconColors: 'primary:#121331,secondary:#00bcd4'
        },
        {
          name: 'activities',
          description: this.$t('Components.LacunaDiamond.BonusActivitiesDescription'),
          icon: 'https://cdn.lordicon.com/qmcsqnle.json',
          iconColors: 'primary:#ffc738,secondary:#b26836'
        },
        {
          name: 'respect',
          description: this.$t('Components.LacunaDiamond.BonusRespectDescription'),
          icon: 'https://cdn.lordicon.com/cmfqmqbx.json',
          iconColors: 'primary:#f9c9c0,secondary:#4bb3fd,tertiary:#f28ba8'
        }
      ],
      paymentProviders: [
        { name: 'QIWI', value: 'QIWI', icon: qiwiLogo },
        { name: 'PayPal', value: 'PAYPAL', icon: paypalLogo },
        { name: 'Patreon', value: 'PATREON' },
        { name: 'Boosty', value: 'BOOSTY', icon: boostyLogo },
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
