import { fromPairs, map } from 'ramda';

const get = async url => {
  const r = await fetch(url);
  return r.json();
};

const remove = async url => {
  const r = await fetch(url, {
    method: 'DELETE'
  });
  return r.json();
};

const post = async (url, data) => {
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return r.json();
};

const put = async (url, data) => {
  const r = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return r.json();
};

const baseApiPath = 'api/YOUR_BRIDGE_USERNAME';

const baseApiUrl = `http://192.168.0.13/${baseApiPath}`;

const createRestProxy = resource => {
  const create = data => post(`${baseApiUrl}/${resource}`, data);
  const readAll = () => get(`${baseApiUrl}/${resource}`);
  const readOne = id => get(`${baseApiUrl}/${resource}/${id}`);
  const update = data => put(`${baseApiUrl}/${resource}/${data.id}`, data);
  const remove = data => remove(`${baseApiUrl}/${resource}/${data.id}`);

  return { create, readAll, readOne, update, remove };
};

const resources = ['lights', 'groups', 'rules', 'sensors'];

const api = fromPairs(map(r => [r, createRestProxy(r)], resources));

export default api;
