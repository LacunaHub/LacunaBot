<template>
  <div id="dashboard-page-bills-container">
    <q-markup-table v-if="pageLoading" class="bg-dark-1" flat>
      <thead>
        <tr>
          <th>
            <q-skeleton type="text" />
          </th>
          <th>
            <q-skeleton type="text" />
          </th>
          <th>
            <q-skeleton type="text" />
          </th>
          <th>
            <q-skeleton type="text" />
          </th>
          <th>
            <q-skeleton type="text" />
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="n in 5" :key="n">
          <td>
            <q-skeleton type="text" width="50%" />
          </td>
          <td>
            <q-skeleton type="text" width="80%" />
          </td>
          <td>
            <q-skeleton type="text" width="35%" />
          </td>
          <td>
            <q-skeleton type="text" width="35%" />
          </td>
          <td>
            <q-skeleton type="text" width="65%" />
          </td>
        </tr>

        <span></span>
      </tbody>

      <tfoot style="height: 50px">
        <tr>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td>
            <q-skeleton type="text" />
          </td>
        </tr>
      </tfoot>
    </q-markup-table>

    <q-table
      v-else
      class="bg-dark-1"
      flat
      :rows="bills"
      row-key="id"
      :columns="tableColumns"
      :pagination="{ rowsPerPage: 10 }"
      :rows-per-page-options="[]"
      :loading="pageLoading"
    >
      <template #body-cell-status="props">
        <q-td :props="props">
          <span :class="getStatusTextColor(props.value)">
            {{ props.value }}
          </span>
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { interfaces } from 'src/boot/axios'
import { DateTime } from 'src/boot/luxon'
import { handleAxiosError } from 'src/utils/Utils'
import { onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  parentLoading: {
    type: Boolean,
    default: true
  }
})

const $q = useQuasar(),
  { t } = useI18n()

const pageLoading = ref(true)

const bills = ref([]),
  tableColumns = [
    { name: 'date', align: 'left', label: t('Common.Date'), field: 'date', sortable: true },
    { name: 'id', align: 'left', label: t('Pages.DashboardPage.BillId'), field: 'id' },
    { name: 'amount', align: 'left', label: t('Pages.DashboardPage.BillAmount'), field: 'amount', sortable: true },
    {
      name: 'status',
      align: 'left',
      label: t('Pages.DashboardPage.BillStatus'),
      field: 'status',
      sortable: true
    },
    { name: 'description', align: 'left', label: t('Common.Description'), field: 'description', sortable: true }
  ]

const getBills = async () => {
  try {
    const response = await interfaces.users.getBills(),
      { data } = response

    bills.value = data.map(i => {
      return {
        id: i.external_id ?? i._id,
        amount: `${i.amount} ${i.currency}`,
        status: i.status.value,
        date: DateTime.fromMillis(i.creation_timestamp).toFormat('D'),
        description: `${i.custom_fields.type}:${i.custom_fields.reference_id}`
      }
    })

    return true
  } catch (err) {
    const error = handleAxiosError(err)

    $q.notify({
      message: error.message,
      classes: 'q-notification-custom',
      color: 'black',
      icon: 'error',
      iconColor: 'negative',
      timeout: 5000
    })
  }

  return false
}
const getStatusTextColor = status => {
  if (status === 'PAID') return 'text-positive'
  if (status === 'WAITING') return 'text-warning'

  return 'text-negative'
}

onMounted(async () => {
  const hook = async () => {
    const getBillsSuccess = await getBills()

    return (pageLoading.value = !getBillsSuccess)
  }

  if (props.parentLoading) {
    watch(() => props.parentLoading, hook)
  } else {
    await hook()
  }
})
</script>
