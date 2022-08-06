<template>
  <q-card class="bg-dark-grey-2 rounded-lg">
    <q-list class="q-px-none q-py-md" dense>
      <q-item class="q-mb-sm">
        <q-item-section v-if="!dataLoading">
          <q-item-label>
            {{ $t('pages.landing.ft_activities_title') }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-item v-for="level in levels" :key="level.guild_id">
        <q-item-section avatar>
          <q-avatar>
            <img :src="level.guild.iconURL" :alt="level.guild.name" />
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label class="ellipsis">
            {{ level.guild.name }}
          </q-item-label>
          <q-item-label class="opacity-md">
            <span>
              <q-icon name="forum"></q-icon>
              {{ level.activity.total_messages }}
            </span>

            <span class="q-mx-xs">-</span>

            <span>
              <q-icon name="mic"></q-icon>
              {{ $numbro(level.activity.total_voice_time).format({ output: 'time' }) }}
            </span>
          </q-item-label>
        </q-item-section>

        <q-item-section side>
          <q-circular-progress
            class="cursor-pointer ellipsis"
            show-value
            :value="level.progress.value"
            color="primary"
            track-color="dark-grey-3"
            size="42px"
          >
            {{ level.experience.level }}
            <q-tooltip
              class="bg-black rounded-lg"
              anchor="top middle"
              self="bottom middle"
              transition-show=""
              transition-hide=""
            >
              {{ level.experience.current }} / {{ level.progress.next }}
            </q-tooltip>
          </q-circular-progress>
        </q-item-section>
      </q-item>
    </q-list>

    <q-inner-loading class="rounded-lg" :showing="dataLoading">
      <q-spinner-tail color="white" size="32px"></q-spinner-tail>
    </q-inner-loading>
  </q-card>
</template>

<script>
import { interfaces } from 'src/boot/axios'
import { useUserStore } from 'src/stores/user'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'DashboardPageProfile',

  setup() {
    const user = useUserStore()

    return { user }
  },

  data() {
    return {
      dataLoading: true
    }
  },

  computed: {
    levels() {
      return (
        this.user.activities?.levels
          ?.filter(i => this.user.guilds.some(ii => i.guild_id === ii.id))
          ?.map(i => {
            const guild = this.user.guilds.find(ii => i.guild_id === ii.id)
            const formula = 150 + i.experience.level * i.experience.level * 8

            return {
              ...i,
              guild,
              progress: {
                next: formula,
                value: Math.floor((i.experience.current * 100) / formula)
              }
            }
          }) ?? []
      )
    }
  },

  methods: {
    async getActivities() {
      return interfaces.users.getActivities().then(response => {
        const { data } = response

        this.user.$patch({ activities: data })
      })
    }
  },

  async mounted() {
    if (!this.user.activities) await this.getActivities()

    this.dataLoading = false
  }
})
</script>
