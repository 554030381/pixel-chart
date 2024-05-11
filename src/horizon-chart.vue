<template>
  <h1>{{ `${brand} 4月18日——4月25日数据` }}</h1>
  <input :value="bands" @change="handleChange" placeholder="bands 1~9"/>
  <div v-if="isShow">
    <template v-if="brand==='sisley'">
      <h2>分钟</h2>
      <online-horizon-min :bands="bands"></online-horizon-min>
      <ad-horizon-min :bands="bands"></ad-horizon-min>
      <traffic-horizon-min :bands="bands"></traffic-horizon-min>
      <h2>小时</h2>
      <online-horizon :bands="bands"></online-horizon>
      <ad-horizon :bands="bands"></ad-horizon>
      <traffic-horizon :bands="bands"></traffic-horizon>
    </template>
    <template v-else>
      <h2>分钟</h2>
      <oero-online-horizon-min :bands="bands"></oero-online-horizon-min>
      <oero-ad-horizon-min :bands="bands"></oero-ad-horizon-min>
      <oero-traffic-horizon-min :bands="bands"></oero-traffic-horizon-min>
      <h2>小时</h2>
      <oero-online-horizon :bands="bands"></oero-online-horizon>
      <oero-ad-horizon :bands="bands"></oero-ad-horizon>
      <oero-traffic-horizon :bands="bands"></oero-traffic-horizon>
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
import OeroOnlineHorizonMin from "./views/Oero/online-horizon-min.vue";
import OeroTrafficHorizonMin from "./views/Oero/traffic-horizon-min.vue";
import OeroOnlineHorizon from "./views/Oero/online-horizon.vue";
import OeroAdHorizon from "./views/Oero/ad-horizon.vue";
import OeroTrafficHorizon from "./views/Oero/traffic-horizon.vue";

import {useRoute} from "vue-router";
import {nextTick, ref, watch, watchEffect} from "vue";

const route = useRoute();
const brand = ref(route.params.brand)

const bands = ref(4)
const isShow = ref(true)
const handleChange = (e) => {
  if (!e.target.value) return
  bands.value = parseFloat(e.target.value)
}

watch(bands, async (newVal) => {
  console.log('watch bands', newVal)
  isShow.value = false
  await nextTick()
  isShow.value = true
})
</script>

<style scoped lang="scss">

</style>
