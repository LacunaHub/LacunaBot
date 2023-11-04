<template>
  <q-table
    class="bg-dark-1"
    flat
    :rows="rows"
    row-key="timestamp"
    :columns="columns"
    :pagination="{ rowsPerPage: 10 }"
    :rows-per-page-options="[]"
  ></q-table>
</template>

<script>
import { useGuildStore } from 'src/stores/guild'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'GuildPageSettingsChangeLog',

  setup() {
    const guild = useGuildStore()

    return { guild }
  },

  data() {
    return {
      columns: [
        { name: 'user_id', align: 'left', label: 'Пользователь', field: 'user_id' },
        { name: 'changes', align: 'left', label: 'Изменения', field: 'changes' },
        { name: 'timestamp', align: 'left', label: 'Дата', field: 'timestamp' }
      ]
    }
  },

  computed: {
    rows() {
      return this.guild.change_log.map(change => {
        return {
          user_id: change.user_id,
          changes: change.changes.join(', '),
          timestamp: this.$dt.fromMillis(change.timestamp).toFormat('DD HH:mm')
        }
      })
    }
  }
})
</script>
