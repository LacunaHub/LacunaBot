<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDismiss"
    transition-show="jump-down"
    transition-hide="jump-up"
    backdrop-filter="blur(8px)"
    :maximized="$q.screen.lt.sm"
    persistent
  >
    <q-card class="q-dialog-card bg-dark-1" flat>
      <q-card-section class="q-dialog-card-content">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 hidden">
              <q-file
                v-model="commandFile"
                ref="commandFileInput"
                class="q-pt-sm"
                accept=".json"
                filled
                dense
                hide-bottom-space
                @update:model-value="onImport"
              ></q-file>
            </div>

            <div class="col-12">
              <div>
                {{ $t('Components.CustomCommand.CommandName') }}
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
                {{ $t('Components.CustomCommand.CommandDescription') }}
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
                {{ $t('Commands.HelpCommand.Texts.CommandArguments') }}
              </div>

              <div class="row q-col-gutter-sm q-pt-sm">
                <div class="col-auto" v-for="(option, i) in command.command.options" :key="i">
                  <q-chip
                    class="full-width no-shadow bg-dark-3"
                    square
                    :label="option.name"
                    clickable
                    removable
                    @click="optionDialog(option)"
                    @remove="command.command.options.splice(i, 1)"
                  ></q-chip>
                </div>

                <div v-if="command.command.options.length < 25" class="col-auto">
                  <q-chip class="dashed-border no-shadow full-width" outline square clickable @click="optionDialog()">
                    <q-icon name="add" size="24px"></q-icon>
                  </q-chip>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator inset></q-separator>

        <q-card-section v-if="'scripts' in command">
          <ScriptEditor :scriptsProp="command.scripts" @change="onChangeScripts"></ScriptEditor>
        </q-card-section>

        <q-card-section v-if="'components' in command">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <q-btn-dropdown
                class="full-width"
                :label="$t('Components.CustomCommand.AddCondition')"
                color="dark-2"
                no-caps
                unelevated
              >
                <q-list>
                  <q-item
                    v-for="condition in conditionComponents"
                    :key="condition"
                    clickable
                    v-close-popup
                    @click="addConditionComponent(condition)"
                    :disable="isComponentLimitReached(`CONDITION:${condition}`)"
                  >
                    <q-item-section>
                      <q-item-label>
                        {{ $t(localeStringsMap.customBehaviorComponents[condition]) }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
            </div>

            <div class="col-12 col-md-4">
              <q-btn-dropdown
                class="full-width"
                :label="$t('Components.CustomCommand.AddAction')"
                color="dark-2"
                no-caps
                unelevated
              >
                <q-list>
                  <q-item
                    v-for="(action, i) in actionComponents.sort()"
                    :key="i"
                    clickable
                    v-close-popup
                    @click="addActionComponent(action)"
                    :disable="isComponentLimitReached(`ACTION:${action}`)"
                  >
                    <q-item-section>
                      <q-item-label>
                        {{ $t(localeStringsMap.customBehaviorComponents[action]) }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
            </div>

            <div class="col-12 col-md-4">
              <q-btn
                class="full-width"
                :label="$t('Convert to script')"
                unelevated
                no-caps
                color="primary"
                @click="convertComponents"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-section v-if="'components' in command && command.components.length">
          <div class="row q-col-gutter-md">
            <div v-for="(component, i) in command.components" :key="i" class="col-12">
              <q-card flat bordered class="bg-transparent">
                <q-item class="rounded-t-lg" clickable @click="componentDialog(component, i)">
                  <q-item-section>
                    <q-item-label class="text-subtitle1">
                      {{
                        $t(
                          localeStringsMap.customBehaviorComponents[component.condition?.type ?? component.action?.type]
                        )
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
      </q-card-section>

      <div class="q-pa-md">
        <q-list class="bg-dark-2 overflow-hidden rounded-borders">
          <q-expansion-item>
            <template #header>
              <q-item-section side>
                <q-checkbox
                  v-model="command.options"
                  val="THROTTLING"
                  dense
                  @update:model-value="onSelectOption"
                ></q-checkbox>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ $t('Components.SystemCommand.Throttling') }}
                </q-item-label>
              </q-item-section>
            </template>

            <q-card class="bg-dark-1 no-border-radius" bordered>
              <q-card-section>
                <div class="row q-col-gutter-md">
                  <div class="col-12">
                    <div>
                      {{ $t('Components.SystemCommand.ThrottlingScope') }}
                    </div>

                    <q-select
                      v-if="command.options.includes('THROTTLING')"
                      v-model="command.throttling.type"
                      :options="['PER_USER', 'PER_CHANNEL', 'PER_GUILD']"
                      :disable="command.inactive"
                      class="q-pt-sm"
                      filled
                      dense
                      hide-bottom-space
                    >
                      <template #selected-item="{ opt }">
                        <span>
                          {{ $t(localeStringsMap.commandThrottlingScopes[opt]) }}
                        </span>
                      </template>

                      <template #option="{ opt, toggleOption, selected }">
                        <q-item
                          clickable
                          @click="toggleOption(opt)"
                          :active="selected"
                          active-class="menu-item--active"
                        >
                          <q-item-section>
                            <q-item-label>
                              {{ $t(localeStringsMap.commandThrottlingScopes[opt]) }}
                            </q-item-label>
                          </q-item-section>
                        </q-item>
                      </template>
                    </q-select>

                    <q-select
                      v-else
                      :model-value="$t('Components.SystemCommand.ThrottlingScopes.PerUser')"
                      disable
                      class="q-pt-sm"
                      filled
                      dense
                      hide-bottom-space
                    ></q-select>
                  </div>

                  <div class="col-12">
                    <div>
                      {{ $t('Components.SystemCommand.ThrottlingMaxUses') }}
                    </div>

                    <q-slider
                      v-if="command.options.includes('THROTTLING')"
                      v-model.number="command.throttling.max_uses"
                      class="q-pt-sm q-px-sm"
                      :min="1"
                      :max="10"
                      snap
                      marker-labels
                    ></q-slider>

                    <q-slider
                      v-else
                      disable
                      :model-value="1"
                      class="q-pt-sm q-px-sm"
                      :min="1"
                      :max="10"
                      snap
                      marker-labels
                    ></q-slider>
                  </div>

                  <div class="col-12">
                    <div>
                      {{ $t('Components.SystemCommand.ThrottlingTimeout') }}
                    </div>

                    <q-select
                      v-if="command.options.includes('THROTTLING')"
                      v-model.number="command.throttling.timeout"
                      :options="[60, 120, 300, 600, 900, 1800, 3600, 7200, 21600, 43200, 64800, 86400]"
                      :disable="command.inactive"
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
                        <q-item
                          clickable
                          @click="toggleOption(opt)"
                          :active="selected"
                          active-class="menu-item--active"
                        >
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

                    <q-select
                      v-else
                      :model-value="
                        $dt
                          .now()
                          .plus({ seconds: 60 })
                          .toRelative({ unit: ['hours', 'minutes'], padding: 30000 })
                      "
                      disable
                      class="q-pt-sm"
                      filled
                      dense
                      hide-bottom-space
                    ></q-select>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-list>
      </div>

      <q-card-section class="q-dialog-card-actions row reverse q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-btn-dropdown
            v-if="mode === 'CREATE'"
            class="full-width"
            :label="$t('Common.Add')"
            :loading="confirmLoading"
            split
            unelevated
            no-caps
            color="primary"
            @click="onConfirm"
          >
            <q-list>
              <q-item clickable v-close-popup @click="commandFileInput.pickFiles()" :disable="confirmLoading">
                <q-item-section>
                  <q-item-label>
                    {{ $t('Common.Import') }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>

            <template #loading>
              <q-spinner-dots color="white"></q-spinner-dots>
            </template>
          </q-btn-dropdown>

          <q-btn-dropdown
            v-if="mode === 'UPDATE'"
            class="full-width"
            :label="$t('Common.Done')"
            :disable="!isValid"
            :loading="confirmLoading"
            split
            unelevated
            no-caps
            color="primary"
            @click="onConfirm"
          >
            <q-list>
              <q-item clickable v-close-popup @click="onDelete" :disable="confirmLoading">
                <q-item-section class="text-negative">
                  <q-item-label>
                    {{ $t('Common.Delete') }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-item clickable v-close-popup @click="onExport" :disable="confirmLoading">
                <q-item-section>
                  <q-item-label>
                    {{ $t('Common.Export') }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>

            <template #loading>
              <q-spinner-dots color="white"></q-spinner-dots>
            </template>
          </q-btn-dropdown>
        </div>

        <div class="col-12 col-md-6">
          <q-btn class="full-width" :label="$t('Common.Close')" unelevated no-caps color="dark-2" @click="onCancel" />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { debounce, useDialogPluginComponent, useQuasar } from 'quasar'
import { interfaces } from 'src/boot/axios'
import { useGuildStore } from 'src/stores/guild'
import { customCommandComponentLimits, discordAppCommandNameRegexp, localeStringsMap } from 'src/utils/Constants'
import { convertComponentsToScript } from 'src/utils/json-validation/ValidateCustomBehaviorScripts'
import { validateCustomCommand } from 'src/utils/json-validation/ValidateCustomCommand'
import { handleAxiosError } from 'src/utils/Utils'
import { computed, ref } from 'vue'
import { event } from 'vue-gtag'
import ScriptEditor from '../editors/ScriptEditor.vue'
import ComponentActionExecuteCode from './ComponentActionExecuteCode.vue'
import ComponentActionForwardToCommand from './ComponentActionForwardToCommand.vue'
import ComponentActionModifyRoles from './ComponentActionModifyRoles.vue'
import ComponentActionModifyWallet from './ComponentActionModifyWallet.vue'
import ComponentActionOverwriteChannelPermissions from './ComponentActionOverwriteChannelPermissions.vue'
import ComponentActionReply from './ComponentActionReply.vue'
import ComponentActionSendMessage from './ComponentActionSendMessage.vue'
import ComponentActionShowModal from './ComponentActionShowModal.vue'
import ComponentConditionCompareValues from './ComponentConditionCompareValues.vue'
import CustomCommandOption from './CustomCommandOption.vue'

defineEmits(useDialogPluginComponent.emits)

const props = defineProps({
  commandProp: {
    type: Object,
    default: null
  },
  modeProp: {
    type: String,
    default: null
  }
})

const $q = useQuasar(),
  { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

const guild = useGuildStore()
const mode = ref(props.modeProp ?? (props.commandProp ? 'UPDATE' : 'CREATE'))
const command = ref({
    options: [],
    command: {
      type: 1,
      name: '',
      description: null,
      options: []
    },
    ...JSON.parse(JSON.stringify(props.commandProp))
  }),
  commandFile = ref(null),
  commandFileInput = ref(null)

if (!('scripts' in command.value || 'components' in command.value))
  command.value.scripts = [{ name: null, language: 1, code: '' }]

const confirmLoading = ref(false)
const isValid = computed(() => {
  return Boolean(
    discordAppCommandNameRegexp.test(command.value.command.name) &&
      !guild.guild.commands.some(i => i.name === command.value.command.name) &&
      !guild.modules.custom_commands.some(
        i => i.command.name === command.value.command.name && i.id !== command.value.id
      ) &&
      command.value.command.description
  )
})

const onChangeScripts = debounce(value => {
  command.value.scripts = value
}, 500)

const convertComponents = () => {
  if (!('components' in command.value)) return null

  const script = convertComponentsToScript(command.value.components)
  command.value.scripts = [{ name: null, language: 1, code: script }]
  delete command.value.components

  return script
}

const conditionComponents = ['COMPARE_VALUES'],
  actionComponents = [
    'EXECUTE_CODE',
    'REPLY',
    'SEND_MESSAGE',
    'MODIFY_ROLES',
    'FORWARD_TO_COMMAND',
    'MODIFY_WALLET',
    'SHOW_MODAL',
    'OVERWRITE_CHANNEL_PERMISSIONS'
  ]

const addConditionComponent = type => {
    if (isComponentLimitReached(`CONDITION:${type}`)) return

    if (type === 'COMPARE_VALUES') {
      command.value.components.push({
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
  addActionComponent = type => {
    if (isComponentLimitReached(`ACTION:${type}`)) return

    if (type === 'REPLY') {
      command.value.components.push({
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
      command.value.components.push({
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
      command.value.components.push({
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
      command.value.components.push({
        type: 'ACTION',
        action: {
          type,
          forward_to_command: 'about'
        }
      })
    }

    if (type === 'MODIFY_WALLET') {
      command.value.components.push({
        type: 'ACTION',
        action: {
          type,
          modify_wallet: {
            amount: '0',
            user_id: null,
            currency_id: null
          }
        }
      })
    }

    if (type === 'EXECUTE_CODE') {
      command.value.components = []
      command.value.components.push({
        type: 'ACTION',
        action: {
          type,
          execute_code: {
            code: ''
          }
        }
      })
    }

    if (type === 'SHOW_MODAL') {
      command.value.components.push({
        type: 'ACTION',
        action: {
          type,
          show_modal: {
            title: null,
            customId: null,
            components: []
          }
        }
      })
    }

    if (type === 'OVERWRITE_CHANNEL_PERMISSIONS') {
      command.value.components.push({
        type: 'ACTION',
        action: {
          type,
          overwrite_channel_permissions: {
            channels: [],
            permissions: {},
            user_or_role: ''
          }
        }
      })
    }
  },
  moveComponent = (from, to) => {
    const component = command.value.components[from]
    let position = to === 0 ? from - 1 : from + 1

    if (position < 0) position = command.value.components.length - 1
    else if (position > command.value.components.length - 1) position = 0

    command.value.components.splice(from, 1)
    command.value.components.splice(position, 0, component)
  },
  isComponentLimitReached = type => {
    if (command.value.components.some(i => i.action?.type === 'EXECUTE_CODE')) return true

    const [componentType, subType] = type.split(':')
    const components = command.value.components.filter(
      i => i.type === componentType && (i.condition?.type === subType || i.action?.type === subType)
    )

    return components.length >= customCommandComponentLimits[subType]
  }

const optionDialog = opt => {
    $q.dialog({
      component: CustomCommandOption,

      componentProps: {
        optionProp: opt
      }
    }).onOk(payload => {
      const { mode, option } = payload

      if (mode === 'CREATE' && command.value.command.options.length < 25) {
        command.value.command.options.push(option)
      }

      if (mode === 'UPDATE') {
        const index = command.value.command.options.findIndex(i => i.name === opt.name)

        command.value.command.options[index] = option
      }
    })
  },
  componentDialog = (component, index) => {
    let dialogComponent

    if (component.condition?.type === 'COMPARE_VALUES') dialogComponent = ComponentConditionCompareValues

    if (component.action?.type === 'EXECUTE_CODE') dialogComponent = ComponentActionExecuteCode
    if (component.action?.type === 'REPLY') dialogComponent = ComponentActionReply
    if (component.action?.type === 'SEND_MESSAGE') dialogComponent = ComponentActionSendMessage
    if (component.action?.type === 'MODIFY_ROLES') dialogComponent = ComponentActionModifyRoles
    if (component.action?.type === 'FORWARD_TO_COMMAND') dialogComponent = ComponentActionForwardToCommand
    if (component.action?.type === 'MODIFY_WALLET') dialogComponent = ComponentActionModifyWallet
    if (component.action?.type === 'SHOW_MODAL') dialogComponent = ComponentActionShowModal
    if (component.action?.type === 'OVERWRITE_CHANNEL_PERMISSIONS')
      dialogComponent = ComponentActionOverwriteChannelPermissions

    $q.dialog({
      component: dialogComponent,

      componentProps: {
        componentProp: component
      }
    }).onOk(payload => {
      const { component } = payload

      command.value.components[index] = component
    })
  }

const onImport = file => {
    if (mode.value !== 'CREATE') return

    const reader = new FileReader()

    reader.onload = e => {
      let json

      try {
        json = JSON.parse(e.target.result)
      } catch (err) {
        json = null
      }

      const data = validateCustomCommand(json)
      if ('scripts' in data) delete command.value.scripts
      setTimeout(() => (command.value = data), 1)

      event('import_custom_command', { event_category: 'utility' })
    }

    reader.readAsText(file)
  },
  onExport = () => {
    if (mode.value !== 'UPDATE') return

    const data = JSON.stringify(command.value)
    const link = document.createElement('a')

    link.style.display = 'none'
    link.setAttribute('href', `data:application/json;charset=utf-8,${encodeURIComponent(data)}`)
    link.setAttribute('download', `${command.value.id}.json`)

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    event('export_custom_command', { event_category: 'utility' })
  }

const onSelectOption = options => {
  if (options.includes('THROTTLING') && !command.value.throttling) {
    command.value.throttling = {
      type: 'PER_USER',
      max_uses: 1,
      timeout: 60
    }
  }

  if (!options.includes('THROTTLING')) {
    delete command.value.throttling
  }
}

const onConfirm = () => {
    if (isValid.value) {
      confirmLoading.value = true

      return (
        mode.value === 'CREATE'
          ? interfaces.guilds.createCustomCommand(guild._id, command.value)
          : interfaces.guilds.updateCustomCommand(guild._id, command.value.id, command.value)
      )
        .then(response => {
          onDialogOK({ mode: mode.value, command: response.data })
        })
        .catch(err => {
          const error = handleAxiosError(err)

          $q.notify({
            message: error.message,
            classes: 'q-notification-custom',
            color: 'black',
            icon: 'error',
            iconColor: 'negative',
            timeout: 5000
          })
        })
        .finally(() => (confirmLoading.value = false))
    }
  },
  onCancel = onDialogCancel,
  onDismiss = onDialogHide,
  onDelete = () => {
    confirmLoading.value = true

    return interfaces.guilds
      .deleteCustomCommand(guild._id, command.value.id)
      .then(() => {
        onDialogOK({ mode: 'DELETE', command: command.value })
      })
      .catch(err => {
        const error = handleAxiosError(err)

        $q.notify({
          message: error.message,
          classes: 'q-notification-custom',
          color: 'black',
          icon: 'error',
          iconColor: 'negative',
          timeout: 5000
        })
      })
      .finally(() => (confirmLoading.value = false))
  }
</script>

<style lang="scss" scoped>
.nav-item--active {
  color: $almost-white-1;
  background: $dark-3;
}
</style>
