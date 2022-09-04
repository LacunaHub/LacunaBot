<template>
  <q-header class="bg-black">
    <q-toolbar class="q-py-xs q-px-md">
      <q-btn v-if="$q.screen.lt.md" dense flat @click="toggleMobileNav">
        <q-icon name="menu" size="28px"></q-icon>
      </q-btn>

      <q-toolbar-title :class="`${$q.screen.lt.md ? 'row justify-center' : ''}`">
        <router-link to="/" class="toolbar-title-logo">
          <q-avatar size="60px">
            <img src="~/assets/lacuna-logo.svg" />
          </q-avatar>
          <span class="text-uppercase text-body2 text-weight-bold q-ml-sm gt-sm">Lacuna</span>
        </router-link>
      </q-toolbar-title>

      <div class="gt-sm">
        <router-link
          to="/guilds"
          class="header-link text-uppercase q-mr-lg"
          active-class="header-link--active"
          style="display: none"
        >
          <span>
            {{ $t('header.guilds') }}
          </span>
        </router-link>
        <router-link to="/state" class="header-link text-uppercase q-mr-lg" active-class="header-link--active">
          <span>
            {{ $t('header.state') }}
          </span>
        </router-link>
        <a href="https://docs.voidlacuna.ru" target="_blank" class="header-link text-uppercase q-mr-lg">
          <span>
            {{ $t('header.docs') }}
          </span>
        </a>
        <a href="https://discord.gg/9NeMc3J" target="_blank" class="header-link text-uppercase">
          <span>
            {{ $t('header.help') }}
          </span>
        </a>
      </div>

      <q-separator class="gt-sm" spaced="lg" inset vertical></q-separator>

      <q-btn v-if="!user.access_token" dense flat to="/authorize">
        <q-icon name="login" size="32px"></q-icon>
      </q-btn>

      <q-btn v-else dense flat>
        <q-avatar size="32px">
          <img :src="user.avatarURL" />
        </q-avatar>
        <q-icon class="gt-sm" name="arrow_drop_down" size="16px"></q-icon>

        <q-menu class="bg-dark-2" auto-close>
          <q-list dense>
            <q-item clickable active-class="" to="/@me">
              <q-item-section>
                {{ $t('pages.dashboard.profile') }}
              </q-item-section>
            </q-item>
            <q-item clickable active-class="" to="/@me/guilds">
              <q-item-section>
                {{ $t('pages.dashboard.my_guilds') }}
              </q-item-section>
            </q-item>
            <q-separator></q-separator>
            <q-item clickable @click="user.logout">
              <q-item-section class="text-red">
                {{ $t('logout') }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </q-toolbar>

    <q-separator v-if="displayMobileNav"></q-separator>

    <transition enter-active-class="animated fadeInDown">
      <q-list v-if="displayMobileNav" class="text-uppercase">
        <q-item
          clickable
          to="/guilds"
          active-class="nav-item--active"
          v-ripple
          @click="toggleMobileNav"
          style="display: none"
        >
          <q-item-section>
            <q-item-label>
              {{ $t('header.guilds') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable to="/state" active-class="nav-item--active" v-ripple @click="toggleMobileNav">
          <q-item-section>
            <q-item-label>
              {{ $t('header.state') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable href="https://docs.voidlacuna.ru" target="_blank" v-ripple @click="toggleMobileNav">
          <q-item-section>
            <q-item-label>
              {{ $t('header.docs') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable href="https://discord.gg/9NeMc3J" target="_blank" v-ripple @click="toggleMobileNav">
          <q-item-section>
            <q-item-label>
              {{ $t('header.help') }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </transition>
  </q-header>
</template>

<script>
import { useUserStore } from 'src/stores/user'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'MainHeader',

  setup() {
    const user = useUserStore()

    return {
      user
    }
  },

  data() {
    return {
      displayMobileNav: false
    }
  },

  methods: {
    toggleMobileNav() {
      this.displayMobileNav = !this.displayMobileNav
    }
  }
})
</script>

<style lang="scss" scoped>
.toolbar-title-logo {
  opacity: 1;
  transition: 0.3s;
  text-decoration: none;
  color: $almost-white-1;
}

.toolbar-title-logo:hover {
  opacity: 0.8;
}

.header-link {
  color: $almost-white-3;
  text-decoration: none;
  transition: 0.3s;
}

.header-link:hover,
.header-link--active {
  color: $almost-white-1;
}

.nav-item--active {
  color: $almost-white-1;
}
</style>
