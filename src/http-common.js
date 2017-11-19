import axios from 'axios';

export default {
  request: axios.create({
    baseURL: 'http://localhost:3000/api/v1/',
    params: {
      token: null,
    },
  }),
};
