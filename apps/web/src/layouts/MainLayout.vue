<template>
  <q-layout view="lhh lpr lff">
    <MainHeader />

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition enter-active-class="animated fadeIn" leave-active-class="animated fadeOut" mode="out-in">
          <component :is="Component"></component>
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent } from 'vue'
import MainHeader from 'src/components/MainHeader.vue'
import { useChangeLogStore } from 'src/stores/change-log'

export default defineComponent({
  name: 'MainLayout',

  setup() {
    const changeLog = useChangeLogStore()

    changeLog.getChangeLog()
  },

  components: {
    MainHeader
  }
})
</script>
