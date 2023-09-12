<template>
  <div id="dashboard-page-guilds-container">
    <div v-if="pageLoading" class="row q-col-gutter-md">
      <div class="col-12 col-sm-6 col-md-4" v-for="i in 6" :key="i">
        <q-card class="rounded-lg bg-dark-1" flat>
          <q-item class="rounded-lg">
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
        <q-banner class="rounded-lg bg-dark-1" dense>
          <span>
            {{ $t('pages.dashboard.no_guilds') }}
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
import GuildCardMini from 'src/components/GuildCardMini.vue'
import { useUserStore } from 'src/stores/user'
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  parentLoading: {
    type: Boolean,
    default: true
  }
})

const pageLoading = ref(true)
const user = useUserStore(),
  router = useRouter()

const gotoGuild = async (gid, joined) => {
  if (joined) {
    await router.push(`/guilds/${gid}/settings`)
  } else {
    const route = router.resolve({
      path: '/authorize/add',
      query: {
        scope: 'bot applications.commands',
        redirect_uri: window.location.origin,
        response_type: 'code',
        guild_id: gid,
        disable_guild_select: true
      }
    })
    const popup = window.open(route.href, `Add to ${gid}`, 'width=400,height=620,top=5')
    const popupOpenTimestamp = Date.now()

    const listener = async event => {
      if (event.data.guild_id) {
        await router.push(`/guilds/${gid}/settings`)
      }

      window.onmessage = null
      popup.close()
    }

    window.onmessage = listener

    const interval = setInterval(() => {
      if (Date.now() - popupOpenTimestamp > 300000 || popup.closed) {
        window.onmessage = null
        clearInterval(interval)
      }
    }, 1000)
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
