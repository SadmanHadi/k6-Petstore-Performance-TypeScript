export const stressConfig = {
  executor: 'ramping-vus',
  startVUs: 0,
  stages: [
    { duration: '20s', target: 50 },
    { duration: '40s', target: 50 },
    { duration: '20s', target: 0 },
  ],
};

export const stressThresholds = {
  http_req_duration: ['p(95)<1000'], // Allowing slightly more latency for stress
  http_req_failed: ['rate<0.05'],    // Higher error tolerance for stress
};
