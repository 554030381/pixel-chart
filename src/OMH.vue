<template>
  <h1>{{ `${brand} 4月18日——4月25日数据` }}</h1>
  <div style="display: flex">
    <div style="width: 200px;display: flex">
      <div style="line-height: 30px">bind:</div>
      <el-input v-model="bandsInput" placeholder="bands 1~7" style="margin-left: 10px"/>
    </div>
    <div style="width: 200px;display: flex;margin-left: 20px">
      <div style="line-height: 30px">是否局部归一化:</div>
      <el-switch v-model="isNormalized" style="margin-left: 10px"/>
    </div>
  </div>
  <div v-if="isShow">
    <template v-if="brand==='sisley'">
<!--      <h2>分钟</h2>-->
<!--      <online-horizon-min :bands="bands"></online-horizon-min>-->
<!--      <ad-horizon-min :bands="bands"></ad-horizon-min>-->
<!--      <traffic-horizon-min :bands="bands"></traffic-horizon-min>-->
<!--      <h2>小时</h2>-->
<!--      <online-horizon :bands="bands"></online-horizon>-->
<!--      <ad-horizon :bands="bands"></ad-horizon>-->
<!--      <traffic-horizon :bands="bands"></traffic-horizon>-->
    </template>
    <template v-else>
      <h2>分钟</h2>
      <oero-online-omh-min :bands="bands"></oero-online-omh-min>
<!--      <oero-ad-horizon-min :bands="bands"></oero-ad-horizon-min>-->
<!--      <oero-traffic-horizon-min :bands="bands"></oero-traffic-horizon-min>-->
<!--      <h2>小时</h2>-->
<!--      <oero-online-horizon :bands="bands"></oero-online-horizon>-->
<!--      <oero-ad-horizon :bands="bands"></oero-ad-horizon>-->
<!--      <oero-traffic-horizon :bands="bands"></oero-traffic-horizon>-->
    </template>
  </div>
</template>

<script setup>
import AdHorizonMin from "./views/ad-horizon-min.vue";
import OnlineHorizonMin from "./views/online-horizon-min.vue";
import TrafficHorizonMin from "./views/traffic-horizon-min.vue";
import OnlineHorizon from "./views/online-horizon.vue";
import AdHorizon from "./views/ad-horizon.vue";
import TrafficHorizon from "./views/traffic-horizon.vue";

import OeroAdHorizonMin from "./views/Oero/ad-horizon-min.vue";
import OeroOnlineOmhMin from "./views/Oero/online-OMH-min.vue";
import OeroTrafficHorizonMin from "./views/Oero/traffic-horizon-min.vue";
import OeroOnlineHorizon from "./views/Oero/online-horizon.vue";
import OeroAdHorizon from "./views/Oero/ad-horizon.vue";
import OeroTrafficHorizon from "./views/Oero/traffic-horizon.vue";

import {useRoute} from "vue-router";
import {computed, nextTick, provide, ref, watch} from "vue";

const route = useRoute();
const brand = ref(route.params.brand)

const isNormalized = ref(false)
const bandsInput = ref(4)
const isShow = ref(true)
const bands = computed(() => parseFloat(bandsInput.value))

provide('isNormalized', isNormalized)

watch([bands, isNormalized], async (newVal) => {
  console.log('watch bands', newVal)
  isShow.value = false
  await nextTick()
  isShow.value = true
})
</script>

<style scoped lang="scss">

</style>
