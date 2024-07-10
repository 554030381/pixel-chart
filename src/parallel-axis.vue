<template>
  <div v-if="brand  === 'online-streamer'">
    <h1>FORVIL温莎森林-主播小时数据</h1>
<!--    <div style="width: 200px;display: flex;margin-left: 20px">-->
<!--      <div style="line-height: 30px">是否局部归一化:</div>-->
<!--      <el-switch v-model="isNormalized" style="margin-left: 10px"/>-->
<!--    </div>-->
    <OnlineStreamerParallelAxis v-if="isShow"></OnlineStreamerParallelAxis>
  </div>
<!--  <div v-else>-->
<!--    <h1>{{ `${brand} 4月18日——4月25日数据` }}</h1>-->
<!--    <div style="display: flex">-->
<!--      <div style="width: 200px;display: flex;margin-left: 20px">-->
<!--        <div style="line-height: 30px">是否局部归一化:</div>-->
<!--        <el-switch v-model="isNormalized" style="margin-left: 10px"/>-->
<!--      </div>-->
<!--    </div>-->
<!--    <div v-if="isShow">-->
<!--      <template v-if="brand === 'sisley'">-->
<!--        <online-time></online-time>-->
<!--        <ad-time></ad-time>-->
<!--        <traffic-time></traffic-time>-->
<!--      </template>-->
<!--      <template v-else>-->
<!--        <oero-online-time></oero-online-time>-->
<!--        <oero-ad-time></oero-ad-time>-->
<!--        <oero-traffic-time></oero-traffic-time>-->
<!--      </template>-->
<!--    </div>-->
<!--  </div>-->
</template>

<script setup>
import OnlineTime from "./views/online-time.vue";
import AdTime from "./views/ad-time.vue";
import TrafficTime from "./views/traffic-time.vue";

import OeroOnlineTime from "./views/Oero/online-time.vue";
import OeroAdTime from "./views/Oero/ad-time.vue";
import OeroTrafficTime from "./views/Oero/traffic-time.vue";

import OnlineStreamerParallelAxis from "./views/online-streamer/parallel-axis.vue";

import {useRoute} from "vue-router";
import {nextTick, provide, ref, watch} from "vue";

const route = useRoute();
const brand = ref(route.params.brand)
const isShow = ref(true)
const isNormalized = ref(false)

provide('isNormalized', isNormalized)

watch([isNormalized], async (newVal) => {
  console.log('watch bands', newVal)
  isShow.value = false
  await nextTick()
  isShow.value = true
})
</script>

<style scoped lang="scss">

</style>
