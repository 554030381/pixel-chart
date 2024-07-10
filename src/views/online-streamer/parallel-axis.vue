<script setup>
import {onMounted, ref, watchEffect} from "vue";
import ParallelAxisTemplate from "@/views/components/parallel-axis-template.vue";
import * as XLSX from "xlsx";
import {EXCULDE_FIELD} from '@/config.js';


const NAME_SPACE = ref('onlineStreamerTime')
const FILE_NAME = ref('Online-streamer/FORVIL温莎森林-主播小时数据-20231001-20231007.xlsx')
const TITLE = ref('FORVIL温莎森林-主播小时数据')
const sheets = ref([])
const FIELDS = ref(['日期', '时间', '小徐', '玉玉', '轩轩', '薛雅文', '张璐', '小柏', '徐悠雯', '心月'])
const show = ref(false)

onMounted(async () => {
  try {
    const f = await fetch(`/${FILE_NAME.value}`)
    const d = await f.arrayBuffer()
// 将得到的二进制转化一下
    let workbook = XLSX.read(d, {type: "binary"});
    const arr = workbook.SheetNames.filter(sheet => !EXCULDE_FIELD['主播小时数据'].includes(sheet))
    // arr.splice(1)
    sheets.value = arr
  } catch (e) {
    console.log(e)
  }
})

watchEffect(() => {
  show.value = sheets.value.length > 0 && FIELDS.value.length > 0
})
</script>

<template>
  <div class="container">
  <div v-for="(sheet,idx) in sheets" :key="idx" class="wrapper">
    <parallel-axis-template
        v-if="show"
        :NAME_SPACE="`${NAME_SPACE}-${sheet.replaceAll(' ','')}`"
        :FILE_NAME="FILE_NAME"
        :SHEET_NAME="sheet"
        :TITLE="sheet"
        :FIELDS="FIELDS"
    ></parallel-axis-template>
  </div>
    </div>
</template>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-wrap: wrap;
  width: 100%;

  .wrapper{
    width: 50%;
  }
}

</style>
