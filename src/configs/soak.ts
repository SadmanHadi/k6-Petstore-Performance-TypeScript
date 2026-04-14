export const soakConfig = {
  executor: 'constant-vus',
  vus: 10,
  duration: '1h',
};

export const soakThresholds = {
  http_req_duration: ['p(95)<500'],
  http_req_failed: ['rate<0.01'],
};
