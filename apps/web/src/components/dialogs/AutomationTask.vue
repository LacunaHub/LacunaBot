<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="q-dialog-card rounded-lg bg-dark-1" flat style="width: 1000px">
      <q-tabs
        v-model="currentTab"
        class="bg-dark-2"
        align="justify"
        active-bg-color="secondary"
        indicator-color="transparent"
        no-caps
      >
        <q-tab name="general" :label="$t('pages.guild.nav_names.GENERAL')" style="width: 50%"></q-tab>

        <q-tab name="components" :label="$t('common.actions')" style="width: 50%"></q-tab>
      </q-tabs>

      <q-tab-panels v-model="currentTab" class="bg-dark-1" animated>
        <q-tab-panel name="general" class="q-pa-none">
          <q-card-section v-if="mode === 'CREATE'">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-btn
                  class="full-width"
                  :label="$t('import')"
                  unelevated
                  no-caps
                  color="secondary"
                  @click="importAutomationDialog"
                />
              </div>
            </div>
          </q-card-section>

          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <div>
                  {{ $t('name') }}
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
                  {{ $t('automation.trigger_title') }}
                </div>

                <q-select
                  v-model="automation.trigger"
                  :options="triggers"
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
                          {{ $t(`automation.trigger_names.${opt}`) }}
                        </q-item-label>

                        <q-item-label class="text--secondary" caption>
                          {{ opt }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>

                  <template #selected-item="{ opt }">
                    <span>
                      {{ $t(`automation.trigger_names.${opt}`) }}
                    </span>
                  </template>
                </q-select>
              </div>
            </div>
          </q-card-section>

          <q-list class="q-px-none q-py-md">
            <q-item tag="label" dense v-ripple>
              <q-item-section>
                <q-item-label>
                  {{ $t('disable') }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-checkbox v-model="automation.options" val="DISABLED" dense></q-checkbox>
              </q-item-section>
            </q-item>
          </q-list>
        </q-tab-panel>

        <q-tab-panel name="components" class="q-pa-none">
          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-btn-dropdown
                  class="full-width"
                  :label="$t('custom_command.add_condition')"
                  color="dark-2"
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
                  color="dark-2"
                  no-caps
                  unelevated
                >
                  <q-list>
                    <q-item
                      v-for="(action, i) in actions.sort()"
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

                      <q-item-section v-if="action === 'EXECUTE_CODE'" avatar side>
                        <q-avatar size="24px">
                          <img src="~assets/lacuna-diamond.svg" />

                          <q-tooltip
                            class="bg-black rounded-lg text-body2"
                            anchor="top middle"
                            self="bottom middle"
                            transition-show=""
                            transition-hide=""
                          >
                            Only with Lacuna Diamond
                          </q-tooltip>
                        </q-avatar>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </div>
            </div>
          </q-card-section>

          <q-card-section v-if="automation.components.length">
            <div class="row q-col-gutter-md">
              <div v-for="(component, i) in automation.components" :key="i" class="col-12">
                <q-card flat bordered class="bg-transparent rounded-lg">
                  <q-item class="rounded-t-lg" clickable v-ripple @click="componentDialog(component, i)">
                    <q-item-section>
                      <q-item-label class="text-subtitle1">
                        {{
                          $t(`custom_command.component_names.${component.condition?.type ?? component.action?.type}`)
                        }}
                      </q-item-label>
                    </q-item-section>

                    <q-item-section v-if="component.action?.type === 'EXECUTE_CODE'" avatar side>
                      <q-avatar size="24px">
                        <img src="~assets/lacuna-diamond.svg" />

                        <q-tooltip
                          class="bg-black rounded-lg text-body2"
                          anchor="top middle"
                          self="bottom middle"
                          transition-show=""
                          transition-hide=""
                        >
                          Only with Lacuna Diamond
                        </q-tooltip>
                      </q-avatar>
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
        </q-tab-panel>
      </q-tab-panels>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-btn class="full-width" :label="$t('close')" unelevated no-caps color="dark-2" @click="onCancel" />
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
              <q-list>
                <q-item clickable v-close-popup @click="onDelete" :disable="confirmLoading">
                  <q-item-section class="text-negative">
                    <q-item-label>
                      {{ $t('delete') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item clickable v-close-popup @click="onPublish" :disable="confirmLoading">
                  <q-item-section>
                    <q-item-label>
                      {{ $t('publish') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item clickable v-close-popup @click="onExport" :disable="confirmLoading">
                  <q-item-section>
                    <q-item-label>
                      {{ $t('export') }}
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
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { interfaces } from 'src/boot/axios'
import { useGuildStore } from 'src/stores/guild'
import { customCommandComponentLimits } from 'src/utils/Constants'
import { handleAxiosError, suid } from 'src/utils/Utils'
import { computed, defineComponent, ref } from 'vue'
import { event } from 'vue-gtag'
import { useI18n } from 'vue-i18n'
import AutomationTaskImport from './AutomationTaskImport.vue'
import ComponentActionExecuteCode from './ComponentActionExecuteCode.vue'
import ComponentActionForwardToCommand from './ComponentActionForwardToCommand.vue'
import ComponentActionModifyRoles from './ComponentActionModifyRoles.vue'
import ComponentActionModifyWallet from './ComponentActionModifyWallet.vue'
import ComponentActionOverwriteChannelPermissions from './ComponentActionOverwriteChannelPermissions.vue'
import ComponentActionReply from './ComponentActionReply.vue'
import ComponentActionSendMessage from './ComponentActionSendMessage.vue'
import ComponentActionShowModal from './ComponentActionShowModal.vue'
import ComponentConditionCompareValues from './ComponentConditionCompareValues.vue'

export default defineComponent({
  name: 'AutomationTask',

  emits: [...useDialogPluginComponent.emits],

  props: {
    automationProp: {
      type: Object,
      default: null
    }
  },

  setup(props) {
    const $q = useQuasar(),
      { t: $t } = useI18n()
    const { dialogRef, onDialogOK, onDialogHide, onDialogCancel } = useDialogPluginComponent()
    const guild = useGuildStore()

    const mode = ref(props.automationProp ? 'UPDATE' : 'CREATE')
    const automation = ref(
      mode.value === 'UPDATE'
        ? JSON.parse(JSON.stringify(props.automationProp))
        : {
            id: suid(6),
            name: null,
            options: [],
            trigger: null,
            components: []
          }
    )

    const confirmLoading = ref(false),
      currentTab = ref('general'),
      automationFile = ref(null)

    const isValid = computed(() => {
      return Boolean(automation.value.name && automation.value.trigger && automation.value.components.length)
    })

    return {
      dialogRef,
      guild,

      mode,
      automation,

      confirmLoading,
      currentTab,
      automationFile,

      isValid,

      onConfirm() {
        if (isValid.value) {
          onDialogOK({ mode: mode.value, automation: automation.value })
        }
      },

      onCancel() {
        onDialogCancel()
      },

      onDismiss() {
        onDialogHide()
      },

      onDelete() {
        onDialogOK({ mode: 'DELETE', automation: automation.value })
      }
    }
  },

  data() {
    return {
      triggers: [
        'GUILD_MEMBER_ADD',
        'GUILD_MEMBER_REMOVE',
        'INTERACTION_BUTTON',
        'INTERACTION_SELECT_MENU',
        'INTERACTION_MODAL_SUBMIT',
        'MESSAGE_CREATE',
        'MESSAGE_DELETE',
        'MESSAGE_UPDATE',
        'ROLE_MEMBER_ADD',
        'ROLE_MEMBER_REMOVE',
        'VOICE_CONNECT',
        'VOICE_DISCONNECT'
      ],
      conditions: ['COMPARE_VALUES'],
      actions: [
        'EXECUTE_CODE',
        'REPLY',
        'SEND_MESSAGE',
        'MODIFY_ROLES',
        'MODIFY_WALLET',
        'SHOW_MODAL',
        'OVERWRITE_CHANNEL_PERMISSIONS'
      ]
    }
  },

  methods: {
    importAutomationDialog() {
      this.$q
        .dialog({
          component: AutomationTaskImport
        })
        .onOk(({ automation }) => {
          this.automation = automation
        })
    },
    addCondition(type) {
      if (this.isComponentLimitReached(`CONDITION:${type}`)) return

      if (type === 'COMPARE_VALUES') {
        this.automation.components.push({
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
    addAction(type) {
      if (this.isComponentLimitReached(`ACTION:${type}`)) return

      if (type === 'EXECUTE_CODE') {
        this.automation.components = []
        this.automation.components.push({
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
        this.automation.components.push({
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
        this.automation.components.push({
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
        this.automation.components.push({
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
        this.automation.components.push({
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
        this.automation.components.push({
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
        this.automation.components.push({
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
    isComponentLimitReached(type) {
      if (this.automation.components.some(i => i.action?.type === 'EXECUTE_CODE')) return true

      const [componentType, subType] = type.split(':')
      const components = this.automation.components.filter(
        i => i.type === componentType && (i.condition?.type === subType || i.action?.type === subType)
      )

      return components.length >= customCommandComponentLimits[subType]
    },
    componentDialog(component, index) {
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

      this.$q
        .dialog({
          component: dialogComponent,

          componentProps: {
            componentProp: component
          }
        })
        .onOk(payload => {
          const { component } = payload

          this.automation.components[index] = component
        })
    },
    moveComponent(from, to) {
      const component = this.automation.components[from]
      let position = to === 0 ? from - 1 : from + 1

      if (position < 0) position = this.automation.components.length - 1
      else if (position > this.automation.components.length - 1) position = 0

      this.automation.components.splice(from, 1)
      this.automation.components.splice(position, 0, component)
    },
    onPublish() {
      if (this.mode !== 'UPDATE' || !this.isValid) return

      this.confirmLoading = true

      return interfaces.common
        .publishAutomationTask(this.guild._id, { data: this.automation })
        .then(() => {
          event('publish_automation', { event_category: 'utility' })

          this.$q.notify({
            message: this.$t(`custom_command.command_sent_for_review`),
            classes: 'rounded-lg q-notification-custom',
            color: 'black',
            icon: 'done',
            iconColor: 'positive',
            timeout: 5000
          })
        })
        .catch(err => {
          const error = handleAxiosError(err)

          this.$q.notify({
            message: error.message,
            classes: 'rounded-lg q-notification-custom',
            color: 'black',
            icon: 'error',
            iconColor: 'negative',
            timeout: 5000
          })
        })
        .finally(() => (this.confirmLoading = false))
    },
    onExport() {
      if (this.mode !== 'UPDATE') return

      const data = JSON.stringify(this.automation)
      const link = document.createElement('a')

      link.style.display = 'none'
      link.setAttribute('href', `data:application/json;charset=utf-8,${encodeURIComponent(data)}`)
      link.setAttribute('download', `${this.automation.id}.json`)

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      event('export_automation', { event_category: 'utility' })
    }
  }
})
</script>
