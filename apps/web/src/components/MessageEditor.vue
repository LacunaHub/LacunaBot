<template>
  <!-- eslint-disable vue/no-deprecated-slot-attribute -->
  <!-- eslint-disable vue/no-mutating-props -->
  <div>
    <q-toolbar class="bg-dark-2 rounded-t-lg">
      <q-btn
        v-model="currentView"
        @click="switchView('CONTENT')"
        :disable="disable"
        class="q-mr-xs"
        icon="notes"
        :color="currentView === 'CONTENT' ? 'secondary' : ''"
        unelevated
        dense
      ></q-btn>
      <q-btn
        v-if="withEmbed"
        v-model="currentView"
        @click="switchView('EMBED')"
        :disable="disable"
        class="q-mr-xs"
        icon="table_chart"
        :color="currentView === 'EMBED' ? 'secondary' : ''"
        unelevated
        dense
      ></q-btn>
      <q-btn
        v-if="withImage"
        v-model="currentView"
        @click="switchView('IMAGE')"
        :disable="disable"
        class="q-mr-xs"
        icon="image"
        :color="currentView === 'IMAGE' ? 'secondary' : ''"
        unelevated
        dense
      ></q-btn>
      <q-btn
        v-if="withComponents"
        v-model="currentView"
        @click="switchView('COMPONENTS')"
        :disable="disable"
        class="q-mr-xs"
        icon="table_rows"
        :color="currentView === 'COMPONENTS' ? 'secondary' : ''"
        unelevated
        dense
      ></q-btn>
      <q-btn
        v-if="!disablePreview"
        v-model="currentView"
        @click="switchView('PREVIEW')"
        :disable="disable"
        class="q-mr-xs"
        icon="visibility"
        :color="currentView === 'PREVIEW' ? 'secondary' : ''"
        unelevated
        dense
      ></q-btn>

      <q-space></q-space>

      <q-btn
        v-if="!hideReplacers"
        :disable="disable"
        @click="modalReplacers = true"
        class="q-ml-xs"
        icon="data_object"
        flat
        dense
      ></q-btn>
      <q-btn :disable="disable" @click="modalMentions = true" class="q-ml-xs" icon="alternate_email" flat dense></q-btn>
      <q-btn
        :disable="disable"
        @click="modalEmojiPicker = true"
        class="q-ml-xs"
        icon="emoji_emotions"
        flat
        dense
      ></q-btn>
    </q-toolbar>

    <q-separator class="bg-dark-1"></q-separator>

    <transition-group enter-active-class="animated fadeInUp">
      <q-input
        v-if="currentView === 'CONTENT'"
        key="CONTENT"
        v-model.trim="message.content"
        :disable="disable"
        class="rounded-b-lg"
        type="textarea"
        :maxlength="2000"
        filled
        hide-bottom-space
      ></q-input>

      <q-card v-if="currentView === 'EMBED'" key="EMBED" class="bg-transparent rounded-b-lg" bordered flat>
        <div
          class="absolute-left cursor-pointer"
          :style="`background: ${messageEmbed.color || 'black'}; width: 8px; border-radius: 0 0 0 16px`"
        >
          <q-popup-proxy anchor="center middle">
            <q-color v-model="messageEmbed.color" class="bg-dark-2" flat no-header-tabs format-model="hex"></q-color>
          </q-popup-proxy>
        </div>

        <div class="q-pa-md q-ml-sm">
          <q-list class="bg-dark-2 overflow-hidden rounded-borders">
            <q-item tag="label" :disable="disable">
              <q-item-section side>
                <q-toggle v-model="messageEmbed.active" dense></q-toggle>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ $t('Components.MessageEditor.SendEmbedMessage') }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <q-card-section class="q-ml-sm">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <div>
                {{ $t('Components.MessageEditor.AuthorName') }}
              </div>

              <q-input
                v-model.trim="messageEmbed.author.name"
                class="q-pt-sm"
                :maxlength="256"
                :disable="!messageEmbed.active || disable"
                filled
                dense
                hide-bottom-space
              ></q-input>
            </div>

            <div class="col-12 col-md-4">
              <div>
                {{ $t('Components.MessageEditor.AuthorIconURL') }}
              </div>

              <q-input
                v-model.trim="messageEmbed.author.icon_url"
                class="q-pt-sm"
                type="url"
                :disable="!messageEmbed.active || disable"
                filled
                dense
                hide-bottom-space
              ></q-input>
            </div>

            <div class="col-12 col-md-4">
              <div>
                {{ $t('Components.MessageEditor.AuthorURL') }}
              </div>

              <q-input
                v-model.trim="messageEmbed.author.url"
                class="q-pt-sm"
                type="url"
                :disable="!messageEmbed.active || disable"
                filled
                dense
                hide-bottom-space
              ></q-input>
            </div>
          </div>
        </q-card-section>

        <q-card-section class="q-ml-sm">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <div>
                {{ $t('Components.MessageEditor.Title') }}
              </div>

              <q-input
                v-model.trim="messageEmbed.title"
                class="q-pt-sm"
                :maxlength="256"
                :disable="!messageEmbed.active || disable"
                filled
                dense
                hide-bottom-space
              ></q-input>
            </div>

            <div class="col-12 col-md-6">
              <div>
                {{ $t('Components.MessageEditor.TitleURL') }}
              </div>

              <q-input
                v-model.trim="messageEmbed.url"
                class="q-pt-sm"
                type="url"
                :disable="!messageEmbed.active || disable"
                filled
                dense
                hide-bottom-space
              ></q-input>
            </div>

            <div class="col-12">
              <div>
                {{ $t('Common.Description') }}
              </div>

              <q-input
                v-model.trim="messageEmbed.description"
                class="rounded-borders q-pt-sm"
                type="textarea"
                :disable="!messageEmbed.active || disable"
                filled
                hide-bottom-space
                :maxlength="4096"
              ></q-input>
            </div>
          </div>
        </q-card-section>

        <q-card-section class="q-ml-sm">
          <div class="row q-col-gutter-md">
            <transition-group enter-active-class="animated fadeInUp">
              <div class="col-12" v-for="(field, i) in messageEmbed.fields" :key="field.key">
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-12">
                    <q-input
                      v-model.trim="field.name"
                      class="rounded-t-lg"
                      :maxlength="256"
                      :disable="!messageEmbed.active || disable"
                      filled
                      dense
                      hide-bottom-space
                      :placeholder="$t('Components.MessageEditor.FieldName')"
                    ></q-input>

                    <q-separator></q-separator>

                    <q-input
                      v-model.trim="field.value"
                      class="q-pt-none no-border-radius"
                      autogrow
                      :maxlength="1024"
                      :disable="!messageEmbed.active || disable"
                      square
                      filled
                      dense
                      hide-bottom-space
                      :placeholder="$t('Components.MessageEditor.FieldValue')"
                    ></q-input>

                    <q-separator></q-separator>

                    <q-toolbar class="rounded-b-lg" style="background: rgba(130, 120, 150, 0.057)">
                      <q-checkbox
                        v-model="field.inline"
                        dense
                        :label="$t('Components.MessageEditor.FieldInline')"
                        :disable="!messageEmbed.active || disable"
                      ></q-checkbox>

                      <q-space></q-space>

                      <q-btn
                        @click="messageEmbed.fields.splice(i, 1)"
                        :label="$t('Common.Remove')"
                        :disable="!messageEmbed.active || disable"
                        color="negative"
                        flat
                        no-caps
                        unelevated
                      />
                    </q-toolbar>
                  </div>
                </div>
              </div>
            </transition-group>

            <div class="col-12">
              <q-btn
                class="full-width dashed-border"
                :label="$t('Components.MessageEditor.AddEmbedField')"
                @click="addEmbedField"
                :disable="messageEmbed.fields.length >= 25 || !messageEmbed.active || disable"
                unelevated
                no-caps
              />
            </div>
          </div>
        </q-card-section>

        <q-card-section class="q-ml-sm">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <div>
                {{ $t('Components.MessageEditor.ImageURL') }}
              </div>

              <q-input
                v-model.trim="messageEmbed.image.url"
                class="q-pt-sm"
                type="url"
                :disable="!messageEmbed.active || disable"
                filled
                dense
                hide-bottom-space
              ></q-input>
            </div>

            <div class="col-12 col-md-6">
              <div>
                {{ $t('Components.MessageEditor.ThumbnailURL') }}
              </div>

              <q-input
                v-model.trim="messageEmbed.thumbnail.url"
                class="q-pt-sm"
                type="url"
                :disable="!messageEmbed.active || disable"
                filled
                dense
                hide-bottom-space
              ></q-input>
            </div>
          </div>
        </q-card-section>

        <q-card-section class="q-ml-sm">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-4">
              <div>
                {{ $t('Components.MessageEditor.FooterText') }}
              </div>

              <q-input
                v-model.trim="messageEmbed.footer.text"
                class="q-pt-sm"
                :maxlength="2048"
                :disable="!messageEmbed.active || disable"
                filled
                dense
                hide-bottom-space
              ></q-input>
            </div>

            <div class="col-12 col-md-4">
              <div>
                {{ $t('Components.MessageEditor.FooterIconURL') }}
              </div>

              <q-input
                v-model.trim="messageEmbed.footer.icon_url"
                class="q-pt-sm"
                type="url"
                :disable="!messageEmbed.active || disable"
                filled
                dense
                hide-bottom-space
              ></q-input>
            </div>

            <div class="col-12 col-md-4">
              <div>
                {{ $t('Components.MessageEditor.FooterTimestamp') }}
              </div>

              <q-input
                v-model.trim="messageEmbed.timestamp"
                class="q-pt-sm"
                :disable="!messageEmbed.active || disable"
                filled
                dense
                hide-bottom-space
              ></q-input>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card v-if="currentView === 'IMAGE'" key="IMAGE" class="bg-transparent rounded-b-lg" bordered flat>
        <ImageEditor :image="messageImage" @change="onChangeImage" />
      </q-card>

      <q-card v-if="currentView === 'COMPONENTS'" key="COMPONENTS" class="bg-dark-2 rounded-b-lg" flat>
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div v-for="(row, i) in messageComponents" :key="i" class="col-12">
              <q-card class="bg-transparent" flat bordered>
                <q-card-section>
                  <div class="row q-col-gutter-sm">
                    <div class="col-auto" v-for="(component, ii) in row" :key="ii">
                      <q-chip
                        class="full-width no-shadow"
                        square
                        :label="component.label"
                        :style="{ background: imButtonStyles[component.style.toUpperCase()] }"
                        clickable
                        removable
                        @click="onClickButtonComponent(component, i, ii)"
                        @remove="row.length === 1 ? messageComponents.splice(i, 1) : row.splice(ii, 1)"
                      ></q-chip>
                    </div>

                    <div v-if="row.length < 5" class="col-auto">
                      <q-chip
                        class="dashed-border no-shadow full-width"
                        outline
                        square
                        clickable
                        @click="addButtonComponent(i)"
                      >
                        <q-icon name="add" size="24px"></q-icon>
                      </q-chip>
                    </div>
                  </div>
                </q-card-section>

                <q-card-actions align="right">
                  <q-btn
                    @click="messageComponents.splice(i, 1)"
                    :label="$t('Common.Remove')"
                    color="negative"
                    flat
                    no-caps
                    unelevated
                  ></q-btn>
                </q-card-actions>
              </q-card>
            </div>

            <div class="col-12">
              <q-btn
                class="full-width dashed-border"
                icon="add"
                flat
                @click="addRowComponent"
                :disable="messageComponents >= 5"
                unelevated
                no-caps
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <q-card v-if="currentView === 'PREVIEW'" key="PREVIEW" class="bg-dark-2 rounded-b-lg" flat>
        <q-item>
          <q-item-section avatar top>
            <q-avatar>
              <img src="~assets/lacuna-avatar.png" />
            </q-avatar>
          </q-item-section>

          <q-item-section top>
            <div>
              <span class="text-weight-bold">Lacuna</span>
              <q-badge class="q-ml-xs" color="primary">
                <span>BOT</span>
              </q-badge>
            </div>

            <div>
              <div class="break-word" v-html="$markdown(message.content || '')"></div>
            </div>

            <div v-if="withImage && messageImage.active" class="q-pt-xs">
              <div
                class="flex flex-center bg-grey-8 rounded-borders text-grey-6 text-center text-italic"
                :style="{
                  minHeight: '256px',
                  maxWidth: `${$q.screen.lt.md ? '100' : '45'}%`
                }"
              >
                Image
              </div>
            </div>

            <div
              v-if="withEmbed && message.embed.active"
              class="q-pt-xs"
              :style="`max-width: ${$q.screen.lt.md ? '100' : '45'}%;`"
            >
              <q-card class="bg-dark-1 rounded-md" flat>
                <div
                  class="absolute-left float-right"
                  :style="`background: ${message.embed.color || 'black'}; width: 4px; border-radius: 8px 0 0 8px`"
                ></div>

                <div class="q-pt-sm"></div>

                <q-item>
                  <q-item-section top>
                    <q-item v-if="message.embed.author.name" class="no-padding" dense>
                      <q-item-section
                        v-if="message.embed.author.icon_url"
                        avatar
                        top
                        style="min-width: 24px; padding: 0; padding-right: 8px"
                      >
                        <q-avatar size="24px">
                          <q-img :src="message.embed.author.icon_url" :style="{ height: '24px', width: '24px' }">
                            <template #error>
                              <div class="bg-grey-8"></div>
                            </template>
                          </q-img>
                        </q-avatar>
                      </q-item-section>

                      <q-item-section class="q-pt-xs" top>
                        <q-item-label lines="1">
                          {{ message.embed.author.name }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>

                    <div v-if="message.embed.title || message.embed.description" class="q-pb-sm">
                      <div v-if="message.embed.title" class="col-12 break-word">
                        {{ message.embed.title }}
                      </div>

                      <div
                        v-if="message.embed.description"
                        v-html="$markdown(message.embed.description || '')"
                        class="col-12 text--secondary break-word"
                      ></div>
                    </div>

                    <div v-if="message.embed.fields.length">
                      <div class="row q-col-gutter-xs">
                        <div
                          v-for="(field, i) in message.embed.fields"
                          :key="i"
                          :class="`${
                            field.inline ? `col-12 col-md-${message.embed.fields.length < 3 ? '6' : '4'}` : 'col-12'
                          } break-word`"
                        >
                          <div v-html="$markdown(field.name || '')"></div>

                          <div class="text--secondary" v-html="$markdown(field.value || '')"></div>
                        </div>
                      </div>
                    </div>
                  </q-item-section>

                  <q-item-section v-if="message.embed.thumbnail.url" side top>
                    <q-avatar size="64px" rounded>
                      <q-img :src="message.embed.thumbnail.url" :style="{ height: '64px', width: '64px' }">
                        <template #error>
                          <div class="bg-grey-8" :style="{ height: '100%', width: '100%' }"></div>
                        </template>
                      </q-img>
                    </q-avatar>
                  </q-item-section>
                </q-item>

                <div v-if="message.embed.image.url" class="q-px-md">
                  <q-img
                    class="rounded-borders"
                    :src="message.embed.image.url"
                    :style="{ maxHeight: '256px', height: '256px', width: '100%' }"
                  >
                    <template #error>
                      <div class="bg-grey-8" :style="{ height: '100%', width: '100%' }"></div>
                    </template>
                  </q-img>
                </div>

                <q-item v-if="message.embed.footer.text || message.embed.timestamp" dense>
                  <q-item-section
                    v-if="message.embed.footer.icon_url"
                    avatar
                    style="min-width: 20px; padding: 0; padding-right: 8px"
                  >
                    <q-avatar size="20px">
                      <q-img :src="message.embed.footer.icon_url" :style="{ height: '20px', width: '20px' }">
                        <template #error>
                          <div class="bg-grey-8"></div>
                        </template>
                      </q-img>
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label class="text--secondary">
                      {{ message.embed.footer.text }}
                      <span v-if="message.embed.timestamp">
                        <span v-if="message.embed.footer.text" class="q-px-xs">•</span>
                        {{ $dt.now().toFormat('D') }}
                      </span>
                    </q-item-label>
                  </q-item-section>
                </q-item>

                <div class="q-pt-sm"></div>
              </q-card>
            </div>

            <div v-if="withComponents" class="q-pt-xs">
              <div class="row q-col-gutter-xs">
                <div v-for="(row, i) in messageComponents" :key="i" class="col-12">
                  <div class="row q-col-gutter-sm">
                    <div v-for="(component, ii) in row" :key="ii" class="col-auto">
                      <q-chip
                        class="full-width no-shadow"
                        style="border-radius: 4px !important"
                        square
                        :label="component.label"
                        :style="{ background: imButtonStyles[component.style.toUpperCase()] }"
                      ></q-chip>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </q-item-section>
        </q-item>
      </q-card>
    </transition-group>

    <q-dialog v-model="modalReplacers" transition-show="jump-down" transition-hide="jump-up">
      <q-card class="bg-dark-1" flat style="width: 380px; max-width: 80vw">
        <q-tabs
          v-model="modalReplacersTab"
          class="bg-dark-2"
          align="justify"
          active-bg-color="secondary"
          indicator-color="transparent"
          no-caps
        >
          <q-tab name="replacers" :label="$t('Components.MessageEditor.Replacers')" style="width: 50%"></q-tab>

          <q-tab
            v-if="!hideCodeSnippets"
            name="functions"
            :label="$t('Components.MessageEditor.Functions')"
            style="width: 50%"
          ></q-tab>
        </q-tabs>

        <q-separator></q-separator>

        <q-tab-panels v-model="modalReplacersTab" class="bg-dark-1" animated style="max-height: 50vh; overflow-y: auto">
          <q-tab-panel name="replacers" class="q-pa-none" style="overflow-y: hidden">
            <q-list>
              <q-item
                v-for="replacer in replacers.variables.filter(i => avlReplacers.includes(i.split('.')[0])).sort()"
                :key="replacer"
                clickable
              >
                <q-item-section @click="onSelectReplacer(replacer)">
                  <q-item-label>
                    {{ replacer }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <q-btn
                    icon="link"
                    round
                    flat
                    :href="`https://docs.lacunabot.com/useful/replacers/data-types/${getReplacerPath(replacer)}`"
                    target="_blank"
                  ></q-btn>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>

          <q-tab-panel name="functions" class="q-pa-none" style="overflow-y: hidden">
            <q-list>
              <q-item v-for="func in replacers.functions" :key="func.name" clickable>
                <q-item-section @click="onSelectReplacer(func)">
                  <q-item-label>
                    {{ func.name }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <q-btn
                    icon="link"
                    round
                    flat
                    :href="`https://docs.lacunabot.com/useful/replacers/functions#${getReplacerPath(func)}`"
                    target="_blank"
                  ></q-btn>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </q-dialog>

    <q-dialog v-model="modalMentions" transition-show="jump-down" transition-hide="jump-up">
      <q-card class="bg-dark-1" flat style="width: 380px; max-width: 80vw">
        <q-tabs
          v-model="modalMentionsTab"
          class="bg-dark-2"
          align="justify"
          active-bg-color="secondary"
          indicator-color="transparent"
          no-caps
        >
          <q-tab name="roles" :label="$t('Common.Roles')" style="width: 50%"></q-tab>

          <q-tab name="channels" :label="$t('Common.Channels')" style="width: 50%"></q-tab>
        </q-tabs>

        <q-separator></q-separator>

        <q-tab-panels v-model="modalMentionsTab" class="bg-dark-1" animated style="max-height: 50vh; overflow-y: auto">
          <q-tab-panel name="roles" class="q-px-none" style="overflow-y: hidden">
            <q-list>
              <q-item v-for="role in guild.roles" :key="role.id" clickable @click="onSelectMention(role)">
                <q-item-section>
                  <q-item-label :style="{ color: role.color }">
                    {{ role.name }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>

          <q-tab-panel name="channels" class="q-px-none" style="overflow-y: hidden">
            <q-list>
              <q-item v-for="channel in guild.channels" :key="channel.id" clickable @click="onSelectMention(channel)">
                <q-item-section avatar>
                  <q-icon :name="channel.icon"></q-icon>
                </q-item-section>

                <q-item-section>
                  <q-item-label>
                    {{ channel.name }}
                  </q-item-label>

                  <q-item-label class="text--secondary">
                    {{ channel.parentName }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </q-dialog>

    <q-dialog v-model="modalEmojiPicker" transition-show="jump-down" transition-hide="jump-up">
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
  </div>
</template>

<script setup>
import { copyToClipboard, debounce, useQuasar } from 'quasar'
import { useGuildStore } from 'src/stores/guild'
import { resolveEmbed, suid } from 'src/utils/Utils'
import replacers from 'src/utils/replacers.json'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { imButtonStyles } from '../utils/Constants'
import ImageEditor from './ImageEditor.vue'
import MessageEditorButtonComponent from './dialogs/MessageEditorButtonComponent.vue'

const props = defineProps({
  message: {
    type: Object,
    default() {
      return { content: null }
    }
  },
  disable: {
    type: Boolean,
    default: false
  },
  disableEmbed: {
    type: Boolean,
    default: false
  },
  disableImage: {
    type: Boolean,
    default: true
  },
  disableComponents: {
    type: Boolean,
    default: true
  },
  disablePreview: {
    type: Boolean,
    default: false
  },
  hideReplacers: {
    type: Boolean,
    default: false
  },
  hideCodeSnippets: {
    type: Boolean,
    default: false
  },
  avlReplacers: {
    type: String,
    default: 'guild member'
  }
})

const $q = useQuasar(),
  { t: $t } = useI18n()
const guild = useGuildStore()

const withEmbed = computed(() => {
    return typeof props.message.embed !== 'undefined' && !props.disableEmbed
  }),
  withImage = computed(() => {
    return typeof props.message.image !== 'undefined' && !props.disableImage
  }),
  withComponents = computed(() => {
    return !props.disableComponents
  })

const currentView = ref('CONTENT')
const messageEmbed = ref(
    withEmbed.value
      ? JSON.parse(
          JSON.stringify({
            ...props.message.embed,
            fields: props.message.embed.fields.map(i => ({ ...i, key: suid(6) }))
          })
        )
      : {}
  ),
  messageComponents = ref(props.message.components ? JSON.parse(JSON.stringify(props.message.components)) : []),
  messageImage = computed(() => {
    return withImage.value ? JSON.parse(JSON.stringify(props.message.image)) : {}
  })
const modalReplacers = ref(false),
  modalReplacersTab = ref('replacers'),
  modalMentions = ref(false),
  modalMentionsTab = ref('roles'),
  modalEmojiPicker = ref(false)

const switchView = view => {
  currentView.value = view
}

const addEmbedField = () => {
  if (withEmbed.value && messageEmbed.value.fields.length < 25) {
    messageEmbed.value.fields.push({ name: '', value: '', inline: false, key: suid(6) })
  }
}

const addRowComponent = () => {
    if (withComponents.value && messageComponents.value.length < 5) {
      messageComponents.value.push([])
    }
  },
  addButtonComponent = rowIndex => {
    const row = messageComponents.value[rowIndex]

    if (!row) return

    row.push({
      type: 'Button',
      customId: `button-${row.length + 1}`,
      disabled: false,
      emoji: { name: null, id: null, animated: false },
      label: 'Button',
      style: 'Primary',
      url: null
    })
  },
  onClickButtonComponent = (btn, rowIndex, componentIndex) => {
    const row = messageComponents.value[rowIndex]

    return $q
      .dialog({
        component: MessageEditorButtonComponent,

        componentProps: {
          buttonProp: btn
        }
      })
      .onOk(({ button }) => {
        row[componentIndex] = button
      })
  }

const onChangeImage = debounce(value => {
  // eslint-disable-next-line vue/no-mutating-props
  props.message.image = value
}, 500)

const showCopyNotification = () => {
  return $q.notify({
    message: $t('Common.CopiedToClipboard'),
    classes: 'q-notification-custom',
    color: 'black',
    icon: 'assignment',
    timeout: 1500
  })
}

const onSelectReplacer = replacer => {
    const isFunc = typeof replacer !== 'string'
    replacer = isFunc ? `{- ${replacer.snippet} -}` : `{ ${replacer} }`

    copyToClipboard(replacer)
    showCopyNotification()
    modalReplacers.value = false
  },
  getReplacerPath = replacer => {
    const isFunc = typeof replacer !== 'string'

    if (isFunc) {
      return replacer.name.toLowerCase()
    } else {
      const [dataType, property] = replacer.split('.')

      return `${dataType}#.${property}`
    }
  },
  onSelectMention = mention => {
    const isRole = 'color' in mention
    mention = isRole ? `<@&${mention.id}>` : `<#${mention.id}>`

    copyToClipboard(mention)
    showCopyNotification()
    modalMentions.value = false
  },
  onSelectEmoji = emoji => {
    emoji = emoji.custom ? emoji.emoticons[0] : emoji.native

    copyToClipboard(emoji)
    showCopyNotification()
    modalEmojiPicker.value = false
  }

watch(
  () => messageEmbed.value,
  debounce(value => {
    // eslint-disable-next-line vue/no-mutating-props
    props.message.embed = resolveEmbed(value)
  }, 500),
  { deep: true }
)
watch(
  () => messageComponents.value,
  debounce(value => {
    // eslint-disable-next-line vue/no-mutating-props
    props.message.components = value
  }, 500),
  { deep: true }
)
</script>

<style lang="scss">
.d-mention {
  text-indent: 0;
  white-space: pre-wrap;
  background: #1976d299;
  border-radius: $border-radius-md;
  padding: 0 2px 0 2px;
}

.d-emoji {
  width: 10px !important;
}
</style>
