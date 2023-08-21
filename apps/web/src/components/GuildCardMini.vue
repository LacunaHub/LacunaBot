<template>
  <q-card class="g-card rounded-lg bg-dark-1 cursor-pointer" :style="joined ? '' : 'opacity: 0.4'" flat>
    <q-item class="rounded-lg" clickable v-ripple>
      <q-item-section avatar>
        <q-avatar size="48px">
          <img :src="icon" :alt="name" />
        </q-avatar>
      </q-item-section>

      <q-item-section class="ellipsis">
        <div>{{ name }}</div>
      </q-item-section>
    </q-item>
  </q-card>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'GuildCardMini',

  props: {
    name: {
      type: String,
      required: true
    },

    icon: {
      type: String,
      required: true
    },

    joined: {
      type: Boolean,
      default: false
    }
  }
})
</script>
