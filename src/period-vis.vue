<template>
  <h1>{{`${brand} 4月18日——4月25日数据`}}</h1>
  <template v-if="brand === 'sisley'">
    <online-time></online-time>
    <ad-time></ad-time>
    <traffic-time></traffic-time>
  </template>
  <template v-else>
    <oero-online-time></oero-online-time>
    <oero-ad-time></oero-ad-time>
    <oero-traffic-time></oero-traffic-time>
  </template>
</template>

<script setup>
import OnlineTime from "./views/online-time.vue";
import AdTime from "./views/ad-time.vue";
import TrafficTime from "./views/traffic-time.vue";

import OeroOnlineTime from "./views/Oero/online-time.vue";
import OeroAdTime from "./views/Oero/ad-time.vue";
import OeroTrafficTime from "./views/Oero/traffic-time.vue";

import {useRoute} from "vue-router";
import {ref} from "vue";

const route = useRoute();
const brand = ref(route.params.brand)
</script>

<style scoped lang="scss">

</style>
