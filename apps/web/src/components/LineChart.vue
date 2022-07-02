<template>
  <Line :chart-id="chartId" :chart-options="chartOptions" :chart-data="chartData" :styles="styles" />
</template>

<script>
import { defineComponent } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart, Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, Filler } from 'chart.js'

Chart.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, Filler)

export default defineComponent({
  name: 'LineChart',

  components: { Line },

  props: {
    chartId: {
      type: String,
      default: 'line-chart'
    },
    styles: {
      type: Object,
      default: () => {}
    },
    chartData: {
      type: Object,
      default: () => {
        return {
          labels: [],
          datasets: []
        }
      }
    },
    chartOptions: {
      type: Object,
      default: () => {}
    },
    legendReverseClick: {
      type: Boolean,
      default: false
    }
  }
})
</script>
