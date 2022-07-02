<template>
  <div class="row q-col-gutter-md">
    <div class="col-12">
      <q-card class="rounded-lg bg-dark-grey-2">
        <q-item class="q-py-md">
          <q-item-section>
            <q-item-label class="text-subtitle1">Пользовательские команды</q-item-label>
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
            <q-item-label class="text-subtitle1">Системные команды</q-item-label>
          </q-item-section>
        </q-item>

        <q-card-section v-if="!guild.guild.app_commands_registered">
          <q-banner class="rounded-lg bg-dark-grey-3" dense>
            <span>
              На сервере нет ни одной зарегистрированной команды. Пожалуйста, убедитесь, что бот имеет возможность на их
              создание
            </span>

            <template #avatar>
              <q-icon name="error" color="warning"></q-icon>
            </template>

            <template #action>
              <q-btn unelevated flat>Попробовать еще раз</q-btn>
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

export default defineComponent({
  name: 'GuildPageSettingsCommands',

  setup() {
    const guild = useGuildStore()

    return { guild }
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
