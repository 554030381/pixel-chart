import {createRouter, createWebHashHistory} from 'vue-router';
import PixelChart from "./pixel-chart.vue";
import HorizonChart from "./horizon-chart.vue";
import OMHChart from "./OMH.vue";
import PeriodicVis from "./period-vis.vue";
import ParallelAxis from "./parallel-axis.vue";
import Link from "./link.vue";

const routes = [
  {
    path: '/',
    name: 'Link',
    component: Link
  },
  {
    path: '/:brand/pixel-chart',
    name: 'PixelChart',
    component: PixelChart
  },
  {
    path: '/:brand/horizon-graph',
    name: 'HorizonGraph',
    component: HorizonChart
  },
  {
    path: '/:brand/omh',
    name: 'OMH',
    component: OMHChart
  },
  {
    path: '/:brand/periodic-vis',
    name: 'PeriodicVis',
    component: PeriodicVis
  },
  {
    path: '/:brand/parallel-axis',
    name: 'ParallelAxis',
    component: ParallelAxis
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
