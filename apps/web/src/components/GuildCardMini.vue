<template>
  <q-card class="g-card bg-dark-1 cursor-pointer" :style="joined ? '' : 'opacity: 0.4'" flat>
    <q-item clickable>
      <q-item-section avatar>
        <q-avatar size="48px">
          <img :src="icon" :alt="name" />
        </q-avatar>
      </q-item-section>

      <q-item-section>
        <q-item-label class="ellipsis">{{ name }}</q-item-label>
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
