<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="rounded-lg bg-dark-1" flat style="width: 800px; max-width: 90vw">
      <q-item class="q-py-md rounded-t-lg">
        <q-item-section>
          <q-item-label class="text-subtitle1 text-uppercase">
            {{ $t(mode === 'CREATE' ? 'level_award.add_award' : 'level_award.edit_award') }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('level_award.level_title') }}
            </div>

            <q-input
              v-model.number="award.level"
              class="q-pt-sm"
              type="number"
              filled
              dense
              hide-bottom-space
              @update:model-value="onChangeLevel"
            ></q-input>
          </div>

          <div class="col-12">
            <div>
              {{ $t('pages.guild.ac_levels_awards_title') }}
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
              {{ $t('level_award.remove_references_title') }}
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

      <q-list class="q-px-none q-py-md" dense>
        <q-item tag="label" v-ripple>
          <q-item-section>
            <q-item-label>
              {{ $t('level_award.next_remove_title') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-checkbox v-model="award.single" dense></q-checkbox>
          </q-item-section>
        </q-item>

        <q-item tag="label" v-ripple>
          <q-item-section>
            <q-item-label>
              {{ $t('level_award.custom_alert_title') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-checkbox v-model="award.alert.active" dense></q-checkbox>
          </q-item-section>
        </q-item>
      </q-list>

      <transition enter-active-class="animated fadeInUp">
        <q-card-section v-if="award.alert.active">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <div>
                {{ $t('pages.guild.gs_message_format_title') }}
              </div>

              <q-select
                v-model="award.alert.format"
                :options="['DM', 'CHANNEL']"
                class="q-pt-sm"
                filled
                dense
                hide-bottom-space
              >
                <template #selected-item="{ opt }">
                  <span>
                    {{ $t(`pages.guild.gs_message_formats.${opt}`) }}
                  </span>
                </template>

                <template #option="{ opt, toggleOption, selected }">
                  <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                    <q-item-section>
                      <q-item-label>
                        {{ $t(`pages.guild.gs_message_formats.${opt}`) }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <div class="col-12 col-md-6">
              <div>
                {{ $t('pages.guild.gs_message_channel_title') }}
              </div>

              <q-select
                v-model="award.alert.channel_id"
                :options="guild.channelsText"
                option-label="name"
                option-value="id"
                :disable="award.alert.format !== 'CHANNEL'"
                class="q-pt-sm"
                filled
                dense
                hide-bottom-space
                emit-value
                map-options
              >
                <template #selected-item="{ opt }">
                  <q-chip
                    class="rounded-lg"
                    color="dark-1"
                    square
                    :label="opt.name ?? opt"
                    :icon="opt.icon"
                    size="sm"
                    :ripple="false"
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
                {{ $t('pages.guild.gs_message_template_title') }}
              </div>

              <MessageEditor :message="award.alert.message" avlReplacers="guild member" class="q-pt-sm" />
            </div>
          </div>
        </q-card-section>
      </transition>

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
  name: 'ActivitiesLevelAward',

  emits: [...useDialogPluginComponent.emits],

  props: {
    awardProp: {
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

    const mode = ref(props.awardProp ? 'UPDATE' : 'CREATE')
    const award = ref(
      mode.value === 'UPDATE'
        ? JSON.parse(JSON.stringify(props.awardProp))
        : {
            id: suid(6),
            type: 'ROLE',
            level: 1,
            single: false,
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
            }
          }
    )

    if (typeof award.value.remove_references === 'undefined') {
      award.value.remove_references = []
    }

    const isValid = computed(() => {
      return (
        award.value.references.length &&
        award.value.level &&
        !guild.modules.levels.awards.some(i => i.level === award.value.level && i.id !== award.value.id)
      )
    })

    return {
      guild,
      dialogRef,
      mode,
      award,
      isValid,

      onConfirm() {
        if (isValid.value) {
          onDialogOK({ mode: mode.value, award: award.value })
        }
      },

      onCancel() {
        onDialogCancel()
      },

      onDismiss() {
        onDialogHide()
      },

      onDelete() {
        onDialogOK({ mode: 'DELETE', award: award.value })
      }
    }
  },

  methods: {
    onChangeLevel(value) {
      if (isNaN(value) || value < 1) value = 1
      if (value > 2500) value = 2500

      this.award.level = value
    }
  }
})
</script>
