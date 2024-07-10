<script setup>
import {inject, nextTick, onMounted, defineProps, ref} from "vue";
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

const echartsOption = ref({})

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
  // console.log(props.FIELDS)
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
  // console.log(fields)
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
  // console.log(props.TITLE, fieldObj)

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

  const parallelAxisData = {}
  Object.keys(echartsFields).forEach(name => {
    const data = echartsFields[name]
    parallelAxisData[name] = data.flatMap(day => {
      return day.filter(item=>isNumber(item.value)).map(item => {
        const dateArr = item.time.split(' ')
        const date = parseInt(dateArr[0])
        const time = parseInt(dateArr[1])
        return [date, time, name, item.value]
      })
    })
  })

  const colorMap = {
    小徐: '#5A6FC0',
    徐悠雯: '#9ECA7F',
    玉玉: '#F2CA6B',
    张璐: '#DE6E6A',
    心月: '#85BEDB',
    轩轩: '#59A076',
    小柏: '#EC8A5D',
    薛雅文: '#9263AF'
  }

  let selectedItems = []
  console.log('selectedItems', selectedItems)
  const lineStyle = {
    width: 1,
    opacity: 0.5
  };
  echartsOption.value = {
    backgroundColor: '#fff',
    legend: {
      bottom: 30,
      data: Object.keys(parallelAxisData),
      itemGap: 20,
      textStyle: {
        color: '#333',
        fontSize: 14
      }
    },
    tooltip: {
      padding: 10,
      backgroundColor: '#fff',
      borderColor: '#777',
      borderWidth: 1,
      formatter: function (params) {
        const pValue = params.value
        let date = pValue[0]
        let time = pValue[1]
        let name = pValue[2]
        let value = pValue[3]
        if (selectedItems.length === 0) {
          selectedItems = Object.keys(parallelAxisData).flatMap(name => parallelAxisData[name])
        }
        const dateSelected = [...new Set(selectedItems?.map(item => Array.isArray(item) ? item[0] : item['日期']))]
        const timeSelected = [...new Set(selectedItems?.map(item => Array.isArray(item) ? item[1] : item['时间']))]
        let res = ``
        console.log('params', params, selectedItems, dateSelected, timeSelected)
        if (dateSelected.length && timeSelected.length) {
          res += `<div style="font-size: 16px;font-weight: 500">${props.SHEET_NAME}</div>`
          dateSelected.forEach(d => {
            timeSelected.forEach(t => {
              const item = parallelAxisData[name].find(item => item[0] === d && item[1] === t && item[3] === value)
              if (item?.length > 0 && isNumber(item[3])) {
                date = item[0]
                time = item[1]
                name = item[2]
                value = item[3]
                res += `<div style="margin-top: 5px">${date} ${time}:0 ${name} ${value}</div>`;
              }
            })
          })
        } else {
          res += `<div style="margin-top: 5px">${date} ${time}:0 ${name} ${value}</div>`;
        }
        return res
      }
    },
    parallelAxis: [
      {
        dim: 0,
        name: '日期',
        min: echartsFields[props.FIELDS.at(-1)].at(0).at(0).time.split(' ')[0],
        max: echartsFields[props.FIELDS.at(-1)].at(-1).at(-1).time.split(' ')[0],
      },
      {
        dim: 1,
        name: '时间',
        min: 0,
        max: 23,
        axisLabel: {
          formatter: function (value, index) {
            if (value % 5 === 0 || value === 23) {
              return value;
            } else {
              return '';
            }
          },
          interval: 1 // Ensure each tick is displayed
        }
      },
      {dim: 2, name: '主播', type: 'category', data: Object.keys(parallelAxisData)},
      {
        dim: 3,
        name: props.SHEET_NAME,
        min: 0,
        max: Math.ceil(Math.max(...Object.keys(parallelAxisData).flatMap(name => parallelAxisData[name]).filter(item => isNumber(item[3])).map(item => item[3]))),
      },
    ],
    parallel: {
      left: '5%',
      right: '18%',
      bottom: 100,
      parallelAxisDefault: {
        type: 'value',
        nameLocation: 'end',
        nameGap: 20,
        nameTextStyle: {
          color: '#333',
          fontSize: 12
        },
        axisLine: {
          lineStyle: {
            color: '#333'
          }
        },
        axisTick: {
          lineStyle: {
            color: '#333'
          }
        },
        splitLine: {
          show: false
        },
        axisLabel: {
          color: '#333'
        },
      },
      inactiveOpacity: 0
    },
    brush: {
      toolbox: ['lineX', 'lineY', 'keep', 'clear'],
      brushLink: 'all',
      outOfBrush: {
        colorAlpha: 0 // 未被选择部分的透明度
      },
      throttleType: 'debounce',
      throttleDelay: 300 // 节流延时（毫秒）
    },
    series: Object.keys(parallelAxisData).map(name => {
      return {
        name,
        type: 'parallel',
        lineStyle: Object.assign({color: colorMap[name], lineStyle}),
        data: parallelAxisData[name],
        smooth: true
      }
    })
  }
  console.log(echartsOption.value)
  await nextTick(() => {
    const chart = echarts.init(document.querySelector(`#${props.NAME_SPACE}-parallel-axis-chart`))
    chart.setOption(echartsOption.value)

    // 添加 brushselected 事件监听器
    chart.on('brushselected', function (params) {
      const selectedData = [];
      const brushComponent = params.batch[0];

      // 提取被刷选的索引
      brushComponent.selected.forEach(function (brush) {
        brush.dataIndex.forEach(function (dataIndex) {
          selectedData.push(parallelAxisData[brush.seriesName][dataIndex]);
        });
      });

      // 在控制台输出被刷选的数据
      console.log('Selected Data:', selectedData);
      selectedItems = selectedData.map(item => {
        return {
          日期: item[0],
          时间: item[1],
          主播: item[2],
          值: item[3]
        }
      })
    });

  })
})
</script>

<template>
  <div class="periodic-vis">
    <h3>{{ props.TITLE }}</h3>
    <div class="parallel-axis-container">
      <div :id="`${props.NAME_SPACE}-parallel-axis-chart`"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.periodic-vis {
  width: 80%;
}

.parallel-axis-container {
  display: flex;
  flex-wrap: wrap;
  width: 100%;

  div {
    width: 100%;
    height: 400px;
  }
}
</style>
