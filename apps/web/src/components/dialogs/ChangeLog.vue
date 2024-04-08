<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="q-dialog-card bg-dark-1 overflow-hidden" flat style="width: 720px">
      <q-item class="q-py-md rounded-t-lg">
        <q-item-section>
          <q-item-label class="text-subtitle1 text-uppercase">
            {{ $t('Components.Header.ReleaseNotes') }}
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-card-section>
        <q-select v-model="selectedVersion" :options="versionList" filled dense hide-bottom-space></q-select>
      </q-card-section>

      <q-card-section
        v-html="releaseNotesCache.parseContent(versionChanges.content)"
        class="q-dialog-card-body"
      ></q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-btn class="full-width" :label="$t('Common.Close')" unelevated no-caps color="dark-2" @click="onCancel" />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { useReleaseNotesCache } from 'src/stores/ReleaseNotesCache'
import { computed, onMounted, ref } from 'vue'
import { event } from 'vue-gtag'

defineEmits(useDialogPluginComponent.emits)

const $q = useQuasar(),
  { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()

const releaseNotesCache = useReleaseNotesCache()

const versionList = releaseNotesCache.releases.map(v => v.version),
  selectedVersion = ref(versionList.at(0)),
  versionChanges = computed(() => {
    return releaseNotesCache.releases.find(v => v.version === selectedVersion.value)
  })

const onCancel = () => {
    onDialogCancel()
  },
  onDismiss = () => {
    onDialogHide()
  }

onMounted(() => {
  event('view_change_log', { event_category: 'utility' })
  $q.localStorage.set('change-log-viewed-version', releaseNotesCache.current.version)
})
</script>
