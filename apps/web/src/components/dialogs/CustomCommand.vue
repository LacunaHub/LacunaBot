<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="rounded-lg bg-dark-1" flat style="width: 1000px; max-width: 90vw">
      <q-item class="q-py-md rounded-t-lg">
        <q-item-section>
          <q-item-label class="text-subtitle1 text-uppercase">
            {{ $t(mode === 'CREATE' ? 'custom_command.add_custom_command' : 'custom_command.edit_custom_command') }}
          </q-item-label>
        </q-item-section>
      </q-item>

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
        <q-tab-panel name="general" class="q-pa-none" style="overflow-y: hidden">
          <q-card-section v-if="mode === 'CREATE'">
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <q-btn
                  class="full-width"
                  :label="$t('custom_command.import_command')"
                  unelevated
                  no-caps
                  color="secondary"
                  @click="importCommandDialog"
                />
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
                      {{ $t('custom_command.publish_command') }}
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
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { interfaces } from 'src/boot/axios'
import { useGuildStore } from 'src/stores/guild'
import { customCommandComponentLimits, discordAppCommandNameRegexp } from 'src/utils/Constants'
import { handleAxiosError } from 'src/utils/Utils'
import { computed, defineComponent, ref } from 'vue'
import { event } from 'vue-gtag'
import { useI18n } from 'vue-i18n'
import ComponentActionExecuteCode from './ComponentActionExecuteCode.vue'
import ComponentActionForwardToCommand from './ComponentActionForwardToCommand.vue'
import ComponentActionModifyRoles from './ComponentActionModifyRoles.vue'
import ComponentActionModifyWallet from './ComponentActionModifyWallet.vue'
import ComponentActionOverwriteChannelPermissions from './ComponentActionOverwriteChannelPermissions.vue'
import ComponentActionReply from './ComponentActionReply.vue'
import ComponentActionSendMessage from './ComponentActionSendMessage.vue'
import ComponentActionShowModal from './ComponentActionShowModal.vue'
import ComponentConditionCompareValues from './ComponentConditionCompareValues.vue'
import CustomCommandImport from './CustomCommandImport.vue'
import CustomCommandOption from './CustomCommandOption.vue'

export default defineComponent({
  name: 'CustomCommand',

  emits: [...useDialogPluginComponent.emits],

  props: {
    commandProp: {
      type: Object,
      default: null
    }
  },

  setup(props) {
    const $q = useQuasar(),
      { t: $t } = useI18n()

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
      currentTab,
      commandFile,

      isValid,

      onConfirm() {
        if (isValid.value) {
          confirmLoading.value = true

          return interfaces.guilds
            .updateCustomCommands(guild._id, { method: mode.value.toLowerCase(), data: command.value })
            .then(response => {
              onDialogOK({ mode: mode.value, command: response.data })
            })
            .catch(err => {
              const error = handleAxiosError(err)

              $q.notify({
                message: error.message,
                classes: 'rounded-lg q-notification-custom',
                color: 'black',
                icon: 'error',
                iconColor: 'negative',
                timeout: 5000
              })
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

        return interfaces.guilds
          .updateCustomCommands(guild._id, { method: 'delete', data: command.value })
          .then(() => {
            onDialogOK({ mode: 'DELETE', command: command.value })
          })
          .catch(err => {
            const error = handleAxiosError(err)

            $q.notify({
              message: error.message,
              classes: 'rounded-lg q-notification-custom',
              color: 'black',
              icon: 'error',
              iconColor: 'negative',
              timeout: 5000
            })
          })
          .finally(() => (confirmLoading.value = false))
      }
    }
  },

  data() {
    return {
      conditions: ['COMPARE_VALUES'],
      actions: [
        'EXECUTE_CODE',
        'REPLY',
        'SEND_MESSAGE',
        'MODIFY_ROLES',
        'FORWARD_TO_COMMAND',
        'MODIFY_WALLET',
        'SHOW_MODAL',
        'OVERWRITE_CHANNEL_PERMISSIONS'
      ]
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
              amount: '0',
              user_id: null,
              currency_id: null
            }
          }
        })
      }

      if (type === 'EXECUTE_CODE') {
        this.command.components = []
        this.command.components.push({
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
        this.command.components.push({
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
        this.command.components.push({
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
    moveComponent(from, to) {
      const component = this.command.components[from]
      let position = to === 0 ? from - 1 : from + 1

      if (position < 0) position = this.command.components.length - 1
      else if (position > this.command.components.length - 1) position = 0

      this.command.components.splice(from, 1)
      this.command.components.splice(position, 0, component)
    },
    isComponentLimitReached(type) {
      if (this.command.components.some(i => i.action?.type === 'EXECUTE_CODE')) return true

      const [componentType, subType] = type.split(':')
      const components = this.command.components.filter(
        i => i.type === componentType && (i.condition?.type === subType || i.action?.type === subType)
      )

      return components.length >= customCommandComponentLimits[subType]
    },
    importCommandDialog() {
      this.$q
        .dialog({
          component: CustomCommandImport
        })
        .onOk(payload => {
          const { command } = payload

          this.command = command
        })
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

          this.command.components[index] = component
        })
    },
    onPublish() {
      if (this.mode !== 'UPDATE' || !this.isValid) return

      this.confirmLoading = true

      return interfaces.common
        .publishCustomCommand(this.guild._id, { data: this.command })
        .then(() => {
          event('publish_custom_command', { event_category: 'utility' })

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
