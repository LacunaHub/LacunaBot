<template>
  <div class="row q-col-gutter-md">
    <div class="col-12">
      <q-card class="bg-dark-1" flat>
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('pages.guild.cm_system_commands_title') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div v-for="group in ['GENERAL', 'MODERATION', 'MUSIC', 'UTILITY']" :key="group" class="col-12">
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  {{ $t(`pages.guild.cm_command_categories.${group}`) }}
                </div>

                <div
                  v-for="command in guild.guild.commands.filter(i => i.group === group)"
                  :key="command.name"
                  class="col-12 col-sm-6 col-md-4"
                >
                  <q-card class="bg-dark-2" flat>
                    <q-item @click="systemCommandDialog(command)" clickable>
                      <q-item-section>
                        <q-item-label>
                          {{ command.name }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-card>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<script>
import SystemCommand from 'src/components/dialogs/SystemCommand.vue'
import { useGuildStore } from 'src/stores/guild'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'GuildPageSettingsCommands',

  setup() {
    const guild = useGuildStore()

    return { guild }
  },

  data() {
    return {
      updateCommandsLoading: false
    }
  },

  methods: {
    systemCommandDialog(command) {
      this.$q
        .dialog({
          component: SystemCommand,

          componentProps: {
            commandProp: command
          }
        })
        .onOk(command => {
          const index = this.guild.commands.configuration.findIndex(i => i.name === command.name)

          if (index === -1) {
            this.guild.commands.configuration.push({ name: command.name, ...command.config })
          } else {
            this.guild.commands.configuration[index] = { name: command.name, ...command.config }
          }
        })
    }
  }
})
</script>
