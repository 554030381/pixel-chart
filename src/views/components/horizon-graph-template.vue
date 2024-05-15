<script setup>
import * as d3 from 'd3';
import {defineProps, inject, onMounted} from 'vue';
import * as XLSX from 'xlsx';
import {countOccurrences, isNumber, mapValueToColor} from '@/utils/common.js';
import {EXCULDE_FIELD, NORMALIZED_FIELD, SPECIAL_FIELD} from '@/config.js';

const props = defineProps({
  NAME_SPACE: '',
  FILE_NAME: '',
  SHEET_NAME: '',
  TITLE: '',
  isDayDimension: false,
  bands: 4,
});

const isNormalized = inject('isNormalized', false)
console.log('isNormalized', isNormalized.value)

const COLOR = [34, 139, 34];
const GRID_WIDTH = 2;
const GRID_HEIGHT = 10;
let GRID_COL_NUM = null;
let GRID_ROW_NUM = null;
let LINE_CHART_WIDTH = GRID_COL_NUM * GRID_WIDTH;
const GRAPH_CHART_HEIGHT = 40;
const LINE_CHART_MARGIN = {top: 20, right: 20, bottom: 20, left: 20};
const TEXT_WIDTH = 140;
const TEXT_HEIGHT = 8;
onMounted(async () => {
  // 像素图数据（示例）
  const f = await fetch(`/${props.FILE_NAME}`);
  const d = await f.arrayBuffer();
  // 将得到的二进制转化一下
  let workbook = XLSX.read(d, {type: 'binary'});
  // console.log("workbook", workbook); //这里就是可读取的文件了
  // 最后把数据转成json格式的
  let worksheet = workbook.Sheets[props.SHEET_NAME]; //这里是表格的名字,这里取第一个表格,1就是第二个表格数据
  // console.log("worksheet", worksheet);
  let data = XLSX.utils.sheet_to_json(worksheet);
  const fields = Object.keys(data[0]);
  // const fields = FIELD.filter(field => !EXCULDE_FIELD.includes(field))
  // console.log(fields)
  const fieldValues = fields.map((field) =>
      data.map((d) => {
            if (SPECIAL_FIELD[Object.keys(SPECIAL_FIELD).filter((item) => props.TITLE.indexOf(item) !== -1)[0]].includes(field)) {
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
  // console.log(fieldValues);
  GRID_COL_NUM = fieldValues[0].length;
  GRID_ROW_NUM = fieldValues.length;
  LINE_CHART_WIDTH = GRID_COL_NUM * GRID_WIDTH;
  let fieldObj = fields.reduce((obj, field, i) => {
    obj[field] = {};
    obj[field].value = fieldValues[i];
    obj[field].min = Math.min(...fieldValues[i].filter((item) => isNumber(item)));
    obj[field].max = Math.max(...fieldValues[i].filter((item) => isNumber(item)));
    obj[field].mapValue = fieldValues[i].map((value) => {
      return mapValueToColor(COLOR, value, obj[field].min, obj[field].max);
    });
    return obj;
  }, {});

  // 局部归一化
  let normalizedSortedFields = [];
  const allNormalizedArr = NORMALIZED_FIELD[Object.keys(NORMALIZED_FIELD).filter((item) => props.TITLE.indexOf(item) !== -1)[0]]
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
      isNormalized.value && (fieldObj[field].value = fieldObj[field].normalizedValues)
      isNormalized.value && (fieldObj[field].min = 0)
      isNormalized.value && (fieldObj[field].max = 1)
      fieldObj[field].globalMin = globalMin
      fieldObj[field].globalMax = globalMax
      fieldObj[field].normalizedColors = normalizedArr.colors
    })
  })


  console.log(props.TITLE, fieldObj);
  // debugger
  const container = d3.select(`#${props.NAME_SPACE}-horizon-chart`);
  // (isNormalized.value ? normalizedSortedFields : fields).map((k, idx) => {
  normalizedSortedFields.map((k, idx) => {
    if (EXCULDE_FIELD[Object.keys(EXCULDE_FIELD).filter((item) => props.TITLE.indexOf(item) !== -1)[0]].includes(k))
      return;
    // if (EXCULDE_FIELD.includes(k)) return;
    const rowData = fieldObj[k];
    const colorsTemplate = ['#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c'];
    //     const colorsTemplate = [
    //   "#add8e6", "#a4d2e4", "#9acde3", "#91c8e1", "#88c2df",
    //   "#7ebdda", "#75b7d6", "#6bb1d2", "#62abce", "#58a5ca",
    //   "#4f9fc5", "#4599c1", "#3c93bd", "#328db9", "#2987b5",
    //   "#1f81b0", "#167bab", "#0c75a7", "#036fa2", "#00699d",
    //   "#005499", "#004e95", "#004890", "#00428b", "#003c86",
    //   "#003682", "#00307d", "#002a78", "#002573", "#001f6e"
    // ]
    // const colors = isNormalized.value ? rowData.normalizedColors : colorsTemplate.map((color, idx) => {
    //   // const len = colorsTemplate.length
    //   // const step = parseInt(len / props.bands)
    //   // return colorsTemplate[idx * step]
    //   return color;
    // });
    const colors = rowData.normalizedColors
    // Derive series, sorted by date.
    // Specify the dimensions of the chart.
    const marginTop = 30;
    const marginRight = 10;
    const marginBottom = 0;
    const marginLeft = 10;
    const width = 1000;
    const size = 55; // height of each band.
    const height = size + marginTop + marginBottom; // depends on the number of series
    const padding = 1;

    // Create the horizontal (temporal) scale.
    const x = d3
        .scaleLinear()
        .domain([0, rowData.value.length - 1])
        .range([0, width]);

    // Create the vertical scale; it describes the “total” height of the area,
    // when bands are not superimposed. The area shape will start from the y=size position
    // to represent 0 up to *bands* times the maximum band height.
    const y = d3
        .scaleLinear()
        .domain([0, fieldObj[k].max])
        .range([size, size - props.bands * (size - padding)]);

    const area = d3
        .area()
        .defined((d) => !isNaN(d))
        .x((d, i) => x(i))
        .y0(size)
        .y1((d) => y(d));

    // A unique identifier (to avoid conflicts) for the clip rect and the reusable paths.
    const uid = `O-${Math.random().toString(16).slice(2)}`;
    // Create the SVG container.
    const svg = d3
        .create('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [0, 0, width, height])
        .attr('style', 'max-width: 100%; height: auto; font: 10px sans-serif;');

    // Create a G element for each location.
    const myMap = new Map();
    myMap.set(k, rowData.value);
    const g = svg
        .append('g')
        .selectAll('g')
        .data(myMap)
        .join('g')
        .attr('transform', (d, i) => `translate(0,${i * size + marginTop})`);

    // Add a rectangular clipPath and the reference area.
    const defs = g.append('defs');
    defs
        .append('clipPath')
        .attr('id', (_, i) => `${uid}-clip-${i}`)
        .append('rect')
        .attr('y', padding)
        .attr('width', width)
        .attr('height', size - padding);

    defs
        .append('path')
        .attr('id', (_, i) => `${uid}-path-${i}`)
        .attr('d', () => area(rowData.value));

    // Create a group for each location, in which the reference area will be replicated
    // (with the SVG:use element) for each band, and translated.
    g.append('g')
        .attr('clip-path', (_, i) => `url(${new URL(`#${uid}-clip-${i}`, location)})`)
        .selectAll('use')
        .data((_, i) => new Array(props.bands).fill(i))
        .enter()
        .append('use')
        .attr('xlink:href', (i) => `${new URL(`#${uid}-path-${i}`, location)}`)
        .attr('fill', (_, i) => colors[i])
        .attr('transform', (_, i) => `translate(0,${i * size})`);

    // Add the labels.
    g.append('text')
        .attr('x', 4)
        .attr('y', (size + padding) / 2)
        .attr('dy', '0.35em')
        .style('font-size', '16px')
        .text(k);

    // Add the horizontal axis.
    // const totalPoint = rowData.value.length
    // const ticks = Math.floor(width / 106)
    // svg.append("g")
    //     .attr("transform", `translate(0,${marginTop})`)
    //     .call(d3.axisTop(x).ticks(ticks).tickSizeOuter(0).tickFormat((d, i) => {
    //       const date = fieldObj['日期'].value
    //       const time = fieldObj['时间'].value
    //       const idx = Math.floor((i+1) * totalPoint / ticks)
    //       return `${date[idx]} ${time[idx]}:00`
    //     }))
    //     .call(g => g.selectAll(".tick").filter(d => x(d) < marginLeft || x(d) >= width - marginRight).remove())
    //     .call(g => g.select(".domain").remove())

    container.append('g').append(() => svg.node());
    // debugger
  });
});
</script>

<template>
  <h3>{{ props.TITLE }}</h3>
  <div :id="`${props.NAME_SPACE}-horizon-chart`"></div>
</template>

<style lang="scss" scoped>
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
