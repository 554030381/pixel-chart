<template>
  <h1>{{`${brand} 4月18日——4月25日数据`}}</h1>
  <div v-if="brand==='sisley'">
<!--    <everyday></everyday>-->
    <online></online>
    <ad></ad>
    <Traffic></Traffic>
  </div>
  <div v-else>
    <OeroAd></OeroAd>
    <OeroOnline></OeroOnline>
    <OeroTraffic></OeroTraffic>
  </div>
</template>

<script setup>
import Everyday from "./views/everyday.vue";
import Online from "./views/online.vue";
import Ad from "./views/ad.vue";
import Traffic from "./views/traffic.vue";

import OeroOnline from "./views/Oero/online.vue";
import OeroAd from "./views/Oero/ad.vue";
import OeroTraffic from "./views/Oero/traffic.vue";

import {useRoute} from "vue-router";
import {ref} from "vue";

const route = useRoute();
const brand = ref(route.params.brand)
</script>

<style scoped lang="scss">

</style>
