// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import Vue from 'vue';
import VModal from 'vue-js-modal';
import BootstrapVue from 'bootstrap-vue';
import App from './App';

Vue.use(VModal);
Vue.use(BootstrapVue);


Vue.config.productionTip = false;

/* eslint-disable no-new */
new Vue({
  el: '#app',
  template: '<App/>',
  components: {
    App,
  },
});
