<template>
  <div class="row q-col-gutter-md">
    <div class="col-12">
      <q-card class="rounded-lg bg-dark-grey-2">
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">
              {{ $t('pages.guild.cm_custom_commands') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side top>
            <div>0/25</div>
          </q-item-section>
        </q-item>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6 col-md-4">
              <q-btn class="full-width dashed-border" icon="add" flat></q-btn>
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
              {{ $t('pages.guild.cm_system_commands') }}
            </q-item-label>
          </q-item-section>
        </q-item>

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
            <div v-for="command in guild.guild.commands" :key="command.name" class="col-12 col-sm-6 col-md-4">
              <q-btn
                class="full-width"
                :label="command.name"
                color="dark-grey-3"
                align="left"
                unelevated
                no-caps
                @click="systemCommandDialog(command)"
              ></q-btn>
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
    }
  }
})
</script>
