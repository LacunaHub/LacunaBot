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
            <div class="col-9">
              <div>
                {{ $t('Components.CustomCommand.CommandArgumentName') }}
              </div>

              <q-input
                v-model.trim="option.name"
                class="q-pt-sm"
                :maxlength="32"
                filled
                dense
                hide-bottom-space
              ></q-input>
            </div>

            <div class="col-3">
              <div>
                {{ $t('Components.CustomCommand.CommandArgumentType') }}
              </div>

              <q-select
                v-model="option.type"
                :options="optionTypes"
                option-label="name"
                class="q-pt-sm"
                filled
                dense
                hide-bottom-space
                map-options
                emit-value
                @update:model-value="onChangeOptionType"
              >
                <template #selected-item="{ opt }">
                  <span class="text-uppercase">
                    {{ $t(localeStringsMap.commandOptionTypes[opt.name]) }}
                  </span>
                </template>

                <template #option="{ opt, toggleOption, selected }">
                  <q-item clickable @click="toggleOption(opt)" :active="selected" active-class="menu-item--active">
                    <q-item-section>
                      <q-item-label class="text-uppercase">
                        {{ $t(localeStringsMap.commandOptionTypes[opt.name]) }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <div class="col-12">
              <div>
                {{ $t('Components.CustomCommand.CommandArgumentDescription') }}
              </div>

              <q-input
                v-model.trim="option.description"
                class="q-pt-sm"
                :maxlength="100"
                filled
                dense
                hide-bottom-space
              ></q-input>
            </div>
          </div>
        </q-card-section>

        <div class="q-pa-md">
          <q-list class="bg-dark-2 overflow-hidden rounded-borders">
            <q-item tag="label">
              <q-item-section side>
                <q-checkbox v-model="option.required" dense></q-checkbox>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ $t('Commands.HelpCommand.Texts.CommandArgumentRequired') }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <q-card-section v-if="[3, 4, 10].includes(option.type) && option.choices">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <div>
                {{ $t('Components.CustomCommand.CommandArgumentChoices') }}
              </div>

              <div class="row q-col-gutter-sm q-pt-sm">
                <div class="col-auto" v-for="(choice, i) in option.choices" :key="i">
                  <q-chip
                    class="full-width no-shadow"
                    square
                    :label="choice.name"
                    clickable
                    removable
                    @click="choiceDialog(choice)"
                    @remove="option.choices.splice(i, 1)"
                  ></q-chip>
                </div>

                <div v-if="option.choices.length < 25" class="col-auto">
                  <q-chip class="dashed-border no-shadow full-width" outline square clickable @click="choiceDialog()">
                    <q-icon name="add" size="24px"></q-icon>
                  </q-chip>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
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
import { discordAppCommandNameRegexp, localeStringsMap } from 'src/utils/Constants'
import { computed, defineComponent, ref } from 'vue'
import CustomCommandOptionChoice from './CustomCommandOptionChoice.vue'

export default defineComponent({
  name: 'CustomCommandOption',

  emits: [...useDialogPluginComponent.emits],

  props: {
    optionProp: {
      type: Object,
      default: null
    }
  },

  setup(props) {
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const mode = ref(props.optionProp ? 'UPDATE' : 'CREATE')
    const option = ref(
      mode.value === 'UPDATE'
        ? JSON.parse(JSON.stringify(props.optionProp))
        : {
            type: 3,
            name: 'argument',
            description: 'Argument Description',
            required: false,
            choices: []
          }
    )

    const optionTypes = ref([
      { name: 'STRING', value: 3 },
      { name: 'INTEGER', value: 4 },
      { name: 'BOOLEAN', value: 5 },
      { name: 'USER', value: 6 },
      { name: 'CHANNEL', value: 7 },
      { name: 'ROLE', value: 8 },
      { name: 'MENTIONABLE', value: 9 },
      { name: 'NUMBER', value: 10 }
    ])

    const isValid = computed(() => {
      return Boolean(
        optionTypes.value.some(i => i.value === option.value.type) &&
          discordAppCommandNameRegexp.test(option.value.name) &&
          option.value.description?.length
      )
    })

    return {
      dialogRef,
      mode,
      option,

      optionTypes,

      isValid,
      localeStringsMap,

      onConfirm() {
        if (isValid.value) {
          onDialogOK({ mode: mode.value, option: option.value })
        }
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
    onChangeOptionType() {
      if ([3, 4, 10].includes(this.option.type)) {
        this.option.choices = []
      }

      // if (this.option.type === 'CHANNEL') {
      //   this.option.channel_types = []
      // }

      // if (['INTEGER', 'NUMBER'].includes(this.option.type)) {
      //   this.option.min_value = 0
      //   this.option.max_value = 100
      // }

      // if (this.option.type === 'STRING') {
      //   this.option.min_length = 1
      //   this.option.max_length = 100
      // }

      if (![3, 4, 10].includes(this.option.type)) {
        delete this.option.choices
      }

      // if (this.option.type !== 'CHANNEL') {
      //   delete this.option.channel_types
      // }

      // if (!['INTEGER', 'NUMBER'].includes(this.option.type)) {
      //   delete this.option.min_value
      //   delete this.option.max_value
      // }

      // if (this.option.type !== 'STRING') {
      //   delete this.option.min_length
      //   delete this.option.max_length
      // }
    },
    choiceDialog(choiceParam) {
      this.$q
        .dialog({
          component: CustomCommandOptionChoice,

          componentProps: {
            optionType: this.option.type,
            choiceProp: choiceParam
          }
        })
        .onOk(payload => {
          const { mode, choice } = payload

          if (mode === 'CREATE' && this.option.choices.length < 25) {
            this.option.choices.push(choice)
          }

          if (mode === 'UPDATE') {
            const index = this.option.choices.findIndex(i => i.name === choiceParam.name)

            this.option.choices[index] = choice
          }
        })
    }
  }
})
</script>
