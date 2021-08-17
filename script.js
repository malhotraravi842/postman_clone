import axios from 'axios';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import prettyBytes from 'pretty-bytes';
import setupEditor from './setupEditor';

const form = document.querySelector('[data-form]');
const queryParamsContainer = document.querySelector('[data-query-params]');
const requestHeadersContainer = document.querySelector(
  '[data-request-headers]',
);
const keyValueTemplate = document.querySelector('[data-key-value-template]');
const queryParamBtn = document.querySelector('[data-add-query-param-btn]');
const requestHeaderBtn = document.querySelector(
  '[data-add-request-header-btn]',
);
const responseSection = document.querySelector('[data-response-section]');
const responseHeadersContainer = document.querySelector(
  '[data-response-headers]',
);

queryParamBtn.addEventListener('click', () => {
  queryParamsContainer.append(createKeyValuePair());
});
requestHeaderBtn.addEventListener('click', () => {
  requestHeadersContainer.append(createKeyValuePair());
});

queryParamsContainer.append(createKeyValuePair());
requestHeadersContainer.append(createKeyValuePair());

axios.interceptors.request.use(request => {
  request.customData = request.customData || {};
  request.customData.startTime = new Date().getTime();
  return request;
});

axios.interceptors.response.use(updateEndTime, e => {
  return Promise.reject(updateEndTime(e.response));
});

function updateEndTime(response) {
  response.customData = response.customData || {};
  response.customData.time =
    new Date().getTime() - response.config.customData.startTime;
  return response;
}

const { requestEditor, updateResponseEditor } = setupEditor();

form.addEventListener('submit', e => {
  e.preventDefault();

  let data;
  try {
    data = JSON.parse(requestEditor.state.doc.toString() || null);
  } catch (e) {
    alert('JSON data is malformed');
    return;
  }

  axios({
    url: document.querySelector('[data-url]').value,
    method: document.querySelector('[data-method]').value,
    params: keyValuePairsToObjects(queryParamsContainer),
    headers: keyValuePairsToObjects(requestHeadersContainer),
    data,
  })
    .catch(e => e)
    .then(response => {
      responseSection.classList.remove('d-none');
      updateResponseDetails(response);
      updateResponseEditor(response.data);
      updateResponseHeaders(response.headers);
      console.log(response);
    });
});

function createKeyValuePair() {
  const element = keyValueTemplate.content.cloneNode(true);
  element.querySelector('[data-remove-btn]').addEventListener('click', e => {
    e.target.closest('[data-key-value-pair]').remove();
  });

  return element;
}

function keyValuePairsToObjects(container) {
  const pairs = container.querySelectorAll('[data-key-value-pair]');
  return [...pairs].reduce((data, pair) => {
    const key = pair.querySelector('[data-key]').value;
    const value = pair.querySelector('[data-value]').value;
    if (key === '') return data;
    return { ...data, [key]: value };
  }, {});
}

function updateResponseDetails(response) {
  responseSection.querySelector('[data-status]').textContent = response.status;
  responseSection.querySelector('[data-time]').textContent =
    response.customData.time;
  responseSection.querySelector('[data-size]').textContent = prettyBytes(
    JSON.stringify(response.data).length +
      JSON.stringify(response.headers).length,
  );
}

function updateResponseHeaders(headers) {
  responseHeadersContainer.innerHTML = '';
  Object.entries(headers).forEach(([key, value]) => {
    const keyElement = document.createElement('div');
    keyElement.textContent = key;
    responseHeadersContainer.append(keyElement);

    const valueElement = document.createElement('div');
    valueElement.textContent = value;
    responseHeadersContainer.append(valueElement);
  });
}
