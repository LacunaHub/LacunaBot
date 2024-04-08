<template>
  <div class="fullscreen bg-dark-2 text-white q-pa-md flex flex-center">
    <q-card class="q-dialog-card bg-dark-1 overflow-hidden" flat style="width: 512px">
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

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-btn
              class="full-width"
              :label="$t('Components.Header.Login')"
              unelevated
              no-caps
              color="primary"
              @click="onConfirm"
            ></q-btn>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { onMounted, ref } from 'vue'
import { event } from 'vue-gtag'

const $q = useQuasar()

const shareEmail = ref(!!($q.localStorage.getItem('auth-share-email') ?? true)),
  joinSupportServer = ref(!!$q.localStorage.getItem('auth-join-support-server'))

const onUpdateShareEmail = value => {
    $q.localStorage.set('auth-share-email', value)
  },
  onUpdateJoinSupportServer = value => {
    $q.localStorage.set('auth-join-support-server', value)
  }

const onConfirm = () => {
  const query = new URLSearchParams()

  query.append('share_email', shareEmail.value)
  query.append('join_support_server', joinSupportServer.value)

  event('login', { method: 'Discord' })
  window.location.href = `${process.env.API}/authorize?${query}`
}

onMounted(() => {})
</script>
