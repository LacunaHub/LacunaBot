<template>
  <q-table
    class="bg-dark-grey-2 rounded-lg"
    :rows="bills"
    row-key="id"
    :columns="columns"
    :pagination="{ rowsPerPage: 10 }"
    :rows-per-page-options="[]"
    :loading="tableLoading"
  >
    <template #body-cell-status="props">
      <q-td :props="props">
        <span :class="getStatusTextColor(props.value)">
          {{ props.value }}
        </span>
      </q-td>
    </template>
  </q-table>
</template>

<script>
import { interfaces } from 'src/boot/axios'
import { useUserStore } from 'src/stores/user'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'DashboardPageBills',

  setup() {
    const user = useUserStore()

    return { user }
  },

  data() {
    return {
      tableLoading: true,
      columns: [
        { name: 'date', align: 'left', label: this.$t('date'), field: 'date', sortable: true },
        { name: 'id', align: 'left', label: this.$t('pages.dashboard.bill_id'), field: 'id' },
        { name: 'amount', align: 'left', label: this.$t('amount'), field: 'amount', sortable: true },
        {
          name: 'status',
          align: 'left',
          label: this.$t('pages.dashboard.bill_status'),
          field: 'status',
          sortable: true
        },
        { name: 'description', align: 'left', label: this.$t('description'), field: 'description', sortable: true }
      ]
    }
  },

  computed: {
    bills() {
      return this.user.bills
    }
  },

  methods: {
    async getBills() {
      return interfaces.users.getBills().then(response => {
        const bills = response.data.map(i => {
          return {
            id: i.external_id ?? i._id,
            amount: `${i.amount} ${i.currency}`,
            status: i.status.value,
            date: this.$dt.fromMillis(i.creation_timestamp).toFormat('D'),
            description: `${i.custom_fields.type}:${i.custom_fields.reference_id}`
          }
        })

        this.user.$patch({ bills })
      })
    },
    getStatusTextColor(status) {
      if (status === 'PAID') return 'text-positive'
      if (status === 'WAITING') return 'text-warning'

      return 'text-negative'
    }
  },

  async mounted() {
    if (!this.bills.length) await this.getBills()

    this.tableLoading = false
  }
})
</script>
