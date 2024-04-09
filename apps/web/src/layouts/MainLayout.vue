<template>
  <q-layout view="lhh lpr lff">
    <transition enter-active-class="animated slideInDown" leave-active-class="animated slideOutUp" mode="in-out">
      <MainHeader v-if="$route.path !== '/'" />
    </transition>

    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition enter-active-class="animated fadeIn" leave-active-class="animated fadeOut" mode="out-in">
          <component :is="Component"></component>
        </transition>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import MainHeader from 'src/components/MainHeader.vue'
import { useReleaseNotesCache } from 'src/stores/ReleaseNotesCache'

const releaseNotes = useReleaseNotesCache()

releaseNotes.getReleaseNotes()
</script>
