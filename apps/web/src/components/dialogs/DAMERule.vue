<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDismiss"
    transition-show="jump-down"
    transition-hide="jump-up"
    backdrop-filter="blur(8px)"
    :maximized="$q.screen.lt.sm"
  >
    <q-card class="q-dialog-card bg-dark-1" flat>
      <q-card-section class="q-dialog-card-content">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 hidden">
              <q-file
                v-model="dameRuleFile"
                ref="dameRuleFileInput"
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

              <q-input v-model.trim="dameRule.name" class="q-pt-sm" :maxlength="100" filled dense hide-bottom-space>
                <template #prepend>
                  <q-toggle v-model="dameRule.enabled" dense></q-toggle>
                </template>
              </q-input>
            </div>

            <div class="col-12">
              <div>
                {{ $t('Components.Automation.Trigger') }}
              </div>

              <q-select
                v-model="dameRule.trigger_type"
                :options="[1, 3, 4, 5, 6]"
                class="q-pt-sm"
                filled
                dense
                hide-bottom-space
                emit-value
                map-options
                @update:model-value="onChangeTriggerType"
              >
                <template #option="{ opt, toggleOption, selected }">
                  <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                    <q-item-section>
                      <q-item-label>
                        {{ $t(localeStringsMap.dameTriggers[opt]) }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>

                <template #selected-item="{ opt }">
                  <span>
                    {{ $t(localeStringsMap.dameTriggers[opt]) }}
                  </span>
                </template>
              </q-select>
            </div>
          </div>
        </q-card-section>

        <q-card-section v-if="dameRuleTriggerType !== 'Spam'">
          <div class="row q-col-gutter-md">
            <div v-if="dameRuleTriggerType === 'Keyword' || dameRuleTriggerType === 'MemberProfile'" class="col-12">
              <div>
                {{ $t('Pages.GuildPage.Moderation.DAMEKeywordFilter') }}
              </div>

              <q-select
                v-model="dameRule.trigger_metadata.keyword_filter"
                class="q-pt-sm"
                filled
                dense
                hide-bottom-space
                hide-dropdown-icon
                use-input
                use-chips
                new-value-mode="add-unique"
                multiple
              >
                <template #selected-item="{ index, opt, removeAtIndex }">
                  <q-chip
                    color="dark-1"
                    square
                    :label="opt"
                    size="sm"
                    removable
                    @remove="removeAtIndex(index)"
                  ></q-chip>
                </template>
              </q-select>
            </div>

            <div v-if="dameRuleTriggerType === 'Keyword' || dameRuleTriggerType === 'MemberProfile'" class="col-12">
              <div>
                {{ $t('Pages.GuildPage.Moderation.DAMERegexPatterns') }}
              </div>

              <div class="text--secondary">
                {{ $t('Pages.GuildPage.Moderation.DAMERegexPatternsDescription') }}
              </div>

              <q-select
                v-model="dameRule.trigger_metadata.regex_patterns"
                class="q-pt-sm"
                filled
                dense
                hide-bottom-space
                hide-dropdown-icon
                use-input
                use-chips
                new-value-mode="add-unique"
                multiple
              >
                <template #selected-item="{ index, opt, removeAtIndex }">
                  <q-chip
                    color="dark-1"
                    square
                    :label="opt"
                    size="sm"
                    removable
                    @remove="removeAtIndex(index)"
                  ></q-chip>
                </template>
              </q-select>
            </div>

            <div v-if="dameRuleTriggerType === 'KeywordPreset'" class="col-12">
              <div>
                {{ $t('Pages.GuildPage.Moderation.DAMEKeywordPresets') }}
              </div>

              <q-list class="bg-dark-2 overflow-hidden rounded-borders q-mt-sm">
                <q-item tag="label">
                  <q-item-section side>
                    <q-checkbox v-model="dameRule.trigger_metadata.presets" :val="1" dense></q-checkbox>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label>
                      {{ $t('Pages.GuildPage.Moderation.DAMEKeywordPresetsProfanity') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item tag="label">
                  <q-item-section side>
                    <q-checkbox v-model="dameRule.trigger_metadata.presets" :val="2" dense></q-checkbox>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label>
                      {{ $t('Pages.GuildPage.Moderation.DAMEKeywordPresetsSexualContent') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <q-item tag="label">
                  <q-item-section side>
                    <q-checkbox v-model="dameRule.trigger_metadata.presets" :val="3" dense></q-checkbox>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label>
                      {{ $t('Pages.GuildPage.Moderation.DAMEKeywordPresetsSlurs') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <div
              v-if="
                dameRuleTriggerType === 'Keyword' ||
                dameRuleTriggerType === 'MemberProfile' ||
                dameRuleTriggerType === 'KeywordPreset'
              "
              class="col-12"
            >
              <div>
                {{ $t('Pages.GuildPage.Moderation.DAMEAllowList') }}
              </div>

              <q-select
                v-model="dameRule.trigger_metadata.allow_list"
                class="q-pt-sm"
                filled
                dense
                hide-bottom-space
                hide-dropdown-icon
                use-input
                use-chips
                new-value-mode="add-unique"
                multiple
              >
                <template #selected-item="{ index, opt, removeAtIndex }">
                  <q-chip
                    color="dark-1"
                    square
                    :label="opt"
                    size="sm"
                    removable
                    @remove="removeAtIndex(index)"
                  ></q-chip>
                </template>
              </q-select>
            </div>

            <div v-if="dameRuleTriggerType === 'MentionSpam'" class="col-12">
              <div>
                {{ $t('Pages.GuildPage.Moderation.DAMEMentionSpamNumberOfUniqueMentions') }}
              </div>

              <q-slider
                v-model.number="dameRule.trigger_metadata.mention_total_limit"
                class="q-pt-sm"
                :min="1"
                :max="50"
                snap
                label
                :label-value="dameRule.trigger_metadata.mention_total_limit"
              ></q-slider>
            </div>

            <div v-if="dameRuleTriggerType === 'MentionSpam'" class="col-12">
              <q-list class="bg-dark-2 overflow-hidden rounded-borders q-mt-sm">
                <q-item tag="label">
                  <q-item-section side>
                    <q-checkbox v-model="dameRule.trigger_metadata.mention_raid_protection_enabled" dense></q-checkbox>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label>
                      {{ $t('Pages.GuildPage.Moderation.DAMEMentionSpamMentionRaidProtectionEnabled') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>
        </q-card-section>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-btn-dropdown
                class="full-width"
                :label="$t('Components.CustomCommand.AddAction')"
                color="dark-2"
                no-caps
                unelevated
              >
                <q-list>
                  <q-item
                    v-for="(action, i) in triggerActions"
                    :key="i"
                    clickable
                    v-close-popup
                    @click="dameRule.actions.push({ type: action.type, metadata: action.metadata })"
                  >
                    <q-item-section>
                      <q-item-label>
                        {{ $t(localeStringsMap.dameActions[action.type]) }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
            </div>

            <div class="col-12">
              <q-list v-if="dameRule.actions.length" class="bg-dark-2 overflow-hidden rounded-borders q-mt-sm">
                <q-expansion-item
                  v-for="(action, i) in dameRule.actions"
                  :key="action.type"
                  header-class="q-pa-md"
                  clickable
                >
                  <template #header>
                    <q-item-section side>
                      <q-avatar rounded color="dark-3" :icon="getActionIcon(action.type)" />
                    </q-item-section>

                    <q-item-section>
                      <q-item-label>
                        {{ $t(localeStringsMap.dameActions[action.type]) }}
                      </q-item-label>
                    </q-item-section>
                  </template>

                  <q-card class="bg-dark-1 no-border-radius" bordered>
                    <q-card-section v-if="action.type === 1">
                      <div>
                        {{ $t('Pages.GuildPage.Moderation.DAMEBlockMessageCustomMessage') }}
                      </div>

                      <div class="text--secondary">
                        {{ $t('Pages.GuildPage.Moderation.DAMEBlockMessageCustomMessageDescription') }}
                      </div>

                      <q-input
                        v-model.trim="action.metadata.custom_message"
                        class="q-pt-sm"
                        :maxlength="150"
                        filled
                        dense
                        hide-bottom-space
                      ></q-input>
                    </q-card-section>

                    <q-card-section v-if="action.type === 2">
                      <div>
                        {{ $t('Pages.GuildPage.Moderation.AIModInfoChannel') }}
                      </div>

                      <div class="text--secondary">
                        {{ $t('Pages.GuildPage.Moderation.AIModInfoChannelDescription') }}
                      </div>

                      <q-select
                        v-model="action.metadata.channel_id"
                        :options="guild.channelsText"
                        option-label="name"
                        option-value="id"
                        class="q-pt-sm"
                        filled
                        dense
                        hide-bottom-space
                        emit-value
                        map-options
                        clearable
                      >
                        <template #selected-item="{ opt }">
                          <q-chip color="dark-1" square :label="opt.name ?? opt" :icon="opt.icon" size="sm"></q-chip>
                        </template>

                        <template #option="{ opt, toggleOption, selected }">
                          <q-item
                            clickable
                            @click="toggleOption(opt)"
                            :active="selected"
                            active-class="menu-item--active"
                          >
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
                    </q-card-section>

                    <q-card-section v-if="action.type === 3">
                      <div>
                        {{ $t('Commands.MuteCommand.Options.Duration.Description') }}
                      </div>

                      <q-input
                        v-model.number="action.metadata.duration_seconds"
                        :shadow-text="` ${pluralTime(action.metadata.duration_seconds, 'second')}`"
                        class="q-pt-sm"
                        type="number"
                        filled
                        dense
                        hide-bottom-space
                        @blur="
                          () => {
                            const value = frameNumber(action.metadata.duration_seconds, 60, 28 * 24 * 60 * 60)
                            action.metadata.duration_seconds = value
                          }
                        "
                      ></q-input>
                    </q-card-section>

                    <q-card-section v-if="action.type === 101">
                      <div>
                        {{ $t('Commands.BanCommand.Options.Duration.Description') }}
                      </div>

                      <q-input
                        v-model.number="action.metadata.duration_seconds"
                        :shadow-text="getBanActionShadowText(action.metadata.duration_seconds)"
                        class="q-pt-sm"
                        type="number"
                        filled
                        dense
                        hide-bottom-space
                        @blur="
                          () => {
                            const value = frameNumber(action.metadata.duration_seconds, 0, 2 * 365 * 24 * 60 * 60)
                            action.metadata.duration_seconds = value
                          }
                        "
                      ></q-input>
                    </q-card-section>

                    <q-card-section v-if="action.type === 104">
                      <div class="row q-col-gutter-md">
                        <div class="col-12">
                          <div>
                            {{ $t('Common.AddRoles') }}
                          </div>

                          <q-select
                            v-model="action.metadata.add_roles"
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
                            {{ $t('Common.RemoveRoles') }}
                          </div>

                          <q-select
                            v-model="action.metadata.remove_roles"
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

                    <q-card-section v-if="action.type === 105">
                      <div>
                        {{ $t('Pages.GuildPage.GeneralSettings.MessageTemplate') }}
                      </div>

                      <MessageEditor :message="action.metadata.message" avlReplacers="guild member" class="q-pt-sm" />
                    </q-card-section>

                    <q-card-actions class="q-pa-md" align="right">
                      <q-btn
                        :disable="
                          action.type === 4 ||
                          (isDAMAction(action.type) && dameRule.actions.filter(v => v.type < 101).length < 2)
                        "
                        color="negative"
                        flat
                        icon="delete"
                        no-caps
                        unelevated
                        @click="dameRule.actions.splice(i, 1)"
                      ></q-btn>
                    </q-card-actions>
                  </q-card>
                </q-expansion-item>
              </q-list>
            </div>
          </div>
        </q-card-section>

        <div class="q-pa-md">
          <q-list class="bg-dark-2 overflow-hidden rounded-borders">
            <q-expansion-item expand-separator :label="$t('Common.Exceptions')">
              <q-card class="bg-dark-1 no-border-radius" bordered>
                <q-card-section>
                  <div class="row q-col-gutter-md">
                    <div class="col-12">
                      <div>
                        {{ $t('Common.IgnoredChannels') }}
                      </div>

                      <q-select
                        v-model="dameRule.exempt_channels"
                        :options="guild.channels"
                        option-label="name"
                        option-value="id"
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
                          <q-item
                            clickable
                            @click="toggleOption(opt)"
                            :active="selected"
                            active-class="menu-item--active"
                          >
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
                        {{ $t('Common.IgnoredRoles') }}
                      </div>

                      <q-select
                        v-model="dameRule.exempt_roles"
                        :options="guild.roles"
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
            </q-expansion-item>
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
              <q-item clickable v-close-popup @click="dameRuleFileInput.pickFiles()" :disable="confirmLoading">
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
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { interfaces } from 'src/boot/axios'
import { useGuildStore } from 'src/stores/guild'
import { localeStringsMap } from 'src/utils/Constants'
import { validateDAMERule } from 'src/utils/JSONValidation/ValidateDAMERule'
import { frameNumber, handleAxiosError, pluralTime } from 'src/utils/Utils'
import { computed, ref } from 'vue'
import { event } from 'vue-gtag'
import { useI18n } from 'vue-i18n'
import MessageEditor from '../MessageEditor.vue'

defineEmits(useDialogPluginComponent.emits)
const props = defineProps({
  dameRuleProp: {
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
const i18n = useI18n()

const guild = useGuildStore()
const mode = ref(props.modeProp ?? (props.dameRuleProp ? 'UPDATE' : 'CREATE'))
const dameRule = ref({
  name: 'AutoMod Rule',
  event_type: 1,
  trigger_type: 1,
  trigger_metadata: {
    keyword_filter: [],
    regex_patterns: [],
    allow_list: []
  },
  actions: [
    {
      type: 1,
      metadata: {
        custom_message: null
      }
    }
  ],
  enabled: true,
  exempt_roles: [],
  exempt_channels: [],
  ...JSON.parse(JSON.stringify(props.dameRuleProp))
})
const dameRuleFile = ref(null),
  dameRuleFileInput = ref(null)

const confirmLoading = ref(false)
const dameRuleTriggerType = computed(() => {
  if (dameRule.value.trigger_type === 1) return 'Keyword'
  if (dameRule.value.trigger_type === 3) return 'Spam'
  if (dameRule.value.trigger_type === 4) return 'KeywordPreset'
  if (dameRule.value.trigger_type === 5) return 'MentionSpam'
  if (dameRule.value.trigger_type === 6) return 'MemberProfile'
  return 'Unknown'
})

const onChangeTriggerType = value => {
  if (value === 6) {
    dameRule.value.event_type = 2
  } else {
    dameRule.value.event_type = 1
  }

  if (value === 1 || value === 6) {
    dameRule.value.trigger_metadata = {
      keyword_filter: [],
      regex_patterns: [],
      allow_list: []
    }
  } else if (value === 3) {
    dameRule.value.trigger_metadata = {}
  } else if (value === 4) {
    dameRule.value.trigger_metadata = {
      presets: [2],
      allow_list: []
    }
  } else if (value === 5) {
    dameRule.value.trigger_metadata = {
      mention_total_limit: 5,
      mention_raid_protection_enabled: false
    }
  }

  if (value === 1 || value === 3 || value === 4 || value === 5) {
    dameRule.value.actions = [
      {
        type: 1,
        metadata: {
          custom_message: null
        }
      }
    ]
  } else if (value === 6) {
    dameRule.value.actions = [
      {
        type: 4,
        metadata: {}
      }
    ]
  }
}

const actions = [
    {
      type: 1,
      metadata: {
        custom_message: null
      },
      excluded_triggers: ['MemberProfile'],
      excluded_actions: []
    },
    {
      type: 2,
      metadata: {
        channel_id: null
      },
      excluded_triggers: [],
      excluded_actions: []
    },
    {
      type: 3,
      metadata: {
        duration_seconds: 60
      },
      excluded_triggers: ['KeywordPreset', 'MemberProfile'],
      excluded_actions: [101, 102]
    },
    {
      type: 101,
      metadata: {
        duration_seconds: 0
      },
      excluded_triggers: [],
      excluded_actions: [3, 102]
    },
    {
      type: 102,
      metadata: {},
      excluded_triggers: [],
      excluded_actions: [3, 101]
    },
    {
      type: 103,
      metadata: {},
      excluded_triggers: [],
      excluded_actions: [101, 102]
    },
    {
      type: 104,
      metadata: {
        add_roles: [],
        remove_roles: []
      },
      excluded_triggers: [],
      excluded_actions: [101, 102]
    },
    {
      type: 105,
      metadata: {
        message: {
          content: null,
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
      },
      excluded_triggers: [],
      excluded_actions: []
    }
  ],
  triggerActions = computed(() => {
    return actions.filter(v => {
      if (v.excluded_triggers.includes(dameRuleTriggerType.value)) return false
      if (v.excluded_actions.some(vv => dameRule.value.actions.some(vvv => vv === vvv.type))) return false
      if (dameRule.value.actions.some(vv => v.type === vv.type)) return false
      return true
    })
  })

const getActionIcon = type => {
  if (type === 1) return 'r_front_hand'
  if (type === 2) return 'r_notifications'
  if (type === 3) return 'r_schedule'
  if (type === 4) return 'r_remove_circle_outline'
  if (type === 101) return 'r_block'
  if (type === 102) return 'r_person_off'
  if (type === 103) return 'r_priority_high'
  if (type === 104) return 'r_local_offer'
  if (type === 105) return 'r_send'
  return 'r_question_mark'
}
const getBanActionShadowText = value => {
  let text = ` ${pluralTime(value, 'second')}`
  if (value === 0) text += ` (${i18n.t('Common.Indefinitely').toLowerCase()})`
  return text
}
const isDAMAction = type => {
  return type === 1 || type === 2 || type === 3 || type === 4
}

const onConfirm = async () => {
    try {
      confirmLoading.value = true

      const response =
        mode.value === 'CREATE'
          ? await interfaces.guilds.createDAMERule(guild._id, dameRule.value)
          : await interfaces.guilds.updateDAMERule(guild._id, dameRule.value.id, dameRule.value)

      onDialogOK({ mode: mode.value, dameRule: response.data })
    } catch (err) {
      const error = handleAxiosError(err)

      $q.notify({
        message: error.message,
        classes: 'q-notification-custom',
        color: 'black',
        icon: 'error',
        iconColor: 'negative',
        timeout: 5000
      })
    } finally {
      confirmLoading.value = false
    }
  },
  onCancel = onDialogCancel,
  onDismiss = onDialogHide,
  onDelete = async () => {
    try {
      confirmLoading.value = true

      await interfaces.guilds.deleteDAMERule(guild._id, dameRule.value.id)
      onDialogOK({ mode: 'DELETE', dameRule: dameRule.value })
    } catch (err) {
      const error = handleAxiosError(err)

      $q.notify({
        message: error.message,
        classes: 'q-notification-custom',
        color: 'black',
        icon: 'error',
        iconColor: 'negative',
        timeout: 5000
      })
    } finally {
      confirmLoading.value = false
    }
  },
  onImport = file => {
    const reader = new FileReader()

    reader.onload = e => {
      let json

      try {
        json = JSON.parse(e.target.result)
      } catch (err) {
        json = null
      }

      event('import_dame_rule', { event_category: 'utility' })
      dameRule.value = validateDAMERule(json)
    }

    reader.readAsText(file)
  },
  onExport = () => {
    if (mode.value !== 'UPDATE') return

    const data = JSON.stringify(dameRule.value)
    const link = document.createElement('a')

    link.style.display = 'none'
    link.setAttribute('href', `data:application/json;charset=utf-8,${encodeURIComponent(data)}`)
    link.setAttribute('download', `${dameRule.value.id}.json`)

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    event('export_dame_rule', { event_category: 'utility' })
  }
</script>
