// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import Vue from 'vue';
import VueRouter from 'vue-router';
import BootstrapVue from 'bootstrap-vue';
import App from './App';

Vue.use(BootstrapVue);
Vue.use(VueRouter);


Vue.config.productionTip = false;

const router = new VueRouter({
  mode: 'history',
  /*
  We just add one route
   */
  routes: [{
    // Wildcard path
    path: '*',
    // Specify the component to be rendered for this route
    component: App,
    // Inject  props based on route.query values (our query parameters!)
    props: route => ({
      to: route.query.to,
      stage: route.query.stage,
      bg: route.query.bg,
    }),
  }],
});

/* eslint-disable no-new */
new Vue({
  router,
  el: '#app',
  template: '<App/>',
  components: {
    App,
  },
});
