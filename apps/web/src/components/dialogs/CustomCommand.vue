<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="rounded-lg bg-dark-grey-2" style="width: 1000px; max-width: 90vw">
      <q-item class="q-py-md rounded-t-lg">
        <q-item-section>
          <q-item-label class="text-subtitle1 text-uppercase">
            {{ $t(mode === 'CREATE' ? 'custom_command.add_custom_command' : 'custom_command.edit_custom_command') }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-card-section v-if="confirmError">
        <q-banner class="rounded-lg bg-dark-grey-3" dense>
          <span>
            {{ $t(`errors.custom_commands.${confirmError}`) }}
          </span>

          <template #avatar>
            <q-icon name="error" color="negative"></q-icon>
          </template>
        </q-banner>
      </q-card-section>

      <q-tabs
        v-model="currentTab"
        class="bg-dark-grey-3"
        align="justify"
        active-bg-color="dark-grey-4"
        indicator-color="transparent"
        no-caps
      >
        <q-tab name="general" :label="$t('pages.guild.nav_names.GENERAL')" style="width: 50%"></q-tab>

        <q-tab name="components" :label="$t('common.actions')" style="width: 50%"></q-tab>
      </q-tabs>

      <q-tab-panels v-model="currentTab" class="bg-dark-grey-2" animated>
        <q-tab-panel name="general" class="q-pa-none" style="overflow-y: hidden">
          <q-card-section v-if="mode === 'CREATE'">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <div>
                  {{ $t('custom_command.import_command') }}
                </div>

                <q-file
                  v-model="commandFile"
                  class="q-pt-sm"
                  accept=".json"
                  filled
                  dense
                  hide-bottom-space
                  @update:model-value="onImport"
                ></q-file>
              </div>
            </div>
          </q-card-section>

          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <div>
                  {{ $t('custom_command.command_name_title') }}
                </div>

                <q-input
                  v-model.trim="command.command.name"
                  class="q-pt-sm"
                  :maxlength="32"
                  filled
                  dense
                  hide-bottom-space
                ></q-input>
              </div>

              <div class="col-12">
                <div>
                  {{ $t('custom_command.command_description_title') }}
                </div>

                <q-input
                  v-model.trim="command.command.description"
                  class="q-pt-sm"
                  :maxlength="100"
                  filled
                  dense
                  hide-bottom-space
                ></q-input>
              </div>

              <div class="col-12">
                <div>
                  {{ $t('custom_command.command_options_title') }}
                </div>

                <div class="row q-col-gutter-sm q-pt-sm">
                  <div class="col-auto" v-for="(option, i) in command.command.options" :key="i">
                    <q-chip
                      class="rounded-lg full-width no-shadow"
                      square
                      :label="option.name"
                      :ripple="false"
                      clickable
                      removable
                      @click="optionDialog(option)"
                      @remove="command.command.options.splice(i, 1)"
                    ></q-chip>
                  </div>

                  <div v-if="command.command.options.length < 25" class="col-auto">
                    <q-chip
                      class="rounded-lg dashed-border no-shadow full-width"
                      outline
                      square
                      clickable
                      @click="optionDialog()"
                    >
                      <q-icon name="add" size="24px"></q-icon>
                    </q-chip>
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>

          <q-item class="q-my-sm" tag="label" dense v-ripple>
            <q-item-section>
              <q-item-label>
                {{ $t('command.throttling_title') }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-checkbox
                v-model="command.options"
                val="THROTTLING"
                dense
                @update:model-value="onSelectOption"
              ></q-checkbox>
            </q-item-section>
          </q-item>

          <transition enter-active-class="animated fadeInUp">
            <q-card-section v-if="command.options.includes('THROTTLING')">
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <div>
                    {{ $t('command.throttling_scope_title') }}
                  </div>

                  <q-select
                    v-model="command.throttling.type"
                    :options="['PER_USER', 'PER_CHANNEL', 'PER_GUILD']"
                    class="q-pt-sm"
                    filled
                    dense
                    hide-bottom-space
                  >
                    <template #selected-item="{ opt }">
                      <span>
                        {{ $t(`command.throttling_scopes.${opt}`) }}
                      </span>
                    </template>

                    <template #option="{ opt, toggleOption, selected }">
                      <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                        <q-item-section>
                          <q-item-label>
                            {{ $t(`command.throttling_scopes.${opt}`) }}
                          </q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>

                <div class="col-12">
                  <div>
                    {{ $t('command.throttling_max_uses_title') }}
                  </div>

                  <q-slider
                    v-model.number="command.throttling.max_uses"
                    class="q-pt-sm q-px-sm"
                    :min="1"
                    :max="10"
                    snap
                    marker-labels
                  ></q-slider>
                </div>

                <div class="col-12">
                  <div>
                    {{ $t('command.throttling_timeout_title') }}
                  </div>

                  <q-select
                    v-model.number="command.throttling.timeout"
                    :options="[60, 120, 300, 600, 900, 1800, 3600, 7200, 21600, 43200, 64800, 86400]"
                    class="q-pt-sm"
                    filled
                    dense
                    hide-bottom-space
                  >
                    <template #selected-item="{ opt }">
                      <span>
                        {{
                          $dt
                            .now()
                            .plus({ seconds: opt })
                            .toRelative({ unit: ['hours', 'minutes'], padding: 30000 })
                        }}
                      </span>
                    </template>

                    <template #option="{ opt, toggleOption, selected }">
                      <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                        <q-item-section>
                          <q-item-label>
                            {{
                              $dt
                                .now()
                                .plus({ seconds: opt })
                                .toRelative({ unit: ['hours', 'minutes'], padding: 30000 })
                            }}
                          </q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
              </div>
            </q-card-section>
          </transition>
        </q-tab-panel>

        <q-tab-panel name="components" class="q-pa-none" style="overflow-y: hidden">
          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-btn-dropdown
                  class="full-width"
                  :label="$t('custom_command.add_condition')"
                  color="secondary"
                  no-caps
                  unelevated
                >
                  <q-list>
                    <q-item
                      v-for="condition in conditions"
                      :key="condition"
                      clickable
                      v-close-popup
                      @click="addCondition(condition)"
                      :disable="isComponentLimitReached(`CONDITION:${condition}`)"
                    >
                      <q-item-section>
                        <q-item-label>
                          {{ $t(`custom_command.component_names.${condition}`) }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </div>

              <div class="col-12 col-md-6">
                <q-btn-dropdown
                  class="full-width"
                  :label="$t('custom_command.add_action')"
                  color="accent"
                  no-caps
                  unelevated
                >
                  <q-list>
                    <q-item
                      v-for="(action, i) in actions"
                      :key="i"
                      clickable
                      v-close-popup
                      @click="addAction(action)"
                      :disable="isComponentLimitReached(`ACTION:${action}`)"
                    >
                      <q-item-section>
                        <q-item-label>
                          {{ $t(`custom_command.component_names.${action}`) }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </div>
            </div>
          </q-card-section>

          <q-card-section v-if="command.components.length">
            <div class="row q-col-gutter-md">
              <div v-for="(component, i) in command.components" :key="i" class="col-12">
                <q-card flat bordered class="bg-transparent rounded-lg">
                  <q-item class="rounded-t-lg" clickable v-ripple @click="componentDialog(component, i)">
                    <q-item-section>
                      <q-item-label class="text-subtitle1">
                        {{
                          $t(`custom_command.component_names.${component.condition?.type ?? component.action?.type}`)
                        }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <q-card-actions align="left">
                    <q-btn icon="arrow_upward" flat no-caps unelevated @click="moveComponent(i, 0)"></q-btn>

                    <q-btn icon="arrow_downward" flat no-caps unelevated @click="moveComponent(i, 1)"></q-btn>

                    <q-space></q-space>

                    <q-btn
                      color="negative"
                      flat
                      icon="delete"
                      no-caps
                      unelevated
                      @click="command.components.splice(i, 1)"
                    ></q-btn>
                  </q-card-actions>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-tab-panel>
      </q-tab-panels>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-btn class="full-width" :label="$t('close')" unelevated no-caps color="dark-grey-3" @click="onCancel" />
          </div>

          <div class="col-6">
            <q-btn
              v-if="mode === 'CREATE'"
              class="full-width"
              :label="$t('add')"
              :disable="!isValid"
              :loading="confirmLoading"
              unelevated
              no-caps
              color="primary"
              @click="onConfirm"
            >
              <template #loading>
                <q-spinner-dots color="white"></q-spinner-dots>
              </template>
            </q-btn>

            <q-btn-dropdown
              v-if="mode === 'UPDATE'"
              class="full-width rounded-lg"
              :label="$t('done')"
              :disable="!isValid"
              :loading="confirmLoading"
              split
              unelevated
              no-caps
              color="primary"
              @click="onConfirm"
            >
              <q-list dense>
                <q-item clickable v-close-popup @click="onDelete" :disable="confirmLoading">
                  <q-item-section class="text-negative">
                    <q-item-label>
                      {{ $t('delete') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item clickable v-close-popup @click="onExport" :disable="confirmLoading">
                  <q-item-section>
                    <q-item-label>
                      {{ $t('custom_command.export_command') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>

              <template #loading>
                <q-spinner-dots color="white"></q-spinner-dots>
              </template>
            </q-btn-dropdown>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { computed, defineComponent, ref } from 'vue'
import { useDialogPluginComponent } from 'quasar'
import { useGuildStore } from 'src/stores/guild'
import { interfaces } from 'src/boot/axios'
import { discordAppCommandNameRegexp, customCommandComponentLimits } from 'src/utils/Constants'
import { resolveCustomCommandJSON } from 'src/utils/Utils'
import { event } from 'vue-gtag'
import CustomCommandOption from './CustomCommandOption.vue'
import CustomCommandActionReply from './CustomCommandActionReply.vue'
import CustomCommandActionSendMessage from './CustomCommandActionSendMessage.vue'
import CustomCommandActionModifyRoles from './CustomCommandActionModifyRoles.vue'
import CustomCommandActionForwardToCommand from './CustomCommandActionForwardToCommand.vue'
import CustomCommandConditionCompareValues from './CustomCommandConditionCompareValues.vue'
import CustomCommandActionModifyWallet from './CustomCommandActionModifyWallet.vue'

export default defineComponent({
  name: 'CustomCommand',

  emits: [...useDialogPluginComponent.emits],

  props: {
    commandProp: {
      type: Object,
      required: true
    }
  },

  setup(props) {
    const guild = useGuildStore()
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const mode = ref(props.commandProp ? 'UPDATE' : 'CREATE')
    const command = ref(
      mode.value === 'UPDATE'
        ? JSON.parse(JSON.stringify(props.commandProp))
        : {
            options: [],
            components: [],
            command: {
              type: 1,
              name: '',
              description: null,
              options: []
            }
          }
    )

    let confirmLoading = ref(false),
      confirmError = ref(null),
      currentTab = ref('general'),
      commandFile = ref(null)

    const isValid = computed(() => {
      return Boolean(
        discordAppCommandNameRegexp.test(command.value.command.name) &&
          !guild.guild.commands.some(i => i.name === command.value.command.name) &&
          !guild.modules.custom_commands.some(
            i => i.command.name === command.value.command.name && i.id !== command.value.id
          ) &&
          command.value.command.description &&
          command.value.components.length
      )
    })

    return {
      guild,
      dialogRef,
      mode,
      command,

      confirmLoading,
      confirmError,
      currentTab,
      commandFile,

      isValid,

      onConfirm() {
        if (isValid.value) {
          confirmLoading.value = true

          interfaces.guilds
            .updateCustomCommands(guild._id, { method: mode.value.toLowerCase(), data: command.value })
            .then(response => {
              onDialogOK({ mode: mode.value, command: response.data })
            })
            .catch(err => {
              confirmError.value = err.response.data
              console.log(err)
            })
            .finally(() => (confirmLoading.value = false))
        }
      },

      onCancel() {
        onDialogCancel()
      },

      onDismiss() {
        onDialogHide()
      },

      onDelete() {
        confirmLoading.value = true

        interfaces.guilds
          .updateCustomCommands(guild._id, { method: 'delete', data: command.value })
          .then(() => {
            onDialogOK({ mode: 'DELETE', command: command.value })
          })
          .catch(err => {
            confirmError.value = err.response.data
            console.log(err)
          })
          .finally(() => (confirmLoading.value = false))
      }
    }
  },

  data() {
    return {
      conditions: ['COMPARE_VALUES'],
      actions: ['REPLY', 'SEND_MESSAGE', 'MODIFY_ROLES', 'FORWARD_TO_COMMAND', 'MODIFY_WALLET']
    }
  },

  methods: {
    addCondition(type) {
      if (this.isComponentLimitReached(`CONDITION:${type}`)) return

      if (type === 'COMPARE_VALUES') {
        this.command.components.push({
          type: 'CONDITION',
          condition: {
            type,
            compare_values: {
              options: [],
              operator: 'EQUAL',
              left: '',
              right: ''
            }
          }
        })
      }
    },
    addAction(type) {
      if (this.isComponentLimitReached(`ACTION:${type}`)) return

      if (type === 'REPLY') {
        this.command.components.push({
          type: 'ACTION',
          action: {
            type,
            reply: {
              options: [],
              message: {
                content: '',
                embed: {
                  active: false,
                  title: null,
                  description: null,
                  url: null,
                  timestamp: null,
                  color: null,
                  footer: { text: null, icon_url: null },
                  image: { url: null },
                  thumbnail: { url: null },
                  author: { name: null, url: null, icon_url: null },
                  fields: []
                }
              }
            }
          }
        })
      }

      if (type === 'SEND_MESSAGE') {
        this.command.components.push({
          type: 'ACTION',
          action: {
            type,
            send_message: {
              options: [],
              format: 'CURRENT_CHANNEL',
              channel_id: null,
              message: {
                content: '',
                embed: {
                  active: false,
                  title: null,
                  description: null,
                  url: null,
                  timestamp: null,
                  color: null,
                  footer: { text: null, icon_url: null },
                  image: { url: null },
                  thumbnail: { url: null },
                  author: { name: null, url: null, icon_url: null },
                  fields: []
                }
              }
            }
          }
        })
      }

      if (type === 'MODIFY_ROLES') {
        this.command.components.push({
          type: 'ACTION',
          action: {
            type,
            modify_roles: {
              add: [],
              remove: [],
              user_id: null
            }
          }
        })
      }

      if (type === 'FORWARD_TO_COMMAND') {
        this.command.components.push({
          type: 'ACTION',
          action: {
            type,
            forward_to_command: 'about'
          }
        })
      }

      if (type === 'MODIFY_WALLET') {
        this.command.components.push({
          type: 'ACTION',
          action: {
            type,
            modify_wallet: {
              operator: 'INCREMENT',
              amount: '0',
              user_id: null,
              currency_id: null
            }
          }
        })
      }
    },
    moveComponent(from, to) {
      const component = this.command.components[from]
      let position = to === 0 ? from - 1 : from + 1

      if (position < 0) position = this.command.components.length - 1
      else if (position > this.command.components.length - 1) position = 0

      this.command.components.splice(from, 1)
      this.command.components.splice(position, 0, component)
    },
    isComponentLimitReached(type) {
      const [componentType, subType] = type.split(':')
      const components = this.command.components.filter(
        i => i.type === componentType && (i.condition?.type === subType || i.action?.type === subType)
      )

      return components.length >= customCommandComponentLimits[subType]
    },
    optionDialog(opt) {
      this.$q
        .dialog({
          component: CustomCommandOption,

          componentProps: {
            optionProp: opt
          }
        })
        .onOk(payload => {
          const { mode, option } = payload

          if (mode === 'CREATE' && this.command.command.options.length < 25) {
            this.command.command.options.push(option)
          }

          if (mode === 'UPDATE') {
            const index = this.command.command.options.findIndex(i => i.name === opt.name)

            this.command.command.options[index] = option
          }
        })
    },
    componentDialog(component, index) {
      let dialogComponent

      if (component.action?.type === 'REPLY') dialogComponent = CustomCommandActionReply
      if (component.action?.type === 'SEND_MESSAGE') dialogComponent = CustomCommandActionSendMessage
      if (component.action?.type === 'MODIFY_ROLES') dialogComponent = CustomCommandActionModifyRoles
      if (component.action?.type === 'FORWARD_TO_COMMAND') dialogComponent = CustomCommandActionForwardToCommand
      if (component.action?.type === 'MODIFY_WALLET') dialogComponent = CustomCommandActionModifyWallet

      if (component.condition?.type === 'COMPARE_VALUES') dialogComponent = CustomCommandConditionCompareValues

      this.$q
        .dialog({
          component: dialogComponent,

          componentProps: {
            componentProp: component
          }
        })
        .onOk(payload => {
          const { component } = payload

          this.command.components[index] = component
        })
    },
    onImport(file) {
      if (this.mode !== 'CREATE') return

      const reader = new FileReader()

      reader.onload = e => {
        let json

        try {
          json = JSON.parse(e.target.result)
        } catch (err) {
          json = null
        }

        this.command = resolveCustomCommandJSON(json)
        event('import_custom_command', { event_category: 'utility' })
      }

      reader.readAsText(file)
    },
    onExport() {
      if (this.mode !== 'UPDATE') return

      const data = JSON.stringify(this.command)
      const link = document.createElement('a')

      link.style.display = 'none'
      link.setAttribute('href', `data:application/json;charset=utf-8,${encodeURIComponent(data)}`)
      link.setAttribute('download', `${this.command.id}.json`)

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      event('export_custom_command', { event_category: 'utility' })
    },
    onSelectOption(options) {
      if (options.includes('THROTTLING') && !this.command.throttling) {
        this.command.throttling = {
          type: 'PER_USER',
          max_uses: 1,
          timeout: 60
        }
      }

      if (!options.includes('THROTTLING')) {
        delete this.command.throttling
      }
    }
  }
})
</script>
