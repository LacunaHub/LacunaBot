<template>
  <q-avatar :size="patron.is_active ? '64px' : '48px'">
    <img
      :class="`${patron.is_big_patron ? 'big-patron-avatar' : 'patron-avatar'}`"
      :src="getUserAvatarURL(patron)"
      onerror="this.onerror=null;this.src=`https://cdn.discordapp.com/embed/avatars/${'0001' % 5}.png`"
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

    <q-badge v-if="patron.is_big_patron" class="bg-transparent" floating>
      <q-avatar class="rotate-10" size="26px">
        <img src="~assets/lacuna-diamond.svg" />
      </q-avatar>
    </q-badge>
  </q-avatar>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'PatronAvatar',

  props: {
    patron: {
      type: Object,
      required: true
    }
  },

  setup() {
    const getUserAvatarURL = user => {
      if (user.avatar && user._id) {
        const extension = user.avatar.startsWith('a_') ? 'gif' : 'png'
        return `https://cdn.discordapp.com/avatars/${user._id}/${user.avatar}.${extension}`
      }

      return `https://cdn.discordapp.com/embed/avatars/${'0001' % 5}.png`
    }

    return { getUserAvatarURL }
  }
})
</script>
