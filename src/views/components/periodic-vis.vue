<script setup>
import {inject, nextTick, onMounted, reactive,defineProps} from "vue";
import * as XLSX from "xlsx";
import {mapValueToColor,isNumber} from '@/utils/common.js'

const echarts = inject('$echarts')

const props = defineProps({
  NAME_SPACE: '',
  FILE_NAME: '',
  SHEET_NAME: '',
  TITLE: ''
})

const FIELD = [
  '数据时间段',
  '进入人数',
  '观看人数',
  '平均在线人数',
  '评论数',
  '新增粉丝数',
  '自然流量',
  '付费流量',
  '互动率',
  '自然流量转化率',
  '付费流量转化率',
  'GMV占比',
  'GMV',
  'UV价值',
  'GPM',
  '投放消耗',
  '广告ROI',
  '整体ROI'
]

const EXCULDE_FIELD = [
  // '数据时间段',
  '日期',
  '时间',
  '分钟级时间戳',
  '小店随心推',
  '品牌广告',
  '千川品牌广告'
  // '标准推广ROI',
  // '整体ROI',
  // '投放ROI',
  // '投放成单率',
  // '广告点击率'
]

const COLOR = [34, 139, 34]
const RADIUS_RANGE = [10, 90]
const GRID_WIDTH = 2
const GRID_HEIGHT = 10
let GRID_COL_NUM = null
let GRID_ROW_NUM = null
let LINE_CHART_WIDTH = GRID_COL_NUM * GRID_WIDTH
const GRAPH_CHART_HEIGHT = 50
const LINE_CHART_MARGIN = {top: 20, right: 20, bottom: 20, left: 20};
const TEXT_WIDTH = 140
const TEXT_HEIGHT = 8

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
  // console.log(data)
  const fields = Object.keys(data[0])
  // const fields = FIELD.filter(field => !EXCULDE_FIELD.includes(field))
  // console.log(fields)
  const fieldValues = fields.map(field => data.map(d => /%$/.test(d[field]) ? parseFloat(d[field].slice(0, -1)) / 100 : parseFloat(d[field])))
  // console.log(fieldValues)
  GRID_COL_NUM = fieldValues[0].length
  GRID_ROW_NUM = fieldValues.length
  LINE_CHART_WIDTH = GRID_COL_NUM * GRID_WIDTH
  let fieldObj = fields.reduce((obj, field, i) => {
    obj[field] = {}
    obj[field].value = fieldValues[i]
    obj[field].min = Math.min(...fieldValues[i].filter(item=>isNumber(item)))
    obj[field].max = Math.max(...fieldValues[i].filter(item=>isNumber(item)))
    obj[field].mapValue = fieldValues[i].map((value) => {
      return mapValueToColor(COLOR, value, obj[field].min, obj[field].max)
    })
    return obj
  }, {})
  // console.log(fieldObj)
  const echartsFields = {}
  Object.keys(fieldObj).map(field => {
    if(EXCULDE_FIELD.includes(field)) return
    const echartsData = echartsFields[field] = []
    const colorList = fieldObj[field].mapValue
    const valueList = fieldObj[field].value
    fieldObj['时间'].value.reduce((t, v, i) => {
      if (t === 0) {
        echartsData.push([])
      }
      while (v !== t) {
        const color = mapValueToColor(COLOR, 0, 0, 0)
        echartsData[echartsData.length - 1].push({
          value: null,
          itemStyle: {color: `rgb(${color[0]},${color[1]},${color[2]})`},
          isNull: true,
          time: `${fieldObj['日期']['value'][i]} ${t}:00`
        })
        t++
        if (t > 23) {
          t = 0
          return t
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
  })
  // console.log(echartsFields)
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
  <h3>{{ props.TITLE }}</h3>
  <div class="container">
    <div v-for="(v,i) in Object.keys(echartsOptions)" :id="`${props.NAME_SPACE}-time-chart-${i}`" class="chart"></div>
  </div>
</template>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-wrap: wrap;
  width: 100%;

  div{
    width: 300px;
    height: 300px;
  }
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
