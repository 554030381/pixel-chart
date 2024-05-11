<script setup>
import PixelChartTemplate from "@/views/components/pixel-chart-template.vue";
import {ref} from "vue";

const NAME_SPACE = ref('ad')
const FILE_NAME = ref('Oero/5min_奥利奥官方旗舰店20240418-20240425__广告趋势.xlsx')
const SHEET_NAME = ref('Sheet1')
const TITLE = ref('广告趋势（7天，每5min）')

</script>

<template>
  <pixel-chart-template
      :NAME_SPACE="NAME_SPACE"
      :FILE_NAME="FILE_NAME"
      :SHEET_NAME="SHEET_NAME"
      :TITLE="TITLE"
  ></pixel-chart-template>
</template>

<style scoped>
#ad-pixel-chart {
  width: 100%;
}
</style>
