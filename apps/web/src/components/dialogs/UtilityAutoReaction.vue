<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="bg-dark-1" flat style="width: 800px; max-width: 90vw">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('Commands.OptionTypes.Channel') }}
            </div>

            <q-select
              v-if="mode === 'CREATE'"
              v-model="autoReaction.channel_id"
              :options="unusedTextChannels"
              option-label="name"
              option-value="id"
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

            <q-select
              v-if="mode === 'UPDATE'"
              :model-value="autoReaction.channel_id"
              :options="guild.channelsText"
              option-label="name"
              option-value="id"
              class="q-pt-sm"
              filled
              dense
              hide-bottom-space
              emit-value
              map-options
              disable
              readonly
            >
              <template #selected-item="{ opt }">
                <q-chip color="dark-1" square :label="opt.name ?? opt" :icon="opt.icon" size="sm"></q-chip>
              </template>
            </q-select>
          </div>

          <div class="col-12">
            <div>
              {{ $t('Common.Reactions') }}
            </div>
            <div class="text--secondary">
              {{ $t('Components.AutoReaction.ReactionsDescription') }}
            </div>

            <div class="row q-col-gutter-sm q-pt-sm">
              <div class="col-auto" v-for="(reaction, i) in autoReaction.reactions" :key="i">
                <q-chip
                  class="full-width"
                  color="dark-2"
                  square
                  :label="reaction.id ? `:${reaction.name}:` : reaction.name"
                  removable
                  @remove="autoReaction.reactions.splice(i, 1)"
                ></q-chip>
              </div>

              <div v-if="autoReaction.reactions.length < 10" class="col-auto">
                <q-chip
                  class="dashed-border no-shadow full-width"
                  outline
                  square
                  clickable
                  @click="emojiPickerModal = true"
                >
                  <q-icon name="add" size="24px"></q-icon>
                </q-chip>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('Components.AutoReaction.MessageTypes') }}
            </div>
            <div class="text--secondary">
              {{ $t('Components.AutoReaction.MessageTypesDescription') }}
            </div>

            <q-select
              v-model="autoReaction.message_types"
              :options="[
                'DEFAULT',
                'CHANNEL_PINNED_MESSAGE',
                'GUILD_MEMBER_JOIN',
                'USER_PREMIUM_GUILD_SUBSCRIPTION',
                'USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_1',
                'USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_2',
                'USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_3',
                'CHANNEL_FOLLOW_ADD',
                'THREAD_CREATED',
                'REPLY'
              ]"
              class="q-pt-sm"
              filled
              dense
              hide-bottom-space
              multiple
              map-options
            >
              <template #selected>
                <span>{{
                  autoReaction.message_types.map(i => $t(localeStringsMap.discordMessageTypes[i])).join(', ')
                }}</span>
              </template>

              <template #option="{ opt, toggleOption, selected }">
                <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                  <q-item-section>
                    <q-item-label>
                      {{ $t(localeStringsMap.discordMessageTypes[opt]) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div class="col-12">
            <div>
              {{ $t('Components.AutoReaction.TextMatches') }}
            </div>
            <div class="text--secondary">
              {{ $t('Components.AutoReaction.TextMatchesDescription') }}
            </div>

            <q-select
              v-model="autoReaction.matches"
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
              <template #selected-item="{ opt, index, removeAtIndex }">
                <q-chip color="dark-1" square :label="opt" size="sm" removable @remove="removeAtIndex(index)"></q-chip>
              </template>
            </q-select>
          </div>

          <div class="col-12">
            <div>
              {{ $t('Components.AutoReaction.ExcludedTextMatches') }}
            </div>
            <div class="text--secondary">
              {{ $t('Components.AutoReaction.ExcludedTextMatchesDescription') }}
            </div>

            <q-select
              v-model="autoReaction.exclude_matches"
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
              <template #selected-item="{ opt, index, removeAtIndex }">
                <q-chip color="dark-1" square :label="opt" size="sm" removable @remove="removeAtIndex(index)"></q-chip>
              </template>
            </q-select>
          </div>
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-btn class="full-width" :label="$t('Common.Close')" unelevated no-caps color="dark-2" @click="onCancel" />
          </div>

          <div class="col-6">
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
              <q-list dense>
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
        </div>
      </q-card-section>
    </q-card>

    <q-dialog v-model="emojiPickerModal" transition-show="jump-down" transition-hide="jump-up">
      <q-card style="max-width: 380px">
        <emoji-picker
          :data="guild.emojiIndex"
          @select="onSelectEmoji"
          set="twitter"
          :show-preview="false"
          :i18n="$getEmojiPickerI18n()"
        ></emoji-picker>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script>
import { useDialogPluginComponent } from 'quasar'
import { useGuildStore } from 'src/stores/guild'
import { localeStringsMap } from 'src/utils/Constants'
import { parseEmoji } from 'src/utils/Utils'
import { computed, defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'UtilityAutoReaction',

  emits: [...useDialogPluginComponent.emits],

  props: {
    autoReactionProp: {
      type: Object,
      default: null
    }
  },

  setup(props) {
    const guild = useGuildStore()
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const mode = ref(props.autoReactionProp ? 'UPDATE' : 'CREATE')
    const autoReaction = ref(
      mode.value === 'UPDATE'
        ? JSON.parse(JSON.stringify(props.autoReactionProp))
        : {
            channel_id: null,
            reactions: [],
            message_types: [],
            matches: [],
            exclude_matches: []
          }
    )

    const emojiPickerModal = ref(false)

    const isValid = computed(() => {
      return autoReaction.value.channel_id && autoReaction.value.reactions.length
    })

    const unusedTextChannels = computed(() => {
      return guild.channelsText.filter(i => !guild.modules.autoreactions.some(j => j.channel_id === i.id))
    })

    return {
      guild,
      dialogRef,
      mode,
      autoReaction,

      emojiPickerModal,
      isValid,
      unusedTextChannels,
      localeStringsMap,

      onConfirm() {
        if (isValid.value) {
          onDialogOK({ mode: mode.value, autoReaction: autoReaction.value })
        }
      },

      onCancel() {
        onDialogCancel()
      },

      onDismiss() {
        onDialogHide()
      },

      onDelete() {
        onDialogOK({ mode: 'DELETE', autoReaction: autoReaction.value })
      }
    }
  },

  methods: {
    onSelectEmoji(emoji) {
      emoji = parseEmoji(emoji.custom ? emoji.emoticons[0] : emoji.native)

      if (!this.autoReaction.reactions.includes(emoji)) this.autoReaction.reactions.push(emoji)
      if (this.autoReaction.reactions.length > 10) this.autoReaction.reactions.pop()

      this.emojiPickerModal = false
    }
  }
})
</script>
