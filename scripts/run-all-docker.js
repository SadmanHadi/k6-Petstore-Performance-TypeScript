const { execSync } = require('child_process');

const profiles = ['smoke', 'load', 'stress', 'spike', 'soak'];

console.log(`\n🚀 Starting Full Docker Execution Suite...\n`);

profiles.forEach(profile => {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(` 🏃 Running Profile: ${profile}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  try {
    execSync(`docker compose run --rm -e PROFILE=${profile} k6`, {
      stdio: 'inherit',
      shell: true,
    });
    console.log(`\n✅ Finished Profile: ${profile}\n`);
  } catch (error) {
    console.warn(`\n⚠️  Profile "${profile}" finished with errors (likely thresholds). Continuing...\n`);
  }
});

console.log(`\n🏁 All 5 Docker profiles have been executed.\n`);
