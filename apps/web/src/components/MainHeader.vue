<template>
  <q-header class="bg-dark-1 fixed fixed-top">
    <q-toolbar class="q-py-xs q-px-md">
      <q-btn
        v-if="$q.screen.lt.md"
        dense
        flat
        :style="{
          'margin-right': user.access_token ? '' : '62px'
        }"
        @click="toggleMobileNav"
      >
        <q-icon name="menu" size="28px"></q-icon>
      </q-btn>

      <q-toolbar-title :class="`${$q.screen.lt.md ? 'row justify-center' : ''}`">
        <router-link to="/@me/guilds" class="toolbar-title-logo">
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
            {{ $t('Components.Header.Guilds') }}
          </span>
        </router-link>
        <router-link to="/state" class="header-link text-uppercase q-mr-lg" active-class="header-link--active">
          <span>
            {{ $t('Components.Header.State') }}
          </span>
        </router-link>
        <a href="https://docs.lacunabot.com" target="_blank" class="header-link text-uppercase q-mr-lg">
          <span>
            {{ $t('Components.Header.Docs') }}
          </span>
        </a>
        <router-link to="/patrons" class="header-link text-uppercase q-mr-lg" active-class="header-link--active">
          <span>
            {{ $t('Components.Header.Patrons') }}
          </span>
        </router-link>
        <a href="https://discord.gg/9NeMc3J" target="_blank" class="header-link text-uppercase">
          <span>
            {{ $t('Components.Header.Community') }}
          </span>
        </a>
      </div>

      <q-separator class="gt-sm" spaced="lg" inset vertical></q-separator>

      <q-btn v-if="!user.access_token" class="q-px-sm" flat to="/authorize">
        {{ $t('Components.Header.Login') }}
        <q-icon class="q-ml-sm" name="login" size="24px"></q-icon>
      </q-btn>

      <q-btn v-else dense flat>
        <q-avatar size="32px">
          <img :src="user.avatarURL" />
        </q-avatar>
        <q-icon class="gt-sm" name="arrow_drop_down" size="16px"></q-icon>

        <q-menu class="bg-dark-2" style="min-width: max-content">
          <q-list>
            <q-item clickable active-class="" to="/@me">
              <q-item-section>
                {{ $t('Pages.DashboardPage.Profile') }}
              </q-item-section>
            </q-item>
            <q-item clickable active-class="" to="/@me/guilds">
              <q-item-section>
                {{ $t('Pages.DashboardPage.MyGuilds') }}
              </q-item-section>
            </q-item>

            <q-separator></q-separator>

            <q-item clickable>
              <q-item-section>
                {{ $t('Pages.GuildPage.GeneralSettings.Locale') }}
              </q-item-section>

              <q-menu class="bg-dark-2" anchor="top left" self="top right">
                <q-list>
                  <q-item
                    v-for="locale in availableLocales"
                    :key="locale.value"
                    clickable
                    @click="setLocale(locale.value)"
                    :active="currentLocale === locale.value"
                    active-class="menu-item--active"
                  >
                    <q-item-section>
                      <q-item-label>
                        {{ locale.label }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-item clickable href="https://crowdin.com/project/lacuna" target="_blank">
                    <q-item-section>
                      <q-item-label>
                        {{ $t('Pages.GuildPage.GeneralSettings.Translate') }}
                      </q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <q-icon name="open_in_new" size="16px"></q-icon>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-item>
            <q-item clickable @click="changeLogDialog">
              <q-item-section>
                {{ $t('Components.Header.ReleaseNotes') }}
              </q-item-section>
            </q-item>
            <q-item clickable @click="user.logout">
              <q-item-section class="text-red">
                {{ $t('Components.Header.Logout') }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </q-toolbar>

    <q-separator v-if="displayMobileNav"></q-separator>

    <transition enter-active-class="animated fadeInDown">
      <q-list v-if="displayMobileNav" class="text-uppercase">
        <q-item clickable to="/guilds" active-class="nav-item--active" @click="toggleMobileNav" style="display: none">
          <q-item-section>
            <q-item-label>
              {{ $t('Components.Header.Guilds') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable to="/state" active-class="nav-item--active" @click="toggleMobileNav">
          <q-item-section>
            <q-item-label>
              {{ $t('Components.Header.State') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable href="https://docs.lacunabot.com" target="_blank" @click="toggleMobileNav">
          <q-item-section>
            <q-item-label>
              {{ $t('Components.Header.Docs') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable to="/patrons" active-class="nav-item--active" @click="toggleMobileNav">
          <q-item-section>
            <q-item-label>
              {{ $t('Components.Header.Patrons') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable href="https://discord.gg/9NeMc3J" target="_blank" @click="toggleMobileNav">
          <q-item-section>
            <q-item-label>
              {{ $t('Components.Header.Community') }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </transition>
  </q-header>
</template>

<script>
import { useUserStore } from 'src/stores/user'
import { availableLocales } from 'src/utils/Constants'
import { getLocale } from 'src/utils/Utils'
import { defineComponent } from 'vue'
import ChangeLog from './dialogs/ChangeLog.vue'

export default defineComponent({
  name: 'MainHeader',

  setup() {
    const user = useUserStore()

    return {
      user,
      availableLocales,
      currentLocale: getLocale()
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
    },
    setLocale(locale) {
      this.$i18n.locale = locale
      this.currentLocale = locale
      localStorage.setItem('locale', locale)
    },
    changeLogDialog() {
      this.$q.dialog({
        component: ChangeLog
      })
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
