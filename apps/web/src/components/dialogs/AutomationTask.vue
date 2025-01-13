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
                v-model="automationFile"
                ref="automationFileInput"
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
                {{ $t('Common.Name') }}
              </div>

              <q-input
                v-model.trim="automation.name"
                class="q-pt-sm"
                :maxlength="32"
                filled
                dense
                hide-bottom-space
              ></q-input>
            </div>

            <div class="col-12">
              <div>
                {{ $t('Components.Automation.Trigger') }}
              </div>

              <q-select
                v-model="automation.trigger"
                :options="automationTriggers"
                class="q-pt-sm"
                filled
                dense
                hide-bottom-space
                emit-value
                map-options
              >
                <template #option="{ opt, toggleOption, selected }">
                  <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                    <q-item-section>
                      <q-item-label>
                        {{ $t(localeStringsMap.automationTriggers[opt]) }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>

                <template #selected-item="{ opt }">
                  <span>
                    {{ $t(localeStringsMap.automationTriggers[opt]) }}

                    <span class="text-caption text--secondary">({{ opt }})</span>
                  </span>
                </template>
              </q-select>
            </div>
          </div>
        </q-card-section>

        <q-separator inset></q-separator>

        <q-card-section v-if="'scripts' in automation">
          <ScriptEditor :scriptsProp="automation.scripts" @change="onChangeScripts"></ScriptEditor>
        </q-card-section>

        <q-card-section v-if="'components' in automation">
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

        <q-card-section v-if="'components' in automation && automation.components.length">
          <div class="row q-col-gutter-md">
            <div v-for="(component, i) in automation.components" :key="i" class="col-12">
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
                    @click="automation.components.splice(i, 1)"
                  ></q-btn>
                </q-card-actions>
              </q-card>
            </div>
          </div>
        </q-card-section>

        <div class="q-pa-md">
          <q-list class="bg-dark-2 overflow-hidden rounded-borders">
            <q-item tag="label">
              <q-item-section side>
                <q-checkbox v-model="automation.options" val="DISABLED" dense></q-checkbox>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ $t('Common.Disable') }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card-section>

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
              <q-item clickable v-close-popup @click="automationFileInput.pickFiles()" :disable="confirmLoading">
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
import { useGuildStore } from 'src/stores/guild'
import { automationTriggers, customCommandComponentLimits, localeStringsMap } from 'src/utils/Constants'
import { validateAutomation } from 'src/utils/json-validation/ValidateAutomation'
import { convertComponentsToScript } from 'src/utils/json-validation/ValidateCustomBehaviorScripts'
import { suid } from 'src/utils/Utils'
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

defineEmits(useDialogPluginComponent.emits)

const props = defineProps({
  automationProp: {
    type: Object,
    default: null
  },
  modeProp: {
    type: String,
    default: null
  }
})

const $q = useQuasar(),
  { dialogRef, onDialogOK, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const guild = useGuildStore()
const mode = ref(props.modeProp ?? (props.automationProp ? 'UPDATE' : 'CREATE'))
const automation = ref({
    id: suid(6),
    name: null,
    options: [],
    trigger: null,
    ...JSON.parse(JSON.stringify(props.automationProp))
  }),
  automationFile = ref(null),
  automationFileInput = ref(null)

if (!('scripts' in automation.value || 'components' in automation.value))
  automation.value.scripts = [{ name: null, language: 1, code: '' }]

const confirmLoading = ref(false)
const isValid = computed(() => {
  return Boolean(automation.value.name && automation.value.trigger)
})
const triggers = computed(() => {
  const usedTriggers = new Set(guild.modules.automation.filter(v => v.id !== automation.value.id).map(v => v.trigger))
  return automationTriggers.filter(v => !usedTriggers.has(v))
})

const onChangeScripts = debounce(value => {
  automation.value.scripts = value
}, 500)

const convertComponents = () => {
  if (!('components' in automation.value)) return null

  const script = convertComponentsToScript(automation.value.components)
  automation.value.scripts = [{ name: null, language: 1, code: script }]
  delete automation.value.components

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
      automation.value.components.push({
        type: 'CONDITION',
        condition: {
          type,
          compare_values: {
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

    if (type === 'EXECUTE_CODE') {
      automation.value.components = []
      automation.value.components.push({
        type: 'ACTION',
        action: {
          type,
          execute_code: {
            code: ''
          }
        }
      })
    }

    if (type === 'REPLY') {
      automation.value.components.push({
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
      automation.value.components.push({
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
      automation.value.components.push({
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

    if (type === 'MODIFY_WALLET') {
      automation.value.components.push({
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

    if (type === 'SHOW_MODAL') {
      automation.value.components.push({
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
      automation.value.components.push({
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
    const component = automation.value.components[from]
    let position = to === 0 ? from - 1 : from + 1

    if (position < 0) position = automation.value.components.length - 1
    else if (position > automation.value.components.length - 1) position = 0

    automation.value.components.splice(from, 1)
    automation.value.components.splice(position, 0, component)
  },
  isComponentLimitReached = type => {
    if (automation.value.components.some(i => i.action?.type === 'EXECUTE_CODE')) return true

    const [componentType, subType] = type.split(':')
    const components = automation.value.components.filter(
      i => i.type === componentType && (i.condition?.type === subType || i.action?.type === subType)
    )

    return components.length >= customCommandComponentLimits[subType]
  }

const componentDialog = (component, index) => {
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

  return $q
    .dialog({
      component: dialogComponent,

      componentProps: {
        componentProp: component
      }
    })
    .onOk(payload => {
      const { component } = payload

      automation.value.components[index] = component
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

      const data = validateAutomation(json)
      if ('scripts' in data) delete automation.value.scripts
      setTimeout(() => (automation.value = data), 1)

      event('import_custom_automation', { event_category: 'utility' })
    }

    reader.readAsText(file)
  },
  onExport = () => {
    if (mode.value !== 'UPDATE') return

    const data = JSON.stringify(automation.value)
    const link = document.createElement('a')

    link.style.display = 'none'
    link.setAttribute('href', `data:application/json;charset=utf-8,${encodeURIComponent(data)}`)
    link.setAttribute('download', `${automation.value.id}.json`)

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    event('export_automation', { event_category: 'utility' })
  }

const onConfirm = () => {
    if (isValid.value) {
      onDialogOK({ mode: mode.value, automation: automation.value })
    }
  },
  onCancel = onDialogCancel,
  onDismiss = onDialogHide,
  onDelete = () => onDialogOK({ mode: 'DELETE', automation: automation.value })
</script>
