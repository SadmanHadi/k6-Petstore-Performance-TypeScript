import { check, sleep, group } from 'k6';
import { request } from '../utils/baseApi';
import { generateReports } from '../utils/summary';

// 1. Dynamic Configuration Selection
import { smokeConfig, smokeThresholds } from '../configs/smoke';
import { loadConfig, loadThresholds } from '../configs/load';
import { stressConfig, stressThresholds } from '../configs/stress';
import { soakConfig, soakThresholds } from '../configs/soak';
import { spikeConfig, spikeThresholds } from '../configs/spike';

const profileName = __ENV.PROFILE || 'smoke';

const configMap: Record<string, any> = {
  smoke: { executor: smokeConfig, thresholds: smokeThresholds },
  load: { executor: loadConfig, thresholds: loadThresholds },
  stress: { executor: stressConfig, thresholds: stressThresholds },
  soak: { executor: soakConfig, thresholds: soakThresholds },
  spike: { executor: spikeConfig, thresholds: spikeThresholds },
};

const activeConfig = configMap[profileName] || configMap.smoke;

// 2. Performance Options
export const options = {
  scenarios: {
    default: activeConfig.executor,
  },
  thresholds: activeConfig.thresholds,
};

// 3. Main Test Scenario
export default function () {
  const timestamp = Date.now();
  const petId = Math.floor(Math.random() * 1000000) + timestamp % 1000000;
  
  const testPet = {
    id: petId,
    name: `K6-Generic-Pet-${timestamp}`,
    status: 'available',
    photoUrls: ['https://example.com/pet.jpg'],
    tags: [{ id: 1, name: 'generic-performance-test' }]
  };

  group('Pet CRUD Lifecycle', () => {
    // TC-PET-001: Create Pet
    const createRes = request('POST', '/v2/pet', testPet, { tags: { name: 'CreatePet' } });
    check(createRes, {
      '[TC-PET-001] [Create] Status is 200': (r) => r.status === 200,
    });

    sleep(1); 

    // TC-PET-002: Read Pet (With resilience polling)
    const getRes = request('GET', `/v2/pet/${petId}`, null, { 
      tags: { name: 'GetPetById' },
      maxRetries: 3,
      retryDelay: 2
    });
    check(getRes, {
      '[TC-PET-002] [Read] Status is 200': (r) => r.status === 200,
      '[TC-PET-002] [Read] Name is correct': (r) => r.json('name') === testPet.name,
    });

    // TC-PET-003: Update Pet
    const updateData = { ...testPet, status: 'sold' };
    const updateRes = request('PUT', '/v2/pet', updateData, { tags: { name: 'UpdatePet' } });
    check(updateRes, {
      '[TC-PET-003] [Update] Status is 200': (r) => r.status === 200,
    });

    sleep(1);

    // TC-PET-004: Delete Pet (With resilience polling)
    const deleteRes = request('DELETE', `/v2/pet/${petId}`, null, { 
      tags: { name: 'DeletePet' },
      maxRetries: 3,
      retryDelay: 2
    });
    check(deleteRes, {
      '[TC-PET-004] [Delete] Status is 200': (r) => r.status === 200,
    });
  });

  group('Pet Search', () => {
    // TC-PET-005: Search Pets
    const listRes = request('GET', '/v2/pet/findByStatus?status=available', null, { tags: { name: 'GetPetsByStatus' } });
    check(listRes, {
      '[TC-PET-005] [Search] Status is 200': (r) => r.status === 200,
      '[TC-PET-005] [Search] Results found': (r) => Array.isArray(r.json()) && (r.json() as any).length > 0,
    });
  });

  sleep(1);
}

// 4. Result Reporting
export function handleSummary(data: any) {
  return generateReports(data, profileName);
}
