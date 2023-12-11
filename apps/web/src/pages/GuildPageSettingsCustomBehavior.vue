<template>
  <div class="row q-col-gutter-md">
    <div class="col-12">
      <q-card class="bg-dark-1" flat>
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('Commands.Categories.Custom') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side top>
            <div>{{ guild.modules.custom_commands.length }}/{{ guild.premium.available ? '100' : '25' }}</div>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div v-for="command in guild.modules.custom_commands" :key="command.id" class="col-12 col-sm-6 col-md-4">
              <q-card class="bg-dark-2" flat>
                <q-item @click="customCommandDialog({ commandProp: command })" clickable>
                  <q-item-section>
                    <q-item-label>
                      {{ command.command.name }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>

            <div v-if="guild.modules.custom_commands.length < 100" class="col-12">
              <q-btn
                @click="
                  !guild.premium.available && guild.modules.custom_commands.length >= 25
                    ? lacunaDiamondDialog()
                    : customCommandDialog()
                "
                class="full-width dashed-border"
                icon="add"
                flat
              ></q-btn>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div class="col-12">
      <q-card class="bg-dark-1" flat>
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('Pages.GuildPage.CustomBehavior.Automation') }}
            </q-item-label>

            <q-item-label class="text--secondary">
              <q-badge class="q-mr-xs" color="warning">
                <span>BETA</span>
              </q-badge>
            </q-item-label>
          </q-item-section>

          <q-item-section side top>
            <div>{{ guild.modules.automation.length }}/{{ guild.premium.available ? '20' : '5' }}</div>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div v-for="(automation, i) in guild.modules.automation" :key="i" class="col-12 col-sm-6 col-md-4">
              <q-card class="bg-dark-2" flat>
                <q-item clickable @click="automationDialog({ automationProp: automation })">
                  <q-item-section>
                    <q-item-label>
                      {{ automation.name }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>

            <div v-if="guild.modules.automation.length < 20" class="col-12">
              <q-btn
                @click="
                  !guild.premium.available && guild.modules.automation.length >= 5
                    ? lacunaDiamondDialog()
                    : automationDialog()
                "
                class="full-width dashed-border"
                icon="add"
                flat
              ></q-btn>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div class="col-12">
      <q-card class="bg-dark-1" flat>
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('Pages.GuildPage.CustomBehavior.Plugins') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-input
                v-model.trim="searchText"
                :disable="pageLoading"
                :placeholder="$t('Components.EmojiPicker.Search')"
                filled
                dense
                hide-bottom-space
              >
                <template #prepend>
                  <q-icon name="search"></q-icon>
                </template>
              </q-input>
            </div>

            <div class="col-12">
              <div v-if="pageLoading" class="row q-col-gutter-md">
                <div class="col-12 col-md-6" v-for="i in 6" :key="i">
                  <q-card class="bg-dark-2" flat>
                    <q-item class="q-py-md">
                      <q-item-section avatar>
                        <q-skeleton class="rounded-circle" type="QAvatar" size="32px" />
                      </q-item-section>

                      <q-item-section>
                        <q-item-label>
                          <q-skeleton type="text" width="50%" />
                        </q-item-label>

                        <q-item-label>
                          <q-skeleton type="text" width="90%" />
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-card>
                </div>
              </div>

              <div v-else class="row q-col-gutter-md">
                <div v-if="!filteredPlugins.length" class="col-12">
                  <q-banner class="bg-dark-2 rounded-borders q-pa-md" dense>
                    <span>
                      {{ $t('Components.EmojiPicker.NotFound') }}
                    </span>

                    <template #avatar>
                      <q-icon name="error" color="warning"></q-icon>
                    </template>
                  </q-banner>
                </div>

                <div class="col-12 col-md-6" v-for="plugin in filteredPlugins" :key="plugin.full_name">
                  <q-card class="bg-dark-2" flat>
                    <q-item class="q-py-md" clickable @click="pluginDialog({ plugin })">
                      <q-item-section avatar style="min-width: 32px">
                        <q-avatar size="32px">
                          <img :src="plugin.owner_avatar_url" />
                        </q-avatar>
                      </q-item-section>

                      <q-item-section>
                        <q-item-label class="ellipsis">
                          {{ plugin.full_name }}
                        </q-item-label>

                        <q-item-label class="text--secondary ellipsis">
                          {{ plugin.description }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-card>
                </div>
              </div>
            </div>

            <div class="col-12">
              <q-banner class="bg-secondary rounded-borders q-pa-md" dense>
                <span>
                  {{ $t('Pages.GuildPage.CustomBehavior.AboutCustomPlugins') }}
                  <a class="origin" href="https://github.com/LacunaHub/LacunaPluginTemplate" target="_blank">
                    {{ $t('Pages.LandingPage.LearnMore') }}
                  </a>
                </span>

                <template #avatar>
                  <q-icon name="info" color="info"></q-icon>
                </template>
              </q-banner>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { interfaces } from 'src/boot/axios'
import AutomationTask from 'src/components/dialogs/AutomationTask.vue'
import CustomCommand from 'src/components/dialogs/CustomCommand.vue'
import LacunaDiamond from 'src/components/dialogs/LacunaDiamond.vue'
import LacunaPlugin from 'src/components/dialogs/LacunaPlugin.vue'
import { usePluginCacheStore } from 'src/stores/PluginCache'
import { useGuildStore } from 'src/stores/guild'
import { resolveAutomationJSON, resolveCustomCommandJSON } from 'src/utils/Utils'
import { computed, onMounted, ref } from 'vue'

const $q = useQuasar()

const pageLoading = ref(true)
const guild = useGuildStore()
const searchText = ref('')
const pluginCache = usePluginCacheStore(),
  filteredPlugins = computed(() => {
    return pageLoading.value
      ? []
      : pluginCache.plugins.filter(v =>
          [v.full_name, v.description].some(vv => vv.toLowerCase().includes(searchText.value.toLowerCase()))
        )
  })

const lacunaDiamondDialog = () => {
  return $q.dialog({
    component: LacunaDiamond
  })
}

const customCommandDialog = componentProps => {
  return $q
    .dialog({
      component: CustomCommand,
      componentProps
    })
    .onOk(payload => {
      const { mode, command } = payload

      if (mode === 'CREATE') {
        guild.modules.custom_commands.push(command)
      }

      if (mode === 'UPDATE') {
        const index = guild.modules.custom_commands.findIndex(i => i.id === command.id)

        guild.modules.custom_commands[index] = command
      }

      if (mode === 'DELETE') {
        const index = guild.modules.custom_commands.findIndex(i => i.id === command.id)

        guild.modules.custom_commands.splice(index, 1)
      }
    })
}

const automationDialog = componentProps => {
  return $q
    .dialog({
      component: AutomationTask,
      componentProps
    })
    .onOk(payload => {
      const { mode, automation } = payload

      if (mode === 'CREATE') {
        guild.modules.automation.push(automation)
      }

      if (mode === 'UPDATE') {
        const index = guild.modules.automation.findIndex(i => i.id === automation.id)

        guild.modules.automation[index] = automation
      }

      if (mode === 'DELETE') {
        const index = guild.modules.automation.findIndex(i => i.id === automation.id)

        guild.modules.automation.splice(index, 1)
      }
    })
}

const resolvePluginPuzzle = puzzle => {
  const isAutomation = puzzle.type === 'AUTOMATION'
  const data = isAutomation ? resolveAutomationJSON(puzzle.data) : resolveCustomCommandJSON(puzzle.data)
  const component = isAutomation ? AutomationTask : CustomCommand,
    componentProps = {
      modeProp: 'CREATE',
      [`${isAutomation ? 'automationProp' : 'commandProp'}`]: data
    }

  return new Promise(resolve => {
    return $q
      .dialog({
        component,
        componentProps
      })
      .onOk(resolve)
      .onDismiss(resolve)
  })
}

const pluginDialog = dialogProps => {
  return $q
    .dialog({
      component: LacunaPlugin,
      componentProps: dialogProps
    })
    .onOk(async data => {
      for (const puzzle of data.value.puzzles) {
        const resolvedPuzzle = await resolvePluginPuzzle(puzzle)

        if (resolvedPuzzle && 'automation' in resolvedPuzzle) {
          guild.modules.automation.push(resolvedPuzzle.automation)
        }

        if (resolvedPuzzle && 'command' in resolvedPuzzle) {
          guild.modules.custom_commands.push(resolvedPuzzle.command)
        }
      }
    })
}

onMounted(async () => {
  if (pluginCache.total === null) {
    const response = await interfaces.common.getPlugins()

    pluginCache.$patch({ total: response.data.total, plugins: response.data.data })
  }

  pageLoading.value = false
})
</script>
