<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDismiss"
    transition-show="jump-down"
    transition-hide="jump-up"
    backdrop-filter="blur(8px)"
    :maximized="$q.screen.lt.sm"
  >
    <q-card class="q-dialog-card q-dialog-card-md bg-dark-1" flat>
      <q-card-section class="q-dialog-card-content">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('Common.AddRoles') }}
              </div>

              <q-select
                v-model="award.references"
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
                v-model="award.remove_references"
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
                :max-values="5"
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

        <div class="q-pa-md">
          <q-list class="bg-dark-2 overflow-hidden rounded-borders">
            <q-expansion-item :model-value="true">
              <template #header>
                <q-item-section>
                  <q-item-label>
                    {{ $t('Components.LevelAward.AwardConditions') }}
                  </q-item-label>
                </q-item-section>
              </template>

              <q-card class="bg-dark-1 no-border-radius" bordered>
                <q-card-section>
                  <div class="row q-col-gutter-md">
                    <div class="col-12">
                      <div>
                        {{ $t('Components.LevelAward.RequiredLevel') }}
                      </div>

                      <q-input
                        v-model.number="award.conditions.level"
                        class="q-pt-sm"
                        type="number"
                        filled
                        dense
                        hide-bottom-space
                        @update:model-value="onChangeLevel"
                      >
                        <template #append>
                          <q-icon
                            :name="award.conditions.level > 0 ? 'radio_button_checked' : 'radio_button_unchecked'"
                            :color="award.conditions.level > 0 ? 'primary' : ''"
                          ></q-icon>
                        </template>
                      </q-input>
                    </div>

                    <div class="col-12">
                      <div>
                        {{ $t('Components.LevelAward.RequiredVoiceTime') }}
                      </div>

                      <q-input
                        v-model.trim="awardVoiceTime"
                        class="q-pt-sm"
                        mask="#:##:##"
                        fill-mask
                        reverse-fill-mask
                        filled
                        dense
                        hide-bottom-space
                        @update:model-value="onChangeVoiceTime"
                      >
                        <template #append>
                          <q-icon
                            :name="award.conditions.voice_time > 0 ? 'radio_button_checked' : 'radio_button_unchecked'"
                            :color="award.conditions.voice_time > 0 ? 'primary' : ''"
                          ></q-icon>
                        </template>
                      </q-input>
                    </div>

                    <div class="col-12">
                      <div>
                        {{ $t('Components.LevelAward.RequiredNumberOfSentMessages') }}
                      </div>

                      <q-input
                        v-model.number="award.conditions.sent_messages"
                        class="q-pt-sm"
                        type="number"
                        filled
                        dense
                        hide-bottom-space
                        @update:model-value="onChangeSentMessages"
                      >
                        <template #append>
                          <q-icon
                            :name="
                              award.conditions.sent_messages > 0 ? 'radio_button_checked' : 'radio_button_unchecked'
                            "
                            :color="award.conditions.sent_messages > 0 ? 'primary' : ''"
                          ></q-icon>
                        </template>
                      </q-input>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </q-expansion-item>

            <q-expansion-item tag="label">
              <template #header>
                <q-item-section side>
                  <q-checkbox v-model="award.alert.active" dense></q-checkbox>
                </q-item-section>

                <q-item-section>
                  <q-item-label>
                    {{ $t('Components.LevelAward.AwardMessage') }}
                  </q-item-label>
                </q-item-section>
              </template>

              <q-card class="bg-dark-1 no-border-radius" bordered>
                <q-card-section>
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-6">
                      <div>
                        {{ $t('Pages.GuildPage.GeneralSettings.MessageFormat') }}
                      </div>

                      <q-select
                        v-model="award.alert.format"
                        :options="['DM', 'CHANNEL']"
                        :disable="!award.alert.active"
                        class="q-pt-sm"
                        filled
                        dense
                        hide-bottom-space
                      >
                        <template #selected-item="{ opt }">
                          <span>
                            {{ $t(localeStringsMap.messageFormats[opt]) }}
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
                                {{ $t(localeStringsMap.messageFormats[opt]) }}
                              </q-item-label>
                            </q-item-section>
                          </q-item>
                        </template>
                      </q-select>
                    </div>

                    <div class="col-12 col-md-6">
                      <div>
                        {{ $t('Pages.GuildPage.GeneralSettings.ChannelForMessages') }}
                      </div>

                      <q-select
                        v-model="award.alert.channel_id"
                        :options="guild.channelsText"
                        option-label="name"
                        option-value="id"
                        :disable="!award.alert.active || award.alert.format !== 'CHANNEL'"
                        class="q-pt-sm"
                        filled
                        dense
                        hide-bottom-space
                        emit-value
                        map-options
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
                    </div>

                    <div class="col-12">
                      <div>
                        {{ $t('Pages.GuildPage.GeneralSettings.MessageTemplate') }}
                      </div>

                      <MessageEditor
                        :message="award.alert.message"
                        :disable="!award.alert.active"
                        avlReplacers="guild member"
                        class="q-pt-sm"
                      />
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
          <q-btn
            v-if="mode === 'CREATE'"
            class="full-width"
            :label="$t('Common.Add')"
            :disable="!isValid"
            unelevated
            no-caps
            color="primary"
            @click="onConfirm"
          />
          <q-btn-dropdown
            v-if="mode === 'UPDATE'"
            class="full-width"
            :label="$t('Common.Done')"
            :disable="!isValid"
            split
            unelevated
            no-caps
            color="primary"
            @click="onConfirm"
          >
            <q-list>
              <q-item clickable v-close-popup @click="onDelete">
                <q-item-section class="text-negative">
                  <q-item-label>
                    {{ $t('Common.Delete') }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
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
import numbro from 'numbro'
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { useGuildStore } from 'src/stores/guild'
import { localeStringsMap } from 'src/utils/Constants'
import { hmsToMS, suid } from 'src/utils/Utils'
import { computed, ref } from 'vue'
import MessageEditor from '../MessageEditor.vue'

defineEmits(useDialogPluginComponent.emits)
const props = defineProps({
  awardProp: {
    type: Object,
    default: null
  }
})

const $q = useQuasar(),
  { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

const guild = useGuildStore()

const mode = ref(props.awardProp ? 'UPDATE' : 'CREATE')
const award = ref({
    id: suid(6),
    type: 'ROLE',
    level: 1,
    references: [],
    remove_references: [],
    alert: {
      active: false,
      format: 'DM',
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
    },
    conditions: {
      level: 1,
      voice_time: 0,
      sent_messages: 0
    },
    ...JSON.parse(JSON.stringify(props.awardProp))
  }),
  awardVoiceTime = ref(numbro(award.value.conditions.voice_time).format({ output: 'time' })),
  isValid = computed(() => {
    return (
      award.value.references.length &&
      (award.value.conditions.level > 0 ||
        award.value.conditions.voice_time > 0 ||
        award.value.conditions.sent_messages > 0)
    )
  })

const onChangeLevel = value => {
  if (isNaN(value) || value <= 0) value = 0
  if (value >= 2500) value = 2500

  award.value.conditions.level = value
}

const onChangeVoiceTime = value => {
  let ms = hmsToMS(value)

  if (isNaN(ms) || ms <= 0) ms = 0
  if (ms >= Number.MAX_SAFE_INTEGER) ms = Number.MAX_SAFE_INTEGER

  award.value.conditions.voice_time = ms / 1000
}

const onChangeSentMessages = value => {
  if (isNaN(value) || value <= 0) value = 0
  if (value >= Math.pow(2, 31) - 1) value = Math.pow(2, 31) - 1

  award.value.conditions.sent_messages = value
}

const onConfirm = () => {
    if (isValid.value) {
      onDialogOK({ mode: mode.value, award: award.value })
    }
  },
  onCancel = () => {
    onDialogCancel()
  },
  onDismiss = () => {
    onDialogHide()
  },
  onDelete = () => {
    onDialogOK({ mode: 'DELETE', award: award.value })
  }
</script>
