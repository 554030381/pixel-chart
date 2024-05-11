<script setup>
import * as d3 from 'd3'
import {onMounted, ref} from "vue";
import * as XLSX from "xlsx";
import {mapValueToColor} from '../utils/common.js'
import PixelChartTemplate from "@/views/components/pixel-chart-template.vue";

const NAME_SPACE = ref('everyday')
const FILE_NAME = ref('Sisley法国希思黎2024-03-23 14_59_44.xls')
const SHEET_NAME = ref('抖音1天数据(数据集)')
const TITLE = ref('每天')
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
#pixel-chart {
  width: 100%;
}
</style>
