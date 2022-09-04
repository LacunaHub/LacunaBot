<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="rounded-lg bg-dark-1" flat style="width: 1000px; max-width: 90vw">
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

      <q-list class="q-px-none q-py-md" dense>
        <q-item v-for="option in ['FALSE_REPLY']" :key="option" tag="label" v-ripple>
          <q-item-section>
            <q-item-label>
              {{ $t('custom_command.cv_false_reply_title') }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-checkbox
              v-model="component.condition.compare_values.options"
              :val="option"
              dense
              @update:model-value="onSelectOption"
            ></q-checkbox>
          </q-item-section>
        </q-item>
      </q-list>

      <transition enter-active-class="animated fadeInUp">
        <q-card-section v-if="component.condition.compare_values.options.includes('FALSE_REPLY')">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('common.message') }}
              </div>

              <MessageEditor
                :message="component.condition.compare_values.false_reply"
                hide-replacers
                hide-code-snippets
                class="q-pt-sm"
              />
            </div>
          </div>
        </q-card-section>
      </transition>

      <transition enter-active-class="animated fadeInUp">
        <q-item
          v-if="component.condition.compare_values.options.includes('FALSE_REPLY')"
          class="q-my-sm"
          tag="label"
          dense
          v-ripple
        >
          <q-item-section>
            <q-item-label>
              {{ $t(`common.actions_keys.EPHEMERAL_REPLY`) }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-checkbox
              v-model="component.condition.compare_values.options"
              :val="'FALSE_REPLY_EPHEMERAL'"
              dense
            ></q-checkbox>
          </q-item-section>
        </q-item>
      </transition>

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
import { computed, defineComponent, ref } from 'vue'
import { useDialogPluginComponent } from 'quasar'
import MessageEditor from '../MessageEditor.vue'

export default defineComponent({
  name: 'CustomCommandConditionCompareValues',

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
