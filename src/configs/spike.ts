export const spikeConfig = {
  executor: 'ramping-vus',
  startVUs: 0,
  stages: [
    { duration: '10s', target: 100 }, // Rapid burst
    { duration: '30s', target: 100 }, // Sustained peak
    { duration: '10s', target: 0 },   // Cool down
  ],
};

export const spikeThresholds = {
  http_req_duration: ['p(95)<1500'], // Higher latency allowed for burst traffic
  http_req_failed: ['rate<0.10'],    // Higher error tolerance for extreme spikes
};
