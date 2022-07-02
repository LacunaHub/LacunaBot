<template>
  <div class="row q-col-gutter-md">
    <div class="col-12 col-sm-6 col-md-4" v-for="guild in user.guilds.filter(i => i.permitted)" :key="guild.id">
      <GuildCardMini
        :name="guild.name"
        :icon="guild.iconURL"
        :joined="guild.joined"
        @click="gotoGuild(guild.id, guild.joined)"
      ></GuildCardMini>
    </div>
  </div>
</template>

<script>
import { useUserStore } from 'src/stores/user'
import { defineComponent } from 'vue'
import GuildCardMini from 'src/components/GuildCardMini.vue'

export default defineComponent({
  name: 'DashboardPageGuilds',

  setup() {
    const user = useUserStore()

    return { user }
  },

  components: { GuildCardMini },

  methods: {
    gotoGuild(gid, joined) {
      if (joined) this.$router.push(`/guilds/${gid}/settings`)
      else {
        const route = this.$router.resolve({
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

        const listener = event => {
          if (event.data.guild_id) this.$router.push(`/guilds/${gid}/settings`)

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
  }
})
</script>
