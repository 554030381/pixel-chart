<script setup>
import {inject, nextTick, onMounted, reactive, defineProps} from "vue";
import * as XLSX from "xlsx";
import {mapValueToColor, isNumber, countOccurrences} from '@/utils/common.js'
import {EXCULDE_FIELD, NORMALIZED_FIELD, SPECIAL_FIELD} from '@/config.js';

const echarts = inject('$echarts')

const props = defineProps({
  NAME_SPACE: '',
  FILE_NAME: '',
  SHEET_NAME: '',
  TITLE: '',
  FIELDS: [],
})

const COLOR = '#08519c'
const RADIUS_RANGE = [50, 90]
const GRID_WIDTH = 2
const GRID_HEIGHT = 10
let GRID_COL_NUM = null
let GRID_ROW_NUM = null
let LINE_CHART_WIDTH = GRID_COL_NUM * GRID_WIDTH
const GRAPH_CHART_HEIGHT = 50
const LINE_CHART_MARGIN = {top: 20, right: 20, bottom: 20, left: 20};
const TEXT_WIDTH = 140
const TEXT_HEIGHT = 8

const isNormalized = inject('isNormalized', false)

const echartsOptions = reactive({})

onMounted(async () => {
  // 像素图数据（示例）
  const f = await fetch(`/${props.FILE_NAME}`)
  const d = await f.arrayBuffer()
// 将得到的二进制转化一下
  let workbook = XLSX.read(d, {type: "binary"});
  //打印的workbook如图所示:https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8587ef9092424bcfb02d75d5513333ef~tplv-k3u1fbpfcp-watermark.image?
  // console.log("workbook", workbook); //这里就是可读取的文件了
  // 最后把数据转成json格式的
  let worksheet = workbook.Sheets[props.SHEET_NAME]; //这里是表格的名字,这里取第一个表格,1就是第二个表格数据
  //打印的worksheet如图所示:https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/a3de2e1f5b6c490faadc76604193d0ab~tplv-k3u1fbpfcp-watermark.image?
  // console.log("worksheet", worksheet);
  //将得到的worksheet转化为json格式
  let data = XLSX.utils.sheet_to_json(worksheet);
  console.log(data)
  let fields = []
  console.log(props.FIELDS)
  if (props.FIELDS.length > 0) {
    fields = props.FIELDS
  } else {
    fields = Object.keys(data[0])
    data.forEach(d => {
      const keys = Object.keys(d)
      keys.forEach(key => {
        if (!fields.includes(key)) {
          fields.push(key)
        }
      })
    })
  }
  // const fields = FIELD.filter(field => !EXCULDE_FIELD.includes(field))
  console.log(fields)
  const fieldValues = fields.map((field) =>
      data.map((d) => {
            if (SPECIAL_FIELD[Object.keys(SPECIAL_FIELD).filter((item) => props.TITLE?.indexOf(item) !== -1)[0]]?.includes(field)) {
              if (d[field]) {
                return countOccurrences(d[field], `${field}：`)
              } else {
                return 0
              }
            } else {
              return (/%$/.test(d[field]) ? parseFloat(d[field].slice(0, -1)) / 100 : parseFloat(d[field]))
            }
          }
      )
  );
  // console.log(fieldValues)
  GRID_COL_NUM = fieldValues[0].length
  GRID_ROW_NUM = fieldValues.length
  LINE_CHART_WIDTH = GRID_COL_NUM * GRID_WIDTH
  let fieldObj = fields.reduce((obj, field, i) => {
    obj[field] = {}
    obj[field].value = fieldValues[i]
    obj[field].min = Math.min(...fieldValues[i].filter(item => isNumber(item)))
    obj[field].max = Math.max(...fieldValues[i].filter(item => isNumber(item)))
    obj[field].nullValueColor = mapValueToColor(COLOR, 0, 0, 0)
    obj[field].mapValue = fieldValues[i].map((value) => {
      return mapValueToColor(COLOR, value, obj[field].min, obj[field].max)
    })
    return obj
  }, {})
  console.log(props.TITLE, fieldObj)

  // 局部归一化
  let normalizedSortedFields = [];
  const allNormalizedArr = NORMALIZED_FIELD[Object.keys(NORMALIZED_FIELD).filter((item) => props.TITLE.indexOf(item) !== -1)[0]]
  console.log(Object.keys(NORMALIZED_FIELD).filter((item) => props.TITLE.indexOf(item) !== -1)[0], allNormalizedArr)
  allNormalizedArr.map((normalizedArr) => {
    normalizedSortedFields.push(...normalizedArr.value)
    // 计算所有字段value的全局最小值和最大值
    let globalMin = Infinity;
    let globalMax = -Infinity;
    normalizedArr.value.map((field) => {
      const values = fieldObj[field].value;
      globalMin = Math.min(globalMin, ...values.filter((item) => isNumber(item)));
      globalMax = Math.max(globalMax, ...values.filter((item) => isNumber(item)));
    })
    normalizedArr.value.map((field) => {
      const values = fieldObj[field].value;
      fieldObj[field].normalizedValues = values.map(value =>
          (value - globalMin) / (globalMax - globalMin)
      );
      fieldObj[field].valueCopy = fieldObj[field].value
      fieldObj[field].globalMin = globalMin
      fieldObj[field].globalMax = globalMax
      fieldObj[field].normalizedColors = normalizedArr.colors
      if (isNormalized.value) {
        fieldObj[field].value = fieldObj[field].normalizedValues
        fieldObj[field].min = 0
        fieldObj[field].max = 1
        fieldObj[field].mapValue = fieldObj[field].value.map((value) => {
          return mapValueToColor(fieldObj[field].normalizedColors.at(-1), value, fieldObj[field].min, fieldObj[field].max)
        })
        fieldObj[field].nullValueColor = mapValueToColor(fieldObj[field].normalizedColors.at(-1), 0, 0, 0)
      }
    })
  })

  console.log(normalizedSortedFields)

  const echartsFields = {}
  normalizedSortedFields.map(field => {
    if (EXCULDE_FIELD[Object.keys(EXCULDE_FIELD).filter((item) => props.TITLE.indexOf(item) !== -1)[0]].includes(field))
      return;
    const echartsData = echartsFields[field] = []
    const colorList = fieldObj[field].mapValue
    const valueList = fieldObj[field].value
    let currentDate = null
    fieldObj['时间'].value.reduce((t, v, i) => {
      if (t === 0) {
        currentDate = currentDate ? ++currentDate : fieldObj['日期']['value'][0]
        echartsData.push([])
      }
      while (!(t === v && currentDate === fieldObj['日期']['value'][i])) {
        const color = fieldObj[field].nullValueColor
        echartsData[echartsData.length - 1].push({
          value: null,
          itemStyle: {color: `rgb(${color[0]},${color[1]},${color[2]})`},
          isNull: true,
          time: `${currentDate} ${t}:00`
        })
        t += 1
        if (t > 23) {
          t = 0
          currentDate = currentDate ? ++currentDate : fieldObj['日期']['value'][0]
          echartsData.push([])
          // return t
        }
      }
      const color = colorList[i]
      const value = valueList[i]
      echartsData[echartsData.length - 1].push({
        value: value,
        itemStyle: {color: `rgb(${color[0]},${color[1]},${color[2]})`},
        time: `${fieldObj['日期']['value'][i]} ${t}:00`
      })
      t += 1
      if (t > 23) {
        t = 0
      }
      return t
    }, 0)
    // 最外圈没有到23点

    let t = fieldObj['时间'].value[fieldObj['时间'].value.length - 1]
    t++
    const lastEchartsData = echartsData[echartsData.length - 1]
    while (t < 24) {
      const color = fieldObj[field].nullValueColor
      lastEchartsData.push({
        value: null,
        itemStyle: {color: `rgb(${color[0]},${color[1]},${color[2]})`},
        isNull: true,
        time: `${currentDate} ${t}:00`
      })
      t++
    }
  })
  console.log(echartsFields)
  Object.keys(echartsFields).map(k => {
    const v = echartsFields[k]
    echartsOptions[k] = {
      title: {
        text: k,
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        // formatter: '{a} <br/>{b}: {c} ({d})'
        formatter: function (params) {
          let tooltipContent = `${params.data.time}: ` + '<br>';
          tooltipContent += params.data.realValue;
          return tooltipContent;
        }
      },
      series: []
    };
    const perRadius = Number(((RADIUS_RANGE[1] - RADIUS_RANGE[0]) / v.length).toFixed(2))
    for (let _i in v) {
      // console.log(_i, perRadius)
      // console.log([`${RADIUS_RANGE[0] + Number(_i) * perRadius}%`, `${RADIUS_RANGE[0] + (Number(_i) + 1) * perRadius}%`])
      const seriesData = v[_i]
      // console.log(seriesData)
      const seriesOption = {
        name: _i,
        type: 'pie',
        selectedMode: 'single',
        radius: [`${RADIUS_RANGE[0] + Number(_i) * perRadius}%`, `${RADIUS_RANGE[0] + (Number(_i) + 1) * perRadius}%`], // 这个是内圈的大小
        label: {
          position: 'inner'
        },
        labelLine: {
          show: false
        },
        data: seriesData.map(item => ({...item, value: 1, realValue: item.value}))
      }
      echartsOptions[k].series.push(seriesOption)
    }
  })
  // console.log(echartsOptions)
  await nextTick(() => {
    Object.keys(echartsOptions).map((k, i) => {
      const chart = echarts.init(document.querySelector(`#${props.NAME_SPACE}-time-chart-${i}`))
      chart.setOption(echartsOptions[k])
    })
  })
})
</script>

<template>
  <div class="periodic-vis">
    <h3>{{ props.TITLE }}</h3>
    <div class="periodic-vis-container">
      <div v-for="(v,i) in Object.keys(echartsOptions)" :id="`${props.NAME_SPACE}-time-chart-${i}`" class="periodic-vis-chart"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.periodic-vis{
  width: 100%;
}

.periodic-vis-container{
  display: flex;
  flex-wrap: wrap;
  width: 100%;

  div {
    width: 300px;
    height: 300px;
  }
}
</style>
