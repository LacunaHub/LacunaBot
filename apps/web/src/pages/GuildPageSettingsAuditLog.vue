<template>
  <q-table
    class="bg-dark-1"
    flat
    :rows="rows"
    row-key="timestamp"
    :columns="columns"
    :pagination="{ rowsPerPage: 25 }"
    :rows-per-page-options="[]"
  ></q-table>
</template>

<script setup>
import { DateTime } from 'src/boot/luxon'
import { useGuildStore } from 'src/stores/guild'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const guild = useGuildStore(),
  i18n = useI18n()

const columns = [
    { name: 'user_id', align: 'left', label: i18n.t('Commands.OptionTypes.User'), field: 'user_id' },
    { name: 'changes', align: 'left', label: i18n.t('Common.Description'), field: 'changes' },
    { name: 'timestamp', align: 'left', label: i18n.t('Common.Date'), field: 'timestamp' }
  ],
  rows = computed(() => {
    return guild.change_log.map(v => ({
      user_id: v.user_id,
      changes: v.changes.join(', '),
      timestamp: DateTime.fromMillis(v.timestamp).toFormat('DD HH:mm')
    }))
  })
</script>
