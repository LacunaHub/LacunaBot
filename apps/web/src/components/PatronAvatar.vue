<template>
  <q-avatar :class="`${patron.is_long_term ? 'patron-avatar__big' : ''}`" size="64px">
    <q-img
      :class="`${patron.is_active ? 'patron-avatar__active' : 'patron-avatar'} rounded-circle`"
      :src="getUserAvatarURL(patron.id, patron.avatar)"
      :placeholder-src="getDefaultAvatarURL(patron.id)"
      :error-src="getDefaultAvatarURL(patron.id)"
      height="100%"
      width="100%"
      no-spinner
      no-transition
    />

    <q-tooltip
      class="bg-black text-body2"
      anchor="top middle"
      self="bottom middle"
      transition-show=""
      transition-hide=""
    >
      {{ patron.username }}
    </q-tooltip>

    <q-badge v-if="patron.is_active" class="bg-transparent" floating>
      <q-avatar class="rotate-10" size="26px">
        <img src="~assets/lacuna-diamond.svg" />
      </q-avatar>
    </q-badge>
  </q-avatar>
</template>

<script setup>
import { getDefaultAvatarURL, getUserAvatarURL } from 'src/utils/Utils'

defineProps({
  patron: {
    type: Object,
    required: true
  }
})
</script>
