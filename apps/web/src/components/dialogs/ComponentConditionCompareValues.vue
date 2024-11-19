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
                {{ $t('Components.CustomCommand.CompareValuesOperator') }}
              </div>

              <q-select
                v-model="component.condition.compare_values.operator"
                :options="[
                  'EQUAL',
                  'NOT_EQUAL',
                  'GREATER_THAN',
                  'LESS_THAN',
                  'STARTS_WITH',
                  'ENDS_WITH',
                  'CONTAINS',
                  'NOT_CONTAINS'
                ]"
                class="q-pt-sm"
                filled
                dense
                hide-bottom-space
              >
                <template #selected-item="{ opt }">
                  <span class="text-uppercase">
                    {{ $t(localeStringsMap.compareValuesOperators[opt]) }}
                  </span>
                </template>

                <template #option="{ opt, toggleOption, selected }">
                  <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                    <q-item-section>
                      <q-item-label class="text-uppercase">
                        {{ $t(localeStringsMap.compareValuesOperators[opt]) }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <div class="col-12">
              <div>
                {{ $t('Components.CustomCommand.CompareValuesLeftPart') }}
              </div>

              <q-input
                v-model.trim="component.condition.compare_values.left"
                class="q-pt-sm"
                :maxlength="256"
                filled
                dense
                hide-bottom-space
                autogrow
              ></q-input>
            </div>

            <div class="col-12">
              <div>
                {{ $t('Components.CustomCommand.CompareValuesRightPart') }}
              </div>

              <q-input
                v-model.trim="component.condition.compare_values.right"
                class="q-pt-sm"
                :maxlength="256"
                filled
                dense
                hide-bottom-space
                autogrow
              ></q-input>
            </div>
          </div>
        </q-card-section>

        <div v-if="component.condition.compare_values.options !== undefined" class="q-pa-md">
          <q-list class="bg-dark-2 overflow-hidden rounded-borders">
            <q-expansion-item v-for="option in ['FALSE_REPLY']" :key="option" tag="label">
              <template #header>
                <q-item-section side>
                  <q-checkbox
                    v-model="component.condition.compare_values.options"
                    :val="option"
                    dense
                    @update:model-value="onSelectOption"
                  ></q-checkbox>
                </q-item-section>

                <q-item-section>
                  <q-item-label>
                    {{ $t('Components.CustomCommand.CompareValuesFalseReply') }}
                  </q-item-label>
                </q-item-section>
              </template>

              <q-card class="bg-dark-1 no-border-radius" bordered>
                <q-card-section>
                  <div class="row q-col-gutter-md">
                    <div class="col-12">
                      <div>
                        {{ $t('Pages.GuildPage.GeneralSettings.MessageTemplate') }}
                      </div>

                      <MessageEditor
                        v-if="component.condition.compare_values.options.includes('FALSE_REPLY')"
                        :message="component.condition.compare_values.false_reply"
                        hide-replacers
                        hide-code-snippets
                        :disable-components="false"
                        class="q-pt-sm"
                      />

                      <MessageEditor v-else hide-replacers hide-code-snippets disable class="q-pt-sm" />
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </q-expansion-item>

            <q-item :disable="!component.condition.compare_values.options.includes('FALSE_REPLY')" tag="label">
              <q-item-section side>
                <q-checkbox
                  v-model="component.condition.compare_values.options"
                  :val="'FALSE_REPLY_EPHEMERAL'"
                  :disable="!component.condition.compare_values.options.includes('FALSE_REPLY')"
                  dense
                ></q-checkbox>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ $t('CaseLog.Actions.EphemeralReply') }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-card-section>

      <q-card-section class="q-dialog-card-actions row reverse q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-btn
            class="full-width"
            :label="$t('Common.Done')"
            unelevated
            no-caps
            color="primary"
            :disable="!isValid"
            @click="onConfirm"
          />
        </div>

        <div class="col-12 col-md-6">
          <q-btn class="full-width" :label="$t('Common.Close')" unelevated no-caps color="dark-2" @click="onCancel" />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { useDialogPluginComponent } from 'quasar'
import { localeStringsMap } from 'src/utils/Constants'
import { computed, defineComponent, ref } from 'vue'
import MessageEditor from '../MessageEditor.vue'

export default defineComponent({
  name: 'ComponentConditionCompareValues',

  emits: [...useDialogPluginComponent.emits],

  props: {
    componentProp: {
      type: Object,
      required: true
    }
  },

  components: {
    MessageEditor
  },

  setup(props) {
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const component = ref(JSON.parse(JSON.stringify(props.componentProp)))

    const isValid = computed(() => {
      return Boolean(
        component.value.condition.compare_values.operator &&
          component.value.condition.compare_values.left &&
          component.value.condition.compare_values.right
      )
    })

    return {
      dialogRef,
      component,

      isValid,
      localeStringsMap,

      onConfirm() {
        onDialogOK({ component: component.value })
      },

      onCancel() {
        onDialogCancel()
      },

      onDismiss() {
        onDialogHide()
      }
    }
  },

  methods: {
    onSelectOption(options) {
      if (options.includes('FALSE_REPLY') && !this.component.condition.compare_values.false_reply) {
        this.component.condition.compare_values.false_reply = {
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

      if (!options.includes('FALSE_REPLY')) {
        delete this.component.condition.compare_values.false_reply
      }
    }
  }
})
</script>
