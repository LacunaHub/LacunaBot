<template>
  <div id="dashboard-page-guilds-container">
    <div v-if="pageLoading" class="row q-col-gutter-md">
      <div class="col-12 col-sm-6 col-md-4" v-for="i in 6" :key="i">
        <q-card class="bg-dark-1" flat>
          <q-item>
            <q-item-section avatar>
              <q-skeleton class="rounded-circle" type="QAvatar" />
            </q-item-section>

            <q-item-section>
              <q-skeleton type="text" width="100px" />
            </q-item-section>
          </q-item>
        </q-card>
      </div>
    </div>

    <div v-else class="row q-col-gutter-md">
      <div class="col-12 col-sm-6 col-md-4" v-for="guild in user.guilds.filter(i => i.permitted)" :key="guild.id">
        <GuildCardMini
          :name="guild.name"
          :icon="guild.iconURL"
          :joined="guild.joined"
          @click="gotoGuild(guild.id, guild.joined)"
        ></GuildCardMini>
      </div>

      <div v-if="!user.guilds.filter(i => i.permitted).length" class="col-12">
        <q-banner class="bg-dark-1 rounded-borders" dense>
          <span>
            {{ $t('Pages.DashboardPage.NoGuilds') }}
          </span>

          <template #avatar>
            <q-icon name="error" color="warning"></q-icon>
          </template>
        </q-banner>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { interfaces } from 'src/boot/axios'
import GuildCardMini from 'src/components/GuildCardMini.vue'
import { useUserStore } from 'src/stores/user'
import { handleAxiosError, openPopupWindow } from 'src/utils/Utils'
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  parentLoading: {
    type: Boolean,
    default: true
  }
})

const $q = useQuasar(),
  router = useRouter(),
  route = useRoute()

const pageLoading = ref(true)
const user = useUserStore()

const gotoGuild = async (gid, joined) => {
  const fromPromoPage = route.query.fpp === '1'

  let gidPath = 'settings'
  if (fromPromoPage) gidPath += '/diamond'

  if (joined) {
    await router.push(`/guilds/${gid}/${gidPath}`)
  } else {
    const query = new URLSearchParams()
    query.append('scope', 'bot applications.commands')
    query.append('redirect_uri', location.origin)
    query.append('response_type', 'code')
    query.append('guild_id', gid)
    query.append('disable_guild_select', true)

    try {
      const { data: authBot } = await interfaces.auth.getBotAuthURI(query)

      const popup = openPopupWindow({ url: authBot.uri, title: `Add bot to ${gid}`, w: 520, h: 720 })
      const listener = async event => {
        window.onmessage = null
        popup.close()

        if (event.data.guild_id) {
          await router.push(`/guilds/${event.data.guild_id}/${gidPath}`)
        }
      }

      window.onmessage = listener

      const interval = setInterval(() => {
        if (popup.closed) {
          window.onmessage = null
          clearInterval(interval)
        }
      }, 1000)
    } catch (err) {
      const error = handleAxiosError(err)

      $q.notify({
        message: error.message,
        classes: 'q-notification-custom',
        color: 'black',
        icon: 'error',
        iconColor: 'negative',
        timeout: 5000
      })
    }
  }
}

onMounted(async () => {
  const hook = async () => {
    return (pageLoading.value = false)
  }

  if (props.parentLoading) {
    watch(() => props.parentLoading, hook)
  } else {
    await hook()
  }
})
</script>
