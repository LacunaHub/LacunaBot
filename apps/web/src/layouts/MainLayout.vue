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

export default defineComponent({
  name: 'MainLayout',

  setup() {},

  components: {
    MainHeader
  }
})
</script>

<style lang="scss" scoped>
.toolbar-title-logo {
  opacity: 1;
  transition: 0.3s;
  text-decoration: none;
  color: white;
}
.toolbar-title-logo:hover {
  opacity: 0.8;
}

.header-link {
  color: white;
  text-decoration: none;
  opacity: 0.6;
  transition: 0.3s;
  font-size: 15px;
}
.header-link:hover {
  opacity: 1;
}
</style>
