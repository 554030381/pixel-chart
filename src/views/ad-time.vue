<script setup>
import {ref} from "vue";
import PeriodicVis from "@/views/components/periodic-vis.vue";

const NAME_SPACE = ref('adTime')
const FILE_NAME = ref('hour_Sisley法国希思黎20240418-20240425__广告趋势.xlsx')
const SHEET_NAME = ref('Sheet1')
const TITLE = ref('广告趋势（7天，每h）')
</script>

<template>
  <periodic-vis
      :NAME_SPACE="NAME_SPACE"
      :FILE_NAME="FILE_NAME"
      :SHEET_NAME="SHEET_NAME"
      :TITLE="TITLE"
  ></periodic-vis>
</template>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-wrap: wrap;
}

#adHorizon-horizon-chart, .chart {
  width: 300px;
  height: 300px;
  flex: 0 0 300px;
}

.horizon {
  border-top: solid 1px #000;
  border-bottom: solid 1px #000;
  overflow: hidden;
  position: relative;
  display: flex !important;
}

.horizon + .horizon {
  border-top: none;
}

.horizon canvas {
  display: block;
  image-rendering: pixelated;
}

.horizon .title,
.horizon .value {
  display: block;
  flex: 0 0 100px;
  //bottom: 0;
  //line-height: 30px;
  //margin: 0 6px;
  //position: absolute;
  //font-family: sans-serif;
  //text-shadow: 0 1px 0 rgba(255,255,255,.5);
  //white-space: nowrap;
}

.horizon .title {
  left: 0;
}

.horizon .value {
  right: 0;
}
</style>
