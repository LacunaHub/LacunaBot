<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="rounded-lg bg-dark-1" flat style="width: 720px; max-width: 90vw">
      <q-card-section>
        <q-banner class="rounded-lg bg-dark-2" dense>
          <span>
            {{ $t('user_survey.it_would_help_us') }}
          </span>

          <template #avatar>
            <q-icon name="info" color="info"></q-icon>
          </template>
        </q-banner>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 text-center">
            <div>{{ $t('user_survey.how_satisfied') }} *</div>

            <q-rating v-model="satisfaction" class="q-pt-sm" size="lg" :max="5" color="primary">
              <template v-slot:tip-1>
                <q-tooltip
                  class="bg-black rounded-lg text-body2"
                  anchor="top middle"
                  self="bottom middle"
                  transition-show=""
                  transition-hide=""
                >
                  1
                </q-tooltip>
              </template>
              <template v-slot:tip-2>
                <q-tooltip
                  class="bg-black rounded-lg text-body2"
                  anchor="top middle"
                  self="bottom middle"
                  transition-show=""
                  transition-hide=""
                >
                  2
                </q-tooltip>
              </template>
              <template v-slot:tip-3>
                <q-tooltip
                  class="bg-black rounded-lg text-body2"
                  anchor="top middle"
                  self="bottom middle"
                  transition-show=""
                  transition-hide=""
                >
                  3
                </q-tooltip>
              </template>
              <template v-slot:tip-4>
                <q-tooltip
                  class="bg-black rounded-lg text-body2"
                  anchor="top middle"
                  self="bottom middle"
                  transition-show=""
                  transition-hide=""
                >
                  4
                </q-tooltip>
              </template>
              <template v-slot:tip-5>
                <q-tooltip
                  class="bg-black rounded-lg text-body2"
                  anchor="top middle"
                  self="bottom middle"
                  transition-show=""
                  transition-hide=""
                >
                  5
                </q-tooltip>
              </template>
            </q-rating>
          </div>

          <div class="col-12 text-center">
            <div>{{ $t('user_survey.how_many_members') }} *</div>

            <q-tabs
              v-model="memberCount"
              class="rounded-lg bg-dark-2 q-mt-sm"
              align="justify"
              active-bg-color="secondary"
              indicator-color="transparent"
            >
              <q-tab
                v-for="variant in memberCountVariants"
                :key="variant"
                :name="variant"
                no-caps
                :style="{ width: `calc(100% / ${memberCountVariants.length})` }"
              >
                <span class="text-white">{{ variant }}</span>
              </q-tab>
            </q-tabs>
          </div>
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 text-center">
            <div>
              {{ $t('user_survey.tell_us_more') }}
            </div>

            <q-input
              v-model.trim="surveyDetails"
              class="q-pt-sm rounded-lg"
              type="textarea"
              :maxlength="2048"
              square
              filled
              dense
              hide-bottom-space
            ></q-input>
          </div>
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-btn class="full-width" :label="$t('remind_later')" unelevated no-caps color="dark-2" @click="onCancel" />
          </div>

          <div class="col-6">
            <q-btn
              class="full-width"
              :label="$t('done')"
              :disable="!isValid"
              unelevated
              no-caps
              color="primary"
              @click="onConfirm"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'
import { useDialogPluginComponent } from 'quasar'

const memberCountVariants = ['1-49', '50-99', '100-499', '500-2499', '2500-9999', '10000+']

export default defineComponent({
  name: 'UserSurvey',

  emits: [...useDialogPluginComponent.emits],

  setup() {
    const { dialogRef, onDialogHide, onDialogCancel, onDialogOK } = useDialogPluginComponent()

    const satisfaction = ref(null),
      memberCount = ref(null),
      surveyDetails = ref(null)

    const isValid = computed(() => {
      return satisfaction.value !== null && memberCount.value !== null
    })

    return {
      dialogRef,

      satisfaction,
      memberCount,
      surveyDetails,

      isValid,

      memberCountVariants,

      onConfirm() {
        const formData = new FormData()

        formData.append('entry.1952568557', satisfaction.value.toString())
        formData.append('entry.1846314085', memberCount.value)
        formData.append('entry.1162768349', surveyDetails.value ?? '')

        fetch(
          'https://docs.google.com/forms/u/0/d/e/1FAIpQLSc0v55uIN21CrNMeQVw_UxwrqXOjYV6_wBPk0tH-sM1rtJYAg/formResponse',
          {
            method: 'POST',
            body: formData,
            mode: 'no-cors'
          }
        )

        onDialogOK()
      },

      onCancel() {
        onDialogCancel()
      },

      onDismiss() {
        onDialogHide()
      }
    }
  }
})
</script>
