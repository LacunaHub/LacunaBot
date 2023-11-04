<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="bg-dark-1" flat style="width: 1000px; max-width: 90vw">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <div>
              {{ $t('custom_command.cv_operator_title') }}
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
                  {{ $t(`custom_command.cv_operators.${opt}`) }}
                </span>
              </template>

              <template #option="{ opt, toggleOption, selected }">
                <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                  <q-item-section>
                    <q-item-label class="text-uppercase">
                      {{ $t(`custom_command.cv_operators.${opt}`) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>

          <div class="col-12">
            <div>
              {{ $t('custom_command.cv_left_part_title') }}
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
              {{ $t('custom_command.cv_right_part_title') }}
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
                  {{ $t('custom_command.cv_false_reply_title') }}
                </q-item-label>
              </q-item-section>
            </template>

            <q-card class="bg-dark-1 no-border-radius" bordered>
              <q-card-section>
                <div class="row q-col-gutter-md">
                  <div class="col-12">
                    <div>
                      {{ $t('common.message') }}
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
                {{ $t(`common.actions_keys.EPHEMERAL_REPLY`) }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-btn class="full-width" :label="$t('close')" unelevated no-caps color="dark-2" @click="onCancel" />
          </div>

          <div class="col-6">
            <q-btn
              class="full-width"
              :label="$t('done')"
              unelevated
              no-caps
              color="primary"
              :disable="!isValid"
              @click="onConfirm"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { useDialogPluginComponent } from 'quasar'
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
