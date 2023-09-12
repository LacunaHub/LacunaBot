<template>
  <q-card class="bg-dark-1" flat>
    <q-item class="q-py-md">
      <q-item-section>
        <q-item-label class="text-subtitle1">
          {{ $t('pages.landing.ft_activities_title') }}
        </q-item-label>
      </q-item-section>
    </q-item>

    <q-list v-if="pageLoading" padding>
      <q-item v-for="i in 3" :key="i">
        <q-item-section avatar>
          <q-skeleton class="rounded-circle" type="QAvatar" />
        </q-item-section>

        <q-item-section>
          <q-item-label>
            <q-skeleton type="text" width="20%" />
          </q-item-label>

          <q-item-label>
            <q-skeleton type="text" width="10%" />
          </q-item-label>
        </q-item-section>

        <q-item-label side>
          <q-skeleton class="rounded-circle" type="QAvatar" />
        </q-item-label>
      </q-item>
    </q-list>

    <div v-else>
      <q-list v-if="levels.length" padding>
        <q-item v-for="level in levels" :key="level.guild_id">
          <q-item-section avatar>
            <q-avatar size="48px">
              <img :src="level.guild.iconURL" :alt="level.guild.name" />
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label class="ellipsis">
              {{ level.guild.name }}
            </q-item-label>
            <q-item-label class="text--secondary">
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
              track-color="dark-2"
              size="48px"
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

      <q-card-section v-else>
        <q-banner class="rounded-lg bg-dark-2" dense>
          <span>
            {{ $t('pages.dashboard.no_activities') }}
          </span>

          <template #avatar>
            <q-icon name="error" color="warning"></q-icon>
          </template>
        </q-banner>
      </q-card-section>
    </div>
  </q-card>
</template>

<script setup>
import { interfaces } from 'src/boot/axios'
import { useUserStore } from 'src/stores/user'
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps({
  parentLoading: {
    type: Boolean,
    default: true
  }
})

const pageLoading = ref(true)
const user = useUserStore()

const activities = ref({}),
  levels = computed(() => {
    return (
      activities.value.levels
        ?.filter(i => user.guilds.some(ii => i.guild_id === ii.id))
        ?.map(i => {
          const guild = user.guilds.find(ii => i.guild_id === ii.id)
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
  })

const getActivities = async () => {
  try {
    const response = await interfaces.users.getActivities(),
      { data } = response

    return (activities.value = data)
  } catch (err) {}
}

onMounted(async () => {
  const hook = async () => {
    await getActivities()

    return (pageLoading.value = false)
  }

  if (props.parentLoading) {
    watch(() => props.parentLoading, hook)
  } else {
    await hook()
  }
})
</script>
