<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="q-dialog-card bg-dark-1" flat style="width: 512px">
      <q-item class="q-py-md rounded-t-lg">
        <q-item-section>
          <q-item-label class="text-subtitle1">
            {{ $t('Components.LacunaDiamond.SelectPaymentMethod') }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12" v-for="(platform, i) of platforms" :key="i">
            <q-card
              :class="`bg-dark-2 ${platform.value === selectedPlatform ? 'bordered-block bordered-primary' : ''}`"
              flat
            >
              <q-item class="rounded-lg" tag="label">
                <q-item-section avatar>
                  <q-avatar size="lg">
                    <q-icon
                      v-if="platform.value === 'Patreon'"
                      name="fab fa-patreon"
                      size="md"
                      style="color: #ff424d"
                    ></q-icon>

                    <img v-else :src="platform.icon" />
                  </q-avatar>
                </q-item-section>

                <q-item-section>
                  <q-item-label>
                    {{ platform.name }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <q-radio v-model="selectedPlatform" :val="platform.value" dense />
                </q-item-section>
              </q-item>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <q-card-section>
        <q-btn
          v-if="selectedPlatform === 'Patreon'"
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

        <q-btn
          v-if="selectedPlatform === 'Boosty'"
          class="full-width"
          style="background-color: #f15f2c"
          unelevated
          no-caps
          href="https://boosty.to/xelitte/purchase/2710502"
          target="_blank"
        >
          <q-avatar class="q-mr-xs" size="24px" square>
            <img src="~assets/boosty-logo-white.svg" />
          </q-avatar>

          <span>Subscribe</span>
        </q-btn>

        <q-btn
          v-if="selectedPlatform === 'DiscordNitroBoost' || selectedPlatform === 'ProjectTeam'"
          class="full-width"
          style="background-color: #5662f6"
          unelevated
          no-caps
          href="https://discord.gg/srfhGjbKce"
          target="_blank"
        >
          <q-icon class="q-mr-sm" name="fab fa-discord" size="24px"></q-icon>

          <span>Lacuna Hub</span>
        </q-btn>
      </q-card-section>

      <q-list class="bg-dark-2 overflow-hidden rounded-borders q-ma-md">
        <q-expansion-item
          v-if="selectedPlatform === 'Patreon' || selectedPlatform === 'Boosty'"
          :label="$t('Components.LacunaDiamond.FAQ.Q1')"
          group="default"
          expand-separator
        >
          <q-card class="bg-dark-1 no-border-radius" bordered>
            <q-card-section v-html="parseMarkdown($t('Components.LacunaDiamond.FAQ.A1'))"></q-card-section>
          </q-card>
        </q-expansion-item>

        <q-expansion-item :label="$t('Components.LacunaDiamond.FAQ.Q2')" group="default" expand-separator>
          <q-card class="bg-dark-1 no-border-radius" bordered>
            <q-card-section v-html="parseMarkdown($t('Components.LacunaDiamond.FAQ.A2'))"></q-card-section>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          v-if="selectedPlatform === 'DiscordNitroBoost'"
          :label="$t('Components.LacunaDiamond.FAQ.Q3')"
          group="default"
          expand-separator
        >
          <q-card class="bg-dark-1 no-border-radius" bordered>
            <q-card-section v-html="parseMarkdown($t('Components.LacunaDiamond.FAQ.A3'))"></q-card-section>
          </q-card>
        </q-expansion-item>
      </q-list>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-btn
              class="full-width"
              :label="$t('Components.LacunaDiamond.CheckForSubscription')"
              unelevated
              @click="onConfirm"
              no-caps
              color="primary"
            >
              <template #loading>
                <q-spinner-dots color="white"></q-spinner-dots>
              </template>
            </q-btn>
          </div>

          <div class="col-12">
            <q-btn class="full-width" :label="$t('Common.Close')" unelevated no-caps color="dark-2" @click="onCancel" />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useDialogPluginComponent } from 'quasar'
import { parseMarkdown } from 'src/utils/Markdown'
import { ref } from 'vue'

const a1 =
  'Чтобы активировать Diamond, проверьте следующие моменты\n\n1. Привязан ли ваш аккаунт Discord к Patreon\n2. Присоединились ли вы к серверу поддержки и получили ли роль подписчика\n3. Нажали ли вы на кнопку проверки подписки\n\nЕсли после этих шагов проблема остаётся, свяжитесь с нами для дальнейшей помощи.'
const a2 =
  'Если у вас блокировка на сервере поддержки, активация Diamond будет невозможна, так как она требует наличия доступа к серверу. Рекомендуем связаться с администрацией сервера, чтобы разобраться с причиной блокировки и попытаться её снять.'

defineEmits(useDialogPluginComponent.emits)
const props = defineProps({
  currentPlatform: {
    type: String,
    required: true
  },
  platforms: {
    type: Array,
    required: true
  }
})

const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()
const selectedPlatform = ref(props.currentPlatform)

const onConfirm = async () => {
    onDialogOK({ platform: selectedPlatform.value })
  },
  onCancel = () => {
    onDialogCancel()
  },
  onDismiss = () => {
    onDialogHide()
  }
</script>
