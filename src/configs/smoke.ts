export const smokeConfig = {
  executor: 'constant-vus',
  vus: 1,
  duration: '10s',
};

export const smokeThresholds = {
  http_req_duration: ['p(95)<1000'],
  http_req_failed: ['rate<0.01'],
};
