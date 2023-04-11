<template>
  <div class="fullscreen bg-dark-2 text-white text-center q-pa-md flex flex-center">
    <div>
      <div class="text-h1">404</div>

      <div class="text-h6">
        {{ $t('pages.error.not_found') }}
      </div>

      <q-btn class="q-mt-xl text--secondary" unelevated to="/" icon="home" no-caps flat round />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ErrorNotFound'
})
</script>
