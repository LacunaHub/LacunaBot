<template>
  <div class="fullscreen bg-dark-grey-1 text-white text-center q-pa-md flex flex-center">
    <div>
      <div style="font-size: 30vh">404</div>

      <div class="text-h2" style="opacity: 0.4">
        {{ $t('pages.error.not_found') }}
      </div>

      <q-btn class="q-mt-xl" color="white" text-color="primary" unelevated to="/" icon="home" no-caps />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ErrorNotFound'
})
</script>
