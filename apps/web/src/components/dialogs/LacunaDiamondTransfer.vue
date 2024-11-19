<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDismiss"
    transition-show="jump-down"
    transition-hide="jump-up"
    backdrop-filter="blur(8px)"
    :maximized="$q.screen.lt.sm"
  >
    <q-card class="q-dialog-card q-dialog-card-sm bg-dark-1" flat>
      <q-card-section class="q-dialog-card-content">
        <q-card-section>
          <q-banner class="bg-dark-2 rounded-borders" dense>
            <span>
              {{ $t('Components.LacunaDiamond.TransferringDescription') }}
            </span>

            <template #avatar>
              <q-icon name="info" color="info"></q-icon>
            </template>
          </q-banner>
        </q-card-section>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-skeleton v-if="pageLoading" type="QInput" height="40px"></q-skeleton>

              <q-select
                v-else
                v-model="fromGuild"
                :options="diamondGuilds"
                option-label="name"
                option-value="id"
                filled
                dense
                hide-bottom-space
                emit-value
                map-options
              >
                <template #option="{ opt, toggleOption, selected }">
                  <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                    <q-item-section avatar>
                      <q-avatar size="32px">
                        <img :src="getGuildIconURL(opt.id, opt.icon)" alt="" />
                      </q-avatar>
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>{{ opt.name }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>

                <template #selected-item="{ opt }">
                  <q-avatar size="24px">
                    <img :src="getGuildIconURL(opt.id, opt.icon)" alt="" />
                  </q-avatar>

                  <span class="q-pl-md">{{ opt.name }}</span>
                </template>
              </q-select>
            </div>

            <div class="col-12 text-center">
              <div>
                <q-avatar size="lg">
                  <img src="~assets/lacuna-diamond.svg" alt="" />
                </q-avatar>
              </div>

              <q-icon name="arrow_downward" size="lg"></q-icon>
            </div>

            <div class="col-12 text-center">
              <q-avatar size="64px">
                <img :src="guild.iconURL" alt="Guild Icon" />
              </q-avatar>
            </div>
          </div>
        </q-card-section>
      </q-card-section>

      <q-card-section class="q-dialog-card-actions row reverse q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-btn
            class="full-width"
            :label="$t('Common.Confirm')"
            unelevated
            @click="onConfirm"
            :loading="confirmLoading"
            :disable="!fromGuild || !guild.guild.owner || guild.premium.available"
            no-caps
            color="primary"
          >
            <template #loading>
              <q-spinner-dots color="white"></q-spinner-dots>
            </template>
          </q-btn>
        </div>

        <div class="col-12 col-md-6">
          <q-btn class="full-width" :label="$t('Common.Close')" unelevated no-caps color="dark-2" @click="onCancel" />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { interfaces } from 'src/boot/axios'
import { useGuildStore } from 'src/stores/guild'
import { onMounted, ref } from 'vue'
import { getGuildIconURL, handleAxiosError } from '../../utils/Utils'

defineEmits(useDialogPluginComponent.emits)

const $q = useQuasar(),
  { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

const pageLoading = ref(true)
const guild = useGuildStore()

const confirmLoading = ref(false)
const fromGuild = ref(null),
  diamondGuilds = ref([])

const getDiamondGuilds = async () => {
  try {
    const response = await interfaces.users.getDiamondGuilds(),
      { data } = response

    diamondGuilds.value = data

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

const onConfirm = async () => {
    if (fromGuild.value) {
      try {
        confirmLoading.value = true

        await interfaces.guilds.transferDiamond(fromGuild.value, guild._id)
        onDialogOK()
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
      } finally {
        confirmLoading.value = false
      }
    }
  },
  onCancel = () => {
    onDialogCancel()
  },
  onDismiss = () => {
    onDialogHide()
  }

onMounted(async () => {
  const getDiamondGuildsSuccess = await getDiamondGuilds()
  fromGuild.value = diamondGuilds.value?.[0]?.id ?? null

  return (pageLoading.value = !getDiamondGuildsSuccess)
})
</script>
