ad-horizon.vue<script setup>
import {ref} from "vue";
import OmhTemplate from "@/views/components/OMH-template.vue";

const NAME_SPACE = ref('onlineHorizonMin')
const FILE_NAME = ref('Oero/5min_奥利奥官方旗舰店20240418-20240425__在线趋势.xlsx')
const SHEET_NAME = ref('Sheet1')
const TITLE = ref('在线趋势（7天，每5min）')

const props = defineProps({
  bands: 4
})
</script>

<template>
  <omh-template
      :NAME_SPACE="NAME_SPACE"
      :FILE_NAME="FILE_NAME"
      :SHEET_NAME="SHEET_NAME"
      :TITLE="TITLE"
      :bands="props.bands"
  ></omh-template>
</template>

<style lang="scss" scoped>
#adHorizonMin-horizon-chart {
  width: 100%;
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
