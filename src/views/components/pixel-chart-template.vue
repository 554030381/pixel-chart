<script setup>
import * as d3 from 'd3'
import {onMounted} from "vue";
import * as XLSX from "xlsx";
import {mapValueToColor, bilinearInterpolation, isNumber} from '@/utils/common.js'
import { EXCULDE_FIELD } from '@/config.js';

const props = defineProps({
  NAME_SPACE: '',
  FILE_NAME: '',
  SHEET_NAME: '',
  TITLE: ''
})

const COLOR = [34, 139, 34]
const GRID_WIDTH = 2
const GRID_HEIGHT = 10
let GRID_COL_NUM = null
let GRID_ROW_NUM = null
let LINE_CHART_WIDTH = GRID_COL_NUM * GRID_WIDTH
const LINE_CHART_HEIGHT = 100
const LINE_CHART_MARGIN = {top: 20, right: 20, bottom: 20, left: 20};
const TEXT_WIDTH = 140
const TEXT_HEIGHT = 8

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
  const fields = Object.keys(data[0]).filter(field => !EXCULDE_FIELD[Object.keys(EXCULDE_FIELD).filter((item) => props.TITLE.indexOf(item) !== -1)[0]].includes(field))
  // console.log(fields)
  const fieldValues = fields.map(field => data.map(d => /%$/.test(d[field]) ? parseFloat(d[field].slice(0, -1)) / 100 : parseFloat(d[field])))
  // console.log(fieldValues)
  GRID_COL_NUM = fieldValues[0].length
  GRID_ROW_NUM = fieldValues.length
  LINE_CHART_WIDTH = GRID_COL_NUM * GRID_WIDTH
  let fieldObj = fields.reduce((obj, field, i) => {
    obj[field] = {}
    obj[field].value = fieldValues[i]
    obj[field].min = Math.min(...fieldValues[i].filter(item => isNumber(item)))
    obj[field].max = Math.max(...fieldValues[i].filter(item => isNumber(item)))
    obj[field].mapValue = fieldValues[i].map((value) => {
      return mapValueToColor(COLOR, value, obj[field].min, obj[field].max)
    })
    return obj
  }, {})
  // console.log(fieldObj)
  fields.map((k) => {
    fieldObj[k].mapValue.map((color, idx) => {
      let c = color
      // console.log(c)
      if (idx >= 1 && idx <= fieldObj[k].mapValue.length - 2) {
        // console.log([fieldObj[k].mapValue[idx - 1], fieldObj[k].mapValue[idx], fieldObj[k].mapValue[idx + 1]])
        c = bilinearInterpolation(idx, [fieldObj[k].mapValue[idx - 1], fieldObj[k].mapValue[idx], fieldObj[k].mapValue[idx + 1]])
      }
      return c
    })
  }, {})
  // console.log(fieldObj)
  const svg = d3.select(`#${props.NAME_SPACE}-pixel-chart`)
      .append("svg")
      .attr('id', `${props.NAME_SPACE}-container`)
      .attr("width", GRID_COL_NUM * GRID_WIDTH + TEXT_WIDTH)
      .attr("height", GRID_ROW_NUM * GRID_HEIGHT)

  Object.keys(fieldObj).forEach((field, idx) => {
    let data = fieldObj[field].mapValue
    const pixels = svg.selectAll(`.${props.NAME_SPACE}-pixel-${idx}`)
        .data([idx]) // 绑定数据
        .enter()
        .append("g") // 创建一个组元素，用于组织每一行的像素
        .on("click", function (d) {
          // console.log(d, this)
          let currentNode = d.target.parentNode
          let currentId = currentNode.id.split('-')[2]
          // console.log(currentNode, currentId, Object.keys(fieldObj)[currentId])
          let rowData = fieldObj[Object.keys(fieldObj)[currentId]]
          if (currentNode.classList.contains(`${props.NAME_SPACE}-pixel`)) {
            drawLineChart(currentNode, rowData, currentId); // 将被点击的像素图转换为折线图
          } else {
            drawPixelArt(currentNode, rowData, currentId); // 将折线图转换为像素图
          }
        })
        .attr('class', `${props.NAME_SPACE}-pixel`)
        .attr('id', `${props.NAME_SPACE}-node-${idx}`)
        .selectAll(`.${props.NAME_SPACE}-pixel-${idx}`) // 在每一行内创建像素
        .data(data) // 绑定每一行的数据
        .enter()
        .append("rect")
        .attr("class", `${props.NAME_SPACE}-pixel-${idx}`)
        .attr("x", (d, i) => i * GRID_WIDTH)
        .attr("y", (d, i) => idx * GRID_HEIGHT)
        .attr("width", GRID_WIDTH)
        .attr("height", GRID_HEIGHT)
        .attr("fill", d => `rgb(${d[0]},${d[1]},${d[2]})`)

    svg.selectAll(`#${props.NAME_SPACE}-node-${idx}`)
        .append("text")
        .attr('id', `${props.NAME_SPACE}-text-${idx}`)
        .attr("x", GRID_COL_NUM * GRID_WIDTH + 20)
        .attr("y", idx * GRID_HEIGHT + TEXT_HEIGHT)
        .text(Object.keys(fieldObj)[idx]) // 设置文本内容
        .attr("font-family", "Arial") // 设置字体样式
        .attr("font-size", TEXT_HEIGHT) // 设置字体大小
        .attr("fill", "red"); // 设置文本颜色
  })


  // 绘制折线图
  function drawLineChart(element, rowData, idx) {
    // console.log('line chart', element, rowData)
    element.setAttribute('class', 'line-chart')
    // 绘制折线图的代码
    // 创建x轴的比例尺
    let xScale = d3.scaleLinear()
        .domain([0, rowData.value.length - 1])
        .range([0, LINE_CHART_WIDTH]);

    // 创建y轴的比例尺
    let yScale = d3.scaleLinear()
        .domain([d3.min(rowData.value, function (d) {
          return d;
        }), d3.max(rowData.value, function (d) {
          return d;
        })])
        .range([LINE_CHART_HEIGHT - LINE_CHART_MARGIN.bottom, LINE_CHART_MARGIN.top]);

    // 创建折线生成器
    let line = d3.line()
        .x(function (d) {
          return xScale(d.x);
        })
        .y(function (d) {
          return yScale(d.y);
        })

    // 绘制折线
    // 创建一个SVG元素
    let svg = d3.create('svg')
        .attr('width', LINE_CHART_WIDTH)
        .attr('height', LINE_CHART_HEIGHT)

// 在SVG元素内部添加一个包含路径的组元素
    let g = svg.append('g')
        .attr('id', `${props.NAME_SPACE}-g-${idx}`)

    g.append('rect')
        .attr("fill", "transparent")
        .attr('id', `${props.NAME_SPACE}-rect-${idx}`)
        .attr('x', 0)
        .attr('y', LINE_CHART_MARGIN.top)
        .attr('width', LINE_CHART_WIDTH)
        .attr('height', LINE_CHART_HEIGHT - LINE_CHART_MARGIN.top - LINE_CHART_MARGIN.bottom)

// 创建路径元素并添加到组元素中
    // 将折线图分成多段，并为每段设置不同的颜色
    for (let i = 0; i < data.length - 1; i++) {
      let segmentData = [{x: i, y: rowData.value[i]}, {x: i + 1, y: rowData.value[i + 1]}]; // 每段的数据点
      let segmentColor = rowData.mapValue[i]; // 每段的颜色
      g.append("path")
          .datum(segmentData)
          .attr("fill", "none")
          .attr("stroke", `rgb(${segmentColor[0]},${segmentColor[1]},${segmentColor[2]})`)
          .attr("stroke-width", 2)
          .attr("d", line)
    }

    d3.select(`g#${props.NAME_SPACE}-node-${idx}`).selectAll('*').remove()
    element.appendChild(svg.node())
    d3.select(element).append("text")
        .attr('id', `${props.NAME_SPACE}-text-${idx}`)
        .attr("x", GRID_COL_NUM * GRID_WIDTH + 20)
        .attr("y", 20)
        .text(Object.keys(fieldObj)[idx]) // 设置文本内容
        .attr("font-family", "Arial") // 设置字体样式
        .attr("font-size", TEXT_HEIGHT) // 设置字体大小
        .attr("fill", "red"); // 设置文本颜色
    let h = 0
    d3.selectAll(`#${props.NAME_SPACE}-container > g`)
        .attr("y", function (d, i) {
          // console.log(d, i, this.classList)
          let el = this
          // if (i === 0) return
          if (el.classList.contains(`${props.NAME_SPACE}-pixel`)) {
            h += GRID_HEIGHT
            d3.selectAll(`#${props.NAME_SPACE}-text-${i}`).attr('y', h + GRID_HEIGHT)
          } else {
            d3.select(`#${props.NAME_SPACE}-node-${i}`).attr('style', `transform: translateY(${h + GRID_HEIGHT}px)`)
            h += LINE_CHART_HEIGHT
          }
          d3.selectAll(`.${props.NAME_SPACE}-pixel-${i}`).attr('y', h)
        })
    d3.select(`#${props.NAME_SPACE}-container`)
        .attr('height', h)

    // 添加用于显示值的文本标签
    let valueLabel = d3.select(element).append("text")
        .attr("class", "value-label")
        .attr("x", 10)
        .attr("y", 10)
        .style("font-size", "12px");

    // 监听鼠标事件
    g.on("mouseover", function () {
      valueLabel.style("display", null); // 显示文本标签
    })
        .on("mousemove", function (event) {
          let mouseX = d3.pointer(event)[0];
          let mouseY = d3.pointer(event)[1];

          // 根据鼠标位置找到对应的数据点
          let xValue = Math.floor(mouseX / GRID_WIDTH);
          let yValue = rowData.value[xValue];

          // 在鼠标悬停位置显示数据点的值
          valueLabel.text("X: " + xValue + ", Y: " + yValue)
              .attr("x", mouseX + 10)
              .attr("y", mouseY - 10)
              .style("display", null); // 显示文本标签
        })
        .on("mouseout", function () {
          valueLabel.style("display", "none"); // 隐藏文本标签
        });
  }

  // 绘制像素图
  function drawPixelArt(element, rowData, idx) {
    // console.log('pixel chart', element, rowData)
    d3.select(`g#${props.NAME_SPACE}-node-${idx}`).selectAll('*').remove()
    element.setAttribute('class', `${props.NAME_SPACE}-pixel`)
    rowData.mapValue.map((d, i) => {
      svg.selectAll(`g#${props.NAME_SPACE}-node-${idx}`)
          .attr('class', `${props.NAME_SPACE}-pixel`)
          .attr('style', `transform: translateY(${0}px)`)
          .append("rect")
          .attr("class", `${props.NAME_SPACE}-pixel-${idx}`)
          .attr("x", i * GRID_WIDTH)
          .attr("width", GRID_WIDTH)
          .attr("height", GRID_HEIGHT)
          .attr("fill", `rgb(${d[0]},${d[1]},${d[2]})`)
    })

    svg.selectAll(`g#${props.NAME_SPACE}-node-${idx}`)
        .append("text")
        .attr('id', `${props.NAME_SPACE}-text-${idx}`)
        .attr("x", GRID_COL_NUM * GRID_WIDTH + 20)
        .attr("y", 20)
        .text(Object.keys(fieldObj)[idx]) // 设置文本内容
        .attr("font-family", "Arial") // 设置字体样式
        .attr("font-size", TEXT_HEIGHT) // 设置字体大小
        .attr("fill", "red"); // 设置文本颜色


    let h = 0
    d3.selectAll(`#${props.NAME_SPACE}-container > g`)
        .attr("y", function (d, i) {
          // console.log(d, i, this.classList)
          let el = this
          // if (i === 0) return
          if (el.classList.contains(`${props.NAME_SPACE}-pixel`)) {
            h += GRID_HEIGHT
            d3.selectAll(`#${props.NAME_SPACE}-text-${i}`).attr('y', h + GRID_HEIGHT)
          } else {
            d3.select(`#${props.NAME_SPACE}-node-${i}`).attr('style', `transform: translateY(${h + GRID_HEIGHT}px)`)
            h += LINE_CHART_HEIGHT
          }
          d3.selectAll(`.${props.NAME_SPACE}-pixel-${i}`).attr('y', h)
        })
    d3.select(`#${props.NAME_SPACE}-container`)
        .attr('height', h)
  }


})
</script>

<template>
  <h3>{{ props.TITLE }}</h3>
  <div :id="`${props.NAME_SPACE}-pixel-chart`" class="chart"></div>
</template>

<style scoped>
.chart {
  width: 100%;
}
</style>
