<template>
  <div class="fullscreen bg-dark-2 text-white text-center q-pa-md flex flex-center">
    <div>
      <q-avatar :size="$q.screen.lt.sm ? '64px' : '128px'">
        <img src="~assets/lacuna-logo.svg" alt="Lacuna" />
      </q-avatar>

      <div :class="`text-h6 ${textColor}`">
        {{ $t(messages.title) }}
      </div>

      <div class="text--secondary">
        {{ $t(messages.description) }}
      </div>

      <q-btn class="q-mt-xl text--secondary" unelevated to="/" icon="home" no-caps flat round />
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'AuthorizationResultPage',

  setup() {
    const query = new URLSearchParams(window.location.search),
      status = query.get('status'),
      closeWindow = query.get('closeWindow')

    if (closeWindow === 'true') {
      window.close()
    }

    const textColor = ref('text-positive')
    const messages = ref({
      title: 'pages.authorization.authorization_successful',
      description: 'pages.authorization.close_window_and_go_back'
    })

    if (status === 'failed') {
      textColor.value = 'text-negative'
      messages.value.title = 'pages.authorization.authorization_failed'
      messages.value.description = 'pages.authorization.something_went_wrong'
    }

    return { textColor, messages }
  }
})
</script>
