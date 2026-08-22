<template>
  <q-header class="bg-dark-1 fixed fixed-top">
    <q-toolbar class="q-py-xs q-px-md">
      <q-btn
        v-if="$q.screen.lt.md"
        icon="r_menu"
        size="small"
        round
        unelevated
        no-caps
        @click="toggleLeftDrawer"
      ></q-btn>

      <q-toolbar-title>
        <router-link to="/@me/guilds" class="toolbar-title-logo">
          <q-avatar size="60px">
            <img src="~/assets/lacuna-logo.svg" />
          </q-avatar>
          <span class="text-uppercase text-body2 text-weight-bold q-ml-sm">Lacuna</span>
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
        <router-link to="/state" class="header-link text-uppercase" active-class="header-link--active">
          <span>
            {{ $t('Components.Header.State') }}
          </span>
        </router-link>
      </div>

      <q-separator class="gt-sm" spaced="lg" inset vertical></q-separator>

      <div class="gt-sm">
        <q-btn
          class="header-link"
          icon="r_menu_book"
          size="small"
          round
          unelevated
          no-caps
          href="https://docs.lacunabot.com"
          target="_blank"
        >
          <q-tooltip class="bg-black text-body2" transition-show="" transition-hide="">
            {{ $t('Components.Header.Docs') }}
          </q-tooltip>
        </q-btn>

        <q-btn
          class="header-link"
          size="small"
          round
          unelevated
          no-caps
          href="https://discord.gg/9NeMc3J"
          target="_blank"
        >
          <q-icon name="fab fa-discord" size="xs"></q-icon>

          <q-tooltip class="bg-black text-body2" transition-show="" transition-hide="">Discord</q-tooltip>
        </q-btn>

        <q-btn
          class="header-link"
          size="small"
          round
          unelevated
          no-caps
          href="https://t.me/roviusistaken"
          target="_blank"
        >
          <q-icon name="fab fa-telegram" size="xs"></q-icon>

          <q-tooltip class="bg-black text-body2" transition-show="" transition-hide="">Telegram</q-tooltip>
        </q-btn>

        <q-btn
          class="header-link"
          icon="r_forum"
          size="small"
          round
          unelevated
          no-caps
          href="https://github.com/orgs/LacunaHub/discussions"
          target="_blank"
        >
          <q-tooltip class="bg-black text-body2" transition-show="" transition-hide="">GitHub Discussions</q-tooltip>
        </q-btn>

        <q-btn
          class="header-link"
          icon="r_translate"
          size="small"
          round
          unelevated
          no-caps
          href="https://crowdin.com/project/lacuna"
          target="_blank"
        >
          <q-tooltip class="bg-black text-body2" transition-show="" transition-hide="">
            {{ $t('Pages.GuildPage.GeneralSettings.Locale') }}
          </q-tooltip>
        </q-btn>
      </div>

      <q-separator class="gt-sm" spaced="lg" inset vertical></q-separator>

      <q-btn v-if="!user.access_token" class="q-px-sm" flat to="/auth">
        {{ $t('Components.Header.Login') }}
        <q-icon class="q-ml-sm" name="r_login"></q-icon>
      </q-btn>

      <q-btn v-else dense round flat @click="toggleRightDrawer">
        <q-avatar size="lg">
          <img class="bordered-avatar" :src="user.avatarURL" />
        </q-avatar>
      </q-btn>
    </q-toolbar>
  </q-header>

  <q-drawer v-model="displayRightDrawer" class="bg-dark-1" side="right" behavior="mobile">
    <q-scroll-area class="fit">
      <q-toolbar class="q-pa-md">
        <q-item-section avatar>
          <q-avatar size="xl">
            <img class="bordered-avatar" :src="user.avatarURL" alt="User Avatar" />
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label>{{ user.name }}</q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-btn icon="close" size="x-small" round unelevated no-caps @click="toggleRightDrawer" />
        </q-item-section>
      </q-toolbar>

      <q-separator inset></q-separator>

      <q-list padding>
        <q-item clickable active-class="nav-item--active" exact to="/@me">
          <q-item-section>
            {{ $t('Pages.DashboardPage.Profile') }}
          </q-item-section>
        </q-item>
        <q-item clickable active-class="nav-item--active" exact to="/@me/guilds">
          <q-item-section>
            {{ $t('Pages.DashboardPage.MyGuilds') }}
          </q-item-section>
        </q-item>

        <q-expansion-item :label="$t('Pages.GuildPage.GeneralSettings.Locale')">
          <q-list class="q-ml-md border-left">
            <q-item
              v-for="locale in languages"
              :key="locale.code"
              clickable
              @click="setLocale(locale.code)"
              :active="currentLocale === locale.code"
              active-class="menu-item--active"
            >
              <q-item-section>
                <q-item-label>
                  {{ locale.name }}
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
        </q-expansion-item>

        <q-separator class="q-my-sm" inset></q-separator>

        <q-item clickable @click="user.logout">
          <q-item-section class="text-red">
            {{ $t('Components.Header.Logout') }}
          </q-item-section>
        </q-item>
      </q-list>
    </q-scroll-area>
  </q-drawer>

  <q-drawer v-model="displayLeftDrawer" class="bg-dark-1" behavior="mobile">
    <q-scroll-area class="fit">
      <q-toolbar class="q-pa-md">
        <q-item-section avatar>
          <q-avatar size="xl">
            <img src="~/assets/lacuna-logo.svg" />
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label class="text-uppercase text-weight-bold">Lacuna</q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-btn icon="close" size="x-small" round unelevated no-caps @click="toggleLeftDrawer" />
        </q-item-section>
      </q-toolbar>

      <q-separator class="q-my-sm" inset></q-separator>

      <q-list>
        <q-item clickable to="/guilds" active-class="nav-item--active" style="display: none">
          <q-item-section>
            <q-item-label>
              {{ $t('Components.Header.Guilds') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable to="/state" active-class="nav-item--active">
          <q-item-section>
            <q-item-label>
              {{ $t('Components.Header.State') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-separator class="q-my-sm" inset></q-separator>

        <q-item>
          <q-item-section>
            <q-item-label>
              <q-btn
                icon="r_menu_book"
                size="small"
                round
                unelevated
                no-caps
                href="https://docs.lacunabot.com"
                target="_blank"
              >
              </q-btn>

              <q-btn size="small" round unelevated no-caps href="https://discord.gg/9NeMc3J" target="_blank">
                <q-icon name="fab fa-discord" size="xs"></q-icon>
              </q-btn>

              <q-btn size="small" round unelevated no-caps href="https://t.me/roviusistaken" target="_blank">
                <q-icon name="fab fa-telegram" size="xs"></q-icon>
              </q-btn>

              <q-btn
                icon="r_forum"
                size="small"
                round
                unelevated
                no-caps
                href="https://github.com/orgs/LacunaHub/discussions"
                target="_blank"
              />

              <q-btn
                icon="r_translate"
                size="small"
                round
                unelevated
                no-caps
                href="https://crowdin.com/project/lacuna"
                target="_blank"
              />
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-scroll-area>
  </q-drawer>
</template>

<script>
import { languages } from '@lacunahub/lacuna-locale'
import { useUserStore } from 'src/stores/user'
import { getLocale } from 'src/utils/Utils'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'MainHeader',

  setup() {
    const user = useUserStore()

    return {
      user,
      languages,
      currentLocale: getLocale()
    }
  },

  data() {
    return {
      displayLeftDrawer: false,
      displayRightDrawer: false
    }
  },

  methods: {
    toggleLeftDrawer() {
      this.displayLeftDrawer = !this.displayLeftDrawer
    },
    toggleRightDrawer() {
      this.displayRightDrawer = !this.displayRightDrawer
    },
    setLocale(locale) {
      this.$i18n.locale = locale
      this.$numbro.setLanguage(locale, 'en')
      this.currentLocale = locale
      localStorage.setItem('locale', locale)
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

.header-link.text-primary {
  opacity: 0.8;
}

.header-link:hover.text-primary,
.header-link--active.text-primary {
  opacity: 1;
}

.nav-item--active {
  color: $almost-white-1;
  background: $secondary;
}
</style>
