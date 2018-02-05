import axios from 'axios';
import GITEA_API from './config';

export default {
  request: axios.create({
    baseURL: `${GITEA_API}/api/v1/`,
    params: {
      token: null,
    },
  }),
};
