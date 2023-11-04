<template>
  <q-dialog ref="dialogRef" @hide="onDismiss" transition-show="jump-down" transition-hide="jump-up">
    <q-card class="q-dialog-card bg-dark-1" flat style="width: 720px">
      <q-item class="q-py-md rounded-t-lg">
        <q-item-section>
          <q-item-label class="text-subtitle1 text-uppercase">
            {{ $t('header.change_log') }}
          </q-item-label>

          <q-item-label class="text--secondary">v{{ changes.version }}</q-item-label>
        </q-item-section>

        <q-item-section side>
          <div class="flex items-center">
            <q-icon class="cursor-pointer" name="chevron_left" size="xs" @click="decreasePage"></q-icon>
            <span style="font-size: x-small">{{ currentPage + 1 }}/{{ changeLog.list.length }}</span>
            <q-icon class="cursor-pointer" name="chevron_right" size="xs" @click="increasePage"></q-icon>
          </div>
        </q-item-section>
      </q-item>

      <q-card-section
        v-html="changeLog.parseContent(changes.content)"
        class="q-dialog-card-body q-py-none"
      ></q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-btn class="full-width" :label="$t('close')" unelevated no-caps color="dark-2" @click="onCancel" />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script>
import { useDialogPluginComponent } from 'quasar'
import { useChangeLogStore } from 'src/stores/change-log'
import { computed, defineComponent, ref } from 'vue'
import { event } from 'vue-gtag'

export default defineComponent({
  name: 'ChangeLog',

  emits: [...useDialogPluginComponent.emits],

  setup() {
    const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent()
    const changeLog = useChangeLogStore()
    const currentPage = ref(0)
    const changes = computed(() => {
      return changeLog.list[currentPage.value]
    })

    const increasePage = () => {
        if (currentPage.value + 1 >= changeLog.list.length) currentPage.value = 0
        else currentPage.value++
      },
      decreasePage = () => {
        if (currentPage.value <= 0) currentPage.value = changeLog.list.length - 1
        else currentPage.value--
      }

    return {
      dialogRef,

      changeLog,
      currentPage,
      changes,

      increasePage,
      decreasePage,

      onCancel() {
        onDialogCancel()
      },

      onDismiss() {
        onDialogHide()
      }
    }
  },

  mounted() {
    event('view_change_log', { event_category: 'utility' })
    this.$q.localStorage.set('change-log-viewed-version', this.changeLog.current.version)
  }
})
</script>
