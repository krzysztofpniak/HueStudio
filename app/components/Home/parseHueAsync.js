import ParseWorker from './parse.worker';

const workerToAsync = Worker => data =>
  new Promise((resolve, reject) => {
    const worker = Worker();
    worker.onmessage = function(event) {
      resolve(event.data);
      worker.terminate();
    };
    worker.postMessage(data);
  });

const parseHueAsync = workerToAsync(ParseWorker);

export default parseHueAsync;
