<template>
  <div class="row q-col-gutter-md">
    <div class="col-12">
      <q-card class="rounded-lg bg-dark-grey-2">
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('pages.guild.cm_custom_commands_title') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side top>
            <div>{{ guild.modules.custom_commands.length }}/25</div>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div v-for="command in guild.modules.custom_commands" :key="command.id" class="col-12 col-sm-6 col-md-4">
              <q-card class="rounded-lg bg-dark-grey-3" flat>
                <q-item @click="customCommandDialog(command)" class="rounded-lg" clickable v-ripple>
                  <q-item-section>
                    <q-item-label>
                      {{ command.command.name }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-card>
            </div>

            <div class="col-12">
              <q-btn @click="customCommandDialog()" class="full-width dashed-border" icon="add" flat></q-btn>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div class="col-12">
      <q-card class="rounded-lg bg-dark-grey-2">
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('pages.guild.cm_system_commands_title') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-list class="q-px-none" padding dense>
          <q-item tag="label" v-ripple>
            <q-item-section>
              <q-item-label>
                {{ $t('pages.guild.cm_enable_prefix_commands_title') }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-checkbox v-model="guild.commands.prefix_commands" dense></q-checkbox>
            </q-item-section>
          </q-item>
        </q-list>

        <q-card-section>
          <q-banner class="rounded-lg bg-dark-grey-3" dense>
            <span>
              {{
                $t(
                  guild.guild.app_commands_registered
                    ? 'pages.guild.cm_app_commands_refresh'
                    : 'pages.guild.cm_no_registered_app_commands'
                )
              }}
            </span>

            <template #avatar>
              <q-icon
                :name="guild.guild.app_commands_registered ? 'info' : 'error'"
                :color="guild.guild.app_commands_registered ? 'info' : 'warning'"
              ></q-icon>
            </template>

            <template #action>
              <q-btn
                unelevated
                color="dark-grey-4"
                :label="$t(guild.guild.app_commands_registered ? 'refresh' : 'try_again')"
                :loading="updateCommandsLoading"
                @click="updateAppCommands"
              >
                <template #loading>
                  <q-spinner-dots color="white"></q-spinner-dots>
                </template>
              </q-btn>
            </template>
          </q-banner>
        </q-card-section>

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
                  <q-card class="rounded-lg bg-dark-grey-3" flat>
                    <q-item @click="systemCommandDialog(command)" class="rounded-lg" clickable v-ripple>
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
import { defineComponent } from 'vue'
import { useGuildStore } from 'src/stores/guild'
import SystemCommand from 'src/components/dialogs/SystemCommand.vue'
import { interfaces } from 'src/boot/axios'
import CustomCommand from 'src/components/dialogs/CustomCommand.vue'

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
    updateAppCommands() {
      this.updateCommandsLoading = true

      interfaces.guilds
        .updateApplicationCommands(this.guild._id)
        .then(() => {
          this.guild.guild.app_commands_registered = true
        })
        .catch(err => {
          console.error(err)
        })
        .finally(() => (this.updateCommandsLoading = false))
    },
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
    },
    customCommandDialog(config) {
      this.$q
        .dialog({
          component: CustomCommand,

          componentProps: config ? { commandProp: config } : null
        })
        .onOk(payload => {
          const { mode, command } = payload

          if (mode === 'CREATE') {
            this.guild.modules.custom_commands.push(command)
          }

          if (mode === 'UPDATE') {
            const index = this.guild.modules.custom_commands.findIndex(i => i.id === command.id)

            this.guild.modules.custom_commands[index] = command
          }

          if (mode === 'DELETE') {
            const index = this.guild.modules.custom_commands.findIndex(i => i.id === command.id)

            this.guild.modules.custom_commands.splice(index, 1)
          }
        })
    }
  }
})
</script>
