/**
 * Prueba de rendimiento con k6
 * Instalar: https://k6.io/docs/getting-started/installation/
 * Ejecutar:  k6 run k6-load-test.js
 *
 * Objetivo: 100 req/s, p95 < 50ms
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const latency  = new Trend('prediction_latency', true);
const errorRate = new Rate('errors');

export const options = {
  scenarios: {
    constant_rps: {
      executor:        'constant-arrival-rate',
      rate:            100,       // 100 peticiones por segundo
      timeUnit:        '1s',
      duration:        '30s',     // 30 segundos de carga sostenida
      preAllocatedVUs: 20,
      maxVUs:          50,
    },
  },
  thresholds: {
    // El p95 debe ser menor a 50ms
    'prediction_latency': ['p(95)<50'],
    // Menos del 1% de errores
    'errors':             ['rate<0.01'],
    // http_req_duration general también debe cumplir
    'http_req_duration':  ['p(95)<50'],
  },
};

// Casos de prueba variados para simular uso real
const TEST_CASES = [
  {
    hour: 7, month: 1, day_of_week: 0,
    weather_type: 'rain', intensity: 'heavy', sunrise_sunset: 'night',
    is_windy: true, humidity_pct: 95, visibility_mi: 1,
    temperature_c: 2, traffic_signal: false, junction: true, crossing: false,
  },
  {
    hour: 14, month: 7, day_of_week: 2,
    weather_type: 'clear', intensity: 'normal', sunrise_sunset: 'day',
    is_windy: false, humidity_pct: 40, visibility_mi: 10,
    temperature_c: 28, traffic_signal: true, junction: false, crossing: true,
  },
  {
    hour: 23, month: 12, day_of_week: 5,
    weather_type: 'snow', intensity: 'heavy', sunrise_sunset: 'night',
    is_windy: true, humidity_pct: 88, visibility_mi: 0.5,
    temperature_c: -3, traffic_signal: false, junction: false, crossing: false,
  },
  {
    hour: 8, month: 3, day_of_week: 1,
    weather_type: 'fog', intensity: 'light', sunrise_sunset: 'day',
    is_windy: false, humidity_pct: 70, visibility_mi: 3,
    temperature_c: 12, traffic_signal: true, junction: true, crossing: false,
  },
];

export default function () {
  const payload = TEST_CASES[Math.floor(Math.random() * TEST_CASES.length)];

  const res = http.post(
    'http://localhost:8000/predict',
    JSON.stringify(payload),
    { headers: { 'Content-Type': 'application/json' } },
  );

  const ok = check(res, {
    'status 200':            (r) => r.status === 200,
    'has risk_probability':  (r) => JSON.parse(r.body).risk_probability !== undefined,
    'latency < 50ms':        (r) => r.timings.duration < 50,
  });

  latency.add(res.timings.duration);
  errorRate.add(!ok);
}
