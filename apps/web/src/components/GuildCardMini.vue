<template>
  <q-card class="g-card rounded-lg bg-dark-grey-2 cursor-pointer" :style="joined ? '' : 'opacity: 0.5'">
    <q-item>
      <q-item-section avatar>
        <q-avatar>
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

<style lang="scss" scoped>
.g-card {
  transition: 0.3 ease-in;
}

.g-card:hover {
  box-shadow: 0 3px 5px -1px rgb(0 0 0 / 20%), 0 6px 10px rgb(0 0 0 / 14%), 0 1px 18px rgb(0 0 0 / 12%);
}
</style>
