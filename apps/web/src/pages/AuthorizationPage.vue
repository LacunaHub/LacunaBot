<template>
  <div class="fullscreen bg-dark-2 text-white flex flex-center">
    <q-card :class="`bg-dark-1 ${$q.screen.lt.sm ? 'full-height full-width' : ''}`" flat style="width: 500px">
      <q-toolbar class="q-pa-md text-center">
        <q-toolbar-title>
          <q-avatar size="60px">
            <img src="~/assets/lacuna-logo.svg" />
          </q-avatar>
          <div class="text-uppercase text-body2 text-weight-bold text-white">Lacuna</div>
        </q-toolbar-title>
      </q-toolbar>

      <div class="q-pa-md">
        <q-list class="bg-dark-2 overflow-hidden rounded-borders">
          <q-item v-if="updateRoleConnections" :disable="true" tag="label">
            <q-item-section side>
              <q-checkbox :model-value="updateRoleConnections" dense></q-checkbox>
            </q-item-section>

            <q-item-section>
              <q-item-label>
                {{ $t('Pages.AuthorizationPage.UpdateYourRoleConnections') }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item tag="label">
            <q-item-section side>
              <q-checkbox v-model="shareEmail" dense @update:model-value="onUpdateShareEmail"></q-checkbox>
            </q-item-section>

            <q-item-section>
              <q-item-label>
                {{ $t('Pages.AuthorizationPage.ShareEmailAddress') }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item tag="label">
            <q-item-section side>
              <q-checkbox
                v-model="joinSupportServer"
                dense
                @update:model-value="onUpdateJoinSupportServer"
              ></q-checkbox>
            </q-item-section>

            <q-item-section>
              <q-item-label>
                {{ $t('Pages.AuthorizationPage.JoinSupportServer') }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <q-card-section :class="`row reverse q-col-gutter-md ${$q.screen.lt.sm ? 'pin-bottom' : ''}`">
        <div class="col-12">
          <q-btn
            class="full-width"
            :label="$t('Components.Header.Login')"
            unelevated
            no-caps
            color="primary"
            push
            @click="onConfirm"
            :loading="confirmLoading"
          >
            <template #loading>
              <q-spinner-dots color="white"></q-spinner-dots>
            </template>
          </q-btn>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { interfaces } from 'src/boot/axios'
import { useUserStore } from 'src/stores/user'
import { handleAxiosError, openPopupWindow } from 'src/utils/Utils'
import { ref } from 'vue'
import { event } from 'vue-gtag'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const $q = useQuasar(),
  router = useRouter(),
  route = useRoute(),
  userStore = useUserStore(),
  i18n = useI18n()

const confirmLoading = ref(false)
const shareEmail = ref(!!($q.localStorage.getItem('auth-share-email') ?? true)),
  joinSupportServer = ref(!!$q.localStorage.getItem('auth-join-support-server')),
  updateRoleConnections = location.search.includes('urc=true')

const onUpdateShareEmail = value => {
    $q.localStorage.set('auth-share-email', value)
  },
  onUpdateJoinSupportServer = value => {
    $q.localStorage.set('auth-join-support-server', value)
  }

const onConfirm = async () => {
  const query = new URLSearchParams()

  query.append('share_email', shareEmail.value)
  query.append('join_support_server', joinSupportServer.value)
  query.append('update_role_connections', updateRoleConnections)
  query.append('redirect_uri', location.origin)

  confirmLoading.value = true
  event('login', { method: 'Discord' })

  try {
    const { data: auth } = await interfaces.auth.getAuthURI(query)
    /** @type Window */
    let popup,
      popupAutoClosed = false

    try {
      popup = openPopupWindow({ url: auth.uri, title: 'Authorization', w: 520, h: 720 })
    } catch (err) {
      $q.notify({
        message: i18n.t('Pages.AuthorizationPage.CannotCreatePopupWindow', { domain: location.host }),
        classes: 'q-notification-custom',
        color: 'black',
        icon: 'error',
        iconColor: 'negative',
        timeout: 7500
      })

      confirmLoading.value = false
      return
    }

    const listener = async event => {
      window.onmessage = null
      popup.close()
      popupAutoClosed = true

      try {
        const { data: exCode } = await interfaces.auth.exchangeCode(event.data.code, query.get('redirect_uri'))
        const cookieOptions = { expires: new Date(Date.now() + exCode.expires_in * 1000), httpOnly: false, path: '/' }

        if (event.data.state !== auth.state) throw new Error('Invalid state')

        $q.cookies.set('access_token', exCode.access_token, cookieOptions)
        $q.cookies.set('refresh_token', exCode.refresh_token, { httpOnly: false, path: '/' })
        $q.cookies.set('user_id', exCode.user.id, cookieOptions)
        $q.cookies.set('user_username', exCode.user.username, cookieOptions)
        $q.cookies.set('user_global_name', exCode.user.global_name, cookieOptions)

        if (exCode.user.avatar) $q.cookies.set('user_avatar', exCode.user.avatar, cookieOptions)

        userStore.$patch({
          id: exCode.user.id,
          name: exCode.user.username,
          global_name: exCode.user.global_name,
          avatar: exCode.user.avatar,
          access_token: exCode.access_token
        })

        const returnTo = route.query.returnTo || '/@me/guilds'
        router.push(decodeURIComponent(returnTo))
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

        confirmLoading.value = false
      }
    }

    window.onmessage = listener

    const interval = setInterval(() => {
      if (popup.closed) {
        window.onmessage = null
        clearInterval(interval)

        if (!popupAutoClosed) confirmLoading.value = false
      }
    }, 1000)
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

    confirmLoading.value = false
  }
}
</script>

<style lang="scss" scoped>
.pin-bottom {
  position: absolute;
  bottom: 0;
  right: 0;
  left: 0;
}
</style>
