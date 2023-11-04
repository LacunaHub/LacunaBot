<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="bg-dark-1" flat style="width: 1000px; max-width: 90vw">
      <q-item class="q-py-md rounded-t-lg" tag="label">
        <q-item-section>
          <q-item-label class="text-subtitle1 text-uppercase">
            {{ $t(`automoder.titles.${name}`) }}
          </q-item-label>
        </q-item-section>

        <q-item-section side top>
          <q-toggle v-model="config.active" dense></q-toggle>
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

        <q-tab name="actions" :label="$t('common.actions')" style="width: 50%"></q-tab>
      </q-tabs>

      <q-tab-panels v-model="currentTab" class="bg-dark-1" animated>
        <q-tab-panel name="general" class="q-pa-none" style="overflow-y: hidden">
          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <div>
                  {{ $t('automoder.ac_percentage_title') }}
                </div>

                <q-slider
                  v-model.number="config.percentage_of_caps"
                  :disable="!config.active"
                  class="q-pt-sm q-px-sm"
                  :min="10"
                  :max="100"
                  label
                ></q-slider>
              </div>

              <div class="col-12">
                <div>
                  {{ $t('automoder.ac_minimum_symbols_title') }}
                </div>

                <q-slider
                  v-model.number="config.minimum_content_length"
                  :disable="!config.active"
                  class="q-pt-sm q-px-sm"
                  :min="1"
                  :max="200"
                  label
                ></q-slider>
              </div>
            </div>
          </q-card-section>

          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-12">
                <div>
                  {{ $t('common.ignored_channels') }}
                </div>

                <q-select
                  v-model="config.ignored.channels"
                  :options="guild.channelsText"
                  option-label="name"
                  option-value="id"
                  :disable="!config.active"
                  class="q-pt-sm"
                  filled
                  dense
                  hide-bottom-space
                  emit-value
                  map-options
                  multiple
                >
                  <template #selected-item="{ opt, index, removeAtIndex }">
                    <q-chip
                      color="dark-1"
                      square
                      :label="opt.name ?? opt"
                      :icon="opt.icon"
                      size="sm"
                      removable
                      @remove="removeAtIndex(index)"
                    ></q-chip>
                  </template>

                  <template #option="{ opt, toggleOption, selected }">
                    <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                      <q-item-section avatar>
                        <q-icon :name="opt.icon"></q-icon>
                      </q-item-section>

                      <q-item-section>
                        <q-item-label>
                          {{ opt.name }}
                        </q-item-label>

                        <q-item-label class="text--secondary">
                          {{ opt.parentName }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>

              <div class="col-12">
                <div>
                  {{ $t('common.ignored_roles') }}
                </div>

                <q-select
                  v-model="config.ignored.roles"
                  :options="guild.roles"
                  option-label="name"
                  option-value="id"
                  :disable="!config.active"
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
                      square
                      :label="opt.name ?? opt"
                      size="sm"
                      :style="`background: ${opt.color}`"
                      removable
                      @remove="removeAtIndex(index)"
                    ></q-chip>
                  </template>

                  <template #option="{ opt, toggleOption, selected }">
                    <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                      <q-item-section>
                        <q-item-label :style="`color: ${opt.color}`">{{ opt.name }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
            </div>
          </q-card-section>

          <div class="q-pa-md">
            <div>
              {{ $t('common.ignored_permissions') }}
            </div>
            <div class="text--secondary">
              {{ $t('automoder.ignored_permissions_description') }}
            </div>

            <q-list class="bg-dark-2 overflow-hidden rounded-borders q-mt-sm">
              <q-item
                v-for="permission in ignorablePermissions"
                :key="permission.key"
                tag="label"
                :disable="!config.active"
              >
                <q-item-section side>
                  <q-checkbox
                    v-model="config.ignored.permissions"
                    :val="permission.value"
                    :disable="!config.active"
                    dense
                  ></q-checkbox>
                </q-item-section>
                <q-item-section>
                  <q-item-label>
                    {{ $t(`common.permissions_keys.${permission.key}`) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-tab-panel>

        <q-tab-panel name="actions" class="q-pa-md" style="overflow-y: hidden">
          <q-list class="bg-dark-2 overflow-hidden rounded-borders">
            <q-item
              v-for="action in actions.filter(i => i.expandable === false)"
              tag="label"
              :key="action"
              :disable="!config.active || config.options.some(i => action.exclusive.includes(i))"
            >
              <q-item-section side>
                <q-checkbox
                  v-model="config.options"
                  :val="action.name"
                  :disable="!config.active || config.options.some(i => action.exclusive.includes(i))"
                  dense
                  @update:model-value="onSelectOption"
                ></q-checkbox>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ $t(`common.actions_keys.${action.name}`) }}
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-expansion-item
              v-for="action in actions.filter(i => typeof i.expandable === 'undefined')"
              :key="action"
              :disable="!config.active || config.options.some(i => action.exclusive.includes(i))"
            >
              <template #header>
                <q-item-section side>
                  <q-checkbox
                    v-model="config.options"
                    :val="action.name"
                    :disable="!config.active || config.options.some(i => action.exclusive.includes(i))"
                    dense
                    @update:model-value="onSelectOption"
                  ></q-checkbox>
                </q-item-section>

                <q-item-section>
                  <q-item-label>
                    {{ $t(`common.actions_keys.${action.name}`) }}
                  </q-item-label>
                </q-item-section>
              </template>

              <q-card v-if="action.name === 'ACTION_BAN'" class="bg-dark-1 no-border-radius" bordered>
                <q-card-section>
                  <div class="row q-col-gutter-md">
                    <div class="col-12">
                      <div>
                        {{ $t('automoder.penalty_timeout') }}
                      </div>

                      <q-select
                        v-if="config.options.includes('ACTION_BAN')"
                        v-model.number="config.ban_timeout"
                        :options="[
                          0, 300, 600, 900, 1800, 3600, 7200, 21600, 43200, 64800, 86400, 172800, 259200, 604800,
                          1209600
                        ]"
                        :disable="!config.active"
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
                          <q-item
                            clickable
                            @click="toggleOption(opt)"
                            :active="selected"
                            active-class="menu-item--active"
                          >
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

                      <q-select
                        v-else
                        disable
                        :label="
                          $dt
                            .now()
                            .plus({ seconds: 300 })
                            .toRelative({ unit: ['hours', 'minutes'], padding: 300 })
                        "
                        class="q-pt-sm"
                        filled
                        dense
                        hide-bottom-space
                      ></q-select>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <q-card v-if="action.name === 'ACTION_MUTE'" class="bg-dark-1 no-border-radius" bordered>
                <q-card-section>
                  <div class="row q-col-gutter-md">
                    <div class="col-12">
                      <div>
                        {{ $t('automoder.penalty_timeout') }}
                      </div>

                      <q-select
                        v-if="config.options.includes('ACTION_MUTE')"
                        v-model.number="config.mute_timeout"
                        :options="[
                          60, 120, 300, 600, 900, 1800, 3600, 7200, 21600, 43200, 64800, 86400, 172800, 259200, 604800,
                          1209600
                        ]"
                        :disable="!config.active"
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
                                    .toRelative({ unit: ['days', 'hours', 'minutes'], padding: 30000 })
                                }}
                              </q-item-label>
                            </q-item-section>
                          </q-item>
                        </template>
                      </q-select>

                      <q-select
                        v-else
                        disable
                        :label="
                          $dt
                            .now()
                            .plus({ seconds: 60 })
                            .toRelative({ unit: ['hours', 'minutes'], padding: 300 })
                        "
                        class="q-pt-sm"
                        filled
                        dense
                        hide-bottom-space
                      ></q-select>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <q-card v-if="action.name === 'ACTION_MODIFY_ROLES'" class="bg-dark-1 no-border-radius" bordered>
                <q-card-section>
                  <div class="row q-col-gutter-md">
                    <div class="col-12">
                      <div>
                        {{ $t('common.add_roles') }}
                      </div>

                      <q-select
                        v-model="config.modify_roles.add"
                        :options="guild.rolesUnmanaged"
                        option-label="name"
                        option-value="id"
                        :disable="!config.active || !config.options.includes('ACTION_MODIFY_ROLES')"
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
                            square
                            :label="opt.name ?? opt"
                            size="sm"
                            :style="`background: ${opt.color}`"
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
                        v-model="config.modify_roles.remove"
                        :options="guild.rolesUnmanaged"
                        option-label="name"
                        option-value="id"
                        :disable="!config.active || !config.options.includes('ACTION_MODIFY_ROLES')"
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
                            square
                            :label="opt.name ?? opt"
                            size="sm"
                            :style="`background: ${opt.color}`"
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
              </q-card>

              <q-card v-if="action.name === 'ACTION_SEND_MESSAGE'" class="bg-dark-1 no-border-radius" bordered>
                <q-card-section>
                  <div class="row q-col-gutter-md">
                    <div class="col-12">
                      <div>
                        {{ $t('pages.guild.gs_message_template_title') }}
                      </div>

                      <MessageEditor
                        :message="config.send_message"
                        :disable="!config.active || !config.options.includes('ACTION_SEND_MESSAGE')"
                        avlReplacers="message guild member"
                        class="q-pt-sm"
                      />
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </q-list>
        </q-tab-panel>
      </q-tab-panels>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-btn class="full-width" :label="$t('close')" unelevated no-caps color="dark-2" @click="onCancel" />
          </div>

          <div class="col-6">
            <q-btn class="full-width" :label="$t('done')" unelevated no-caps color="primary" @click="onConfirm" />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { useDialogPluginComponent } from 'quasar'
import { useGuildStore } from 'src/stores/guild'
import { defineComponent, ref } from 'vue'
import MessageEditor from '../MessageEditor.vue'

export default defineComponent({
  name: 'AutoModAntiCaps',

  emits: [...useDialogPluginComponent.emits],

  props: {
    name: {
      type: String,
      required: true
    }
  },

  components: {
    MessageEditor
  },

  setup(props) {
    const guild = useGuildStore()
    const config = ref(JSON.parse(JSON.stringify(guild.moderation.automoder.anti_caps)))

    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()
    const currentTab = ref('general')

    return {
      guild,
      config,
      dialogRef,
      currentTab,

      onConfirm() {
        onDialogOK({ name: props.name, config: { ...config.value } })
      },

      onCancel() {
        onDialogCancel()
      },

      onDismiss() {
        onDialogHide()
      }
    }
  },

  data() {
    return {
      ignorablePermissions: [
        { key: 'ADMINISTRATOR', value: 8 },
        { key: 'MANAGE_MESSAGES', value: 8192 },
        { key: 'MANAGE_ROLES', value: 268435456 }
      ],
      actions: [
        { name: 'ACTION_BAN', exclusive: ['ACTION_MUTE', 'ACTION_KICK', 'ACTION_MODIFY_ROLES'] },
        { name: 'ACTION_MUTE', exclusive: ['ACTION_BAN', 'ACTION_KICK'] },
        { name: 'ACTION_KICK', exclusive: ['ACTION_BAN', 'ACTION_MUTE', 'ACTION_MODIFY_ROLES'], expandable: false },
        { name: 'ACTION_WARN', exclusive: [], expandable: false },
        { name: 'ACTION_MODIFY_ROLES', exclusive: ['ACTION_BAN', 'ACTION_KICK'] },
        { name: 'ACTION_SEND_MESSAGE', exclusive: [] },
        { name: 'ACTION_DELETE_MESSAGE', exclusive: [], expandable: false }
      ]
    }
  },

  methods: {
    onSelectOption(options) {
      if (options.includes('ACTION_BAN') && !this.config.ban_timeout) {
        this.config.ban_timeout = 300
      }

      if (options.includes('ACTION_MUTE') && !this.config.mute_timeout) {
        this.config.mute_timeout = 60
      }

      if (!options.includes('ACTION_BAN')) {
        delete this.config.ban_timeout
      }

      if (!options.includes('ACTION_MUTE')) {
        delete this.config.mute_timeout
      }
    }
  }
})
</script>
