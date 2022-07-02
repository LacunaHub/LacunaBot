<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="rounded-lg bg-dark-grey-2" style="width: 800px; max-width: 90vw">
      <q-item class="q-py-md rounded-t-lg">
        <q-item-section>
          <q-item-label class="text-subtitle1 text-uppercase">
            {{ $t(mode === 'CREATE' ? 'mod_warning_penalty.add_penalty' : 'mod_warning_penalty.edit_penalty') }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('mod_warning_penalty.warnings_amount_title') }}
            </div>

            <q-slider v-model.number="penalty.penalties" class="q-pt-sm q-px-sm" :min="1" :max="100" label></q-slider>
          </div>
        </div>
      </q-card-section>

      <q-list class="q-px-none q-py-md" dense>
        <q-item
          v-for="action in actions"
          :key="action"
          tag="label"
          :disable="penalty.options.some(i => action.exclusive.includes(i))"
          v-ripple="!penalty.options.some(i => action.exclusive.includes(i))"
        >
          <q-item-section>
            <q-item-label>
              {{ $t(`common.actions_keys.${action.name}`) }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-checkbox
              v-model="penalty.options"
              :val="action.name"
              :disable="penalty.options.some(i => action.exclusive.includes(i))"
              dense
              @update:model-value="onSelectOption"
            ></q-checkbox>
          </q-item-section>
        </q-item>
      </q-list>

      <transition enter-active-class="animated fadeInUp">
        <q-card-section v-if="penalty.options.includes('ACTION_BAN')">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('automoder.penalty_timeout') }}
              </div>

              <q-select
                v-model.number="penalty.ban_timeout"
                :options="[
                  0, 300, 600, 900, 1800, 3600, 7200, 21600, 43200, 64800, 86400, 172800, 259200, 604800, 1209600
                ]"
                class="q-pt-sm"
                filled
                dense
                hide-bottom-space
              >
                <template #selected-item="{ opt }">
                  <span v-if="opt === 0" class="text-lowercase">
                    {{ $t('automoder.indefinitely') }}
                  </span>
                  <span v-else>
                    {{
                      $dt
                        .now()
                        .plus({ seconds: opt })
                        .toRelative({ unit: ['days', 'hours', 'minutes'], padding: 30000 })
                    }}
                  </span>
                </template>

                <template #option="{ opt, toggleOption, selected }">
                  <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                    <q-item-section>
                      <q-item-label v-if="opt === 0" class="text-lowercase">
                        {{ $t('automoder.indefinitely') }}
                      </q-item-label>
                      <q-item-label v-else>
                        {{
                          $dt
                            .now()
                            .plus({ seconds: opt })
                            .toRelative({ unit: ['days', 'hours', 'minutes'], padding: 30000 })
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

      <transition enter-active-class="animated fadeInUp">
        <q-card-section v-if="penalty.options.includes('ACTION_MUTE')">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('automoder.penalty_timeout') }}
              </div>

              <q-select
                v-model.number="penalty.mute_timeout"
                :options="[
                  60, 120, 300, 600, 900, 1800, 3600, 7200, 21600, 43200, 64800, 86400, 172800, 259200, 604800, 1209600
                ]"
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
                        .toRelative({ unit: ['days', 'hours', 'minutes'], padding: 30000 })
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
                            .toRelative({ unit: ['days', 'hours', 'minutes'], padding: 30000 })
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

      <transition enter-active-class="animated fadeInUp">
        <q-card-section v-if="penalty.options.includes('ACTION_MODIFY_ROLES')">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('common.add_roles') }}
              </div>

              <q-select
                v-model="penalty.modify_roles.add"
                :options="guild.rolesUnmanaged"
                option-label="name"
                option-value="id"
                use-chips
                class="q-pt-sm"
                multiple
                filled
                dense
                hide-bottom-space
                emit-value
                map-options
              >
                <template #selected-item="{ opt, index, removeAtIndex }">
                  <q-chip
                    class="rounded-lg"
                    square
                    :label="opt.name ?? opt"
                    size="sm"
                    :style="`background: ${opt.color}`"
                    :ripple="false"
                    removable
                    @remove="removeAtIndex(index)"
                  ></q-chip>
                </template>

                <template #option="{ opt, toggleOption, selected }">
                  <q-item
                    clickable
                    @click="toggleOption(opt)"
                    :active="selected"
                    :disable="opt.higher"
                    active-class="menu-item--active"
                  >
                    <q-item-section>
                      <q-item-label :style="`color: ${opt.color}`">{{ opt.name }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <div class="col-12">
              <div>
                {{ $t('common.remove_roles') }}
              </div>

              <q-select
                v-model="penalty.modify_roles.remove"
                :options="guild.rolesUnmanaged"
                option-label="name"
                option-value="id"
                use-chips
                class="q-pt-sm"
                multiple
                filled
                dense
                hide-bottom-space
                emit-value
                map-options
              >
                <template #selected-item="{ opt, index, removeAtIndex }">
                  <q-chip
                    class="rounded-lg"
                    square
                    :label="opt.name ?? opt"
                    size="sm"
                    :style="`background: ${opt.color}`"
                    :ripple="false"
                    removable
                    @remove="removeAtIndex(index)"
                  ></q-chip>
                </template>

                <template #option="{ opt, toggleOption, selected }">
                  <q-item
                    clickable
                    @click="toggleOption(opt)"
                    :active="selected"
                    :disable="opt.higher"
                    active-class="menu-item--active"
                  >
                    <q-item-section>
                      <q-item-label :style="`color: ${opt.color}`">{{ opt.name }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </div>
        </q-card-section>
      </transition>

      <transition enter-active-class="animated fadeInUp">
        <q-card-section v-if="penalty.options.includes('ACTION_SEND_MESSAGE')">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('pages.guild.gs_message_template_title') }}
              </div>

              <MessageEditor :message="penalty.send_message" avlReplacers="message guild member" class="q-pt-sm" />
            </div>
          </div>
        </q-card-section>
      </transition>

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
              unelevated
              no-caps
              color="primary"
              @click="onConfirm"
            />
            <q-btn-dropdown
              v-if="mode === 'UPDATE'"
              class="full-width rounded-lg"
              :label="$t('done')"
              :disable="!isValid"
              split
              unelevated
              no-caps
              color="primary"
              @click="onConfirm"
            >
              <q-list dense>
                <q-item clickable v-close-popup @click="onDelete">
                  <q-item-section class="text-negative">
                    <q-item-label>
                      {{ $t('delete') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
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
import { suid } from 'src/utils/Utils'
import MessageEditor from '../MessageEditor.vue'

export default defineComponent({
  name: 'ModerationWarningPenalty',

  emits: [...useDialogPluginComponent.emits],

  props: {
    penaltyProp: {
      type: Object,
      default: null
    }
  },

  components: {
    MessageEditor
  },

  setup(props) {
    const guild = useGuildStore()
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const mode = ref(props.penaltyProp ? 'UPDATE' : 'CREATE')
    const penalty = ref(
      mode.value === 'UPDATE'
        ? JSON.parse(JSON.stringify(props.penaltyProp))
        : {
            id: suid(6),
            penalties: 1,
            options: []
          }
    )

    const isValid = computed(() => {
      return (
        !guild.moderation.warnings.penalties.some(
          i => i.penalties === penalty.value.penalties && i.id !== penalty.value.id
        ) && penalty.value.options.length
      )
    })

    return {
      guild,
      dialogRef,
      mode,
      penalty,
      isValid,

      onConfirm() {
        if (isValid.value) {
          onDialogOK({ mode: mode.value, penalty: penalty.value })
        }
      },

      onCancel() {
        onDialogCancel()
      },

      onDismiss() {
        onDialogHide()
      },

      onDelete() {
        onDialogOK({ mode: 'DELETE', penalty: penalty.value })
      }
    }
  },

  data() {
    return {
      actions: [
        { name: 'ACTION_BAN', exclusive: ['ACTION_MUTE', 'ACTION_KICK', 'ACTION_MODIFY_ROLES'] },
        { name: 'ACTION_MUTE', exclusive: ['ACTION_BAN', 'ACTION_KICK'] },
        { name: 'ACTION_KICK', exclusive: ['ACTION_BAN', 'ACTION_MUTE', 'ACTION_MODIFY_ROLES'] },
        { name: 'ACTION_MODIFY_ROLES', exclusive: ['ACTION_BAN', 'ACTION_KICK'] },
        { name: 'ACTION_SEND_MESSAGE', exclusive: [] },
        { name: 'ACTION_RESET_VIOLATIONS', exclusive: [] }
      ]
    }
  },

  methods: {
    onSelectOption(options) {
      if (options.includes('ACTION_BAN') && !this.penalty.ban_timeout) {
        this.penalty.ban_timeout = 300
      }

      if (options.includes('ACTION_MUTE') && !this.penalty.mute_timeout) {
        this.penalty.mute_timeout = 60
      }

      if (options.includes('ACTION_MODIFY_ROLES') && !this.penalty.modify_roles) {
        this.penalty.modify_roles = { add: [], remove: [] }
      }

      if (options.includes('ACTION_SEND_MESSAGE') && !this.penalty.send_message) {
        this.penalty.send_message = {
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

      if (!options.includes('ACTION_BAN')) {
        delete this.penalty.ban_timeout
      }

      if (!options.includes('ACTION_MUTE')) {
        delete this.penalty.mute_timeout
      }

      if (!options.includes('ACTION_MODIFY_ROLES')) {
        delete this.penalty.modify_roles
      }

      if (!options.includes('ACTION_SEND_MESSAGE')) {
        delete this.penalty.send_message
      }
    }
  }
})
</script>
