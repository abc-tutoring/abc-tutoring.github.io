// Sends fictional, anonymous visitor journeys to the configured PostHog project.
// Run from the repository root with: node scripts/simulate-traffic.cjs

const fs = require('node:fs');
const path = require('node:path');

const configText = fs.readFileSync(path.join(__dirname, '..', 'config.js'), 'utf8');
const token = configText.match(/posthogKey:\s*['"]([^'"]+)['"]/i)?.[1];
const host = configText.match(/posthogHost:\s*['"]([^'"]+)['"]/i)?.[1];

if (!token?.startsWith('phc_') || !host) {
  throw new Error('Add the public PostHog project token and host to config.js first.');
}

const scenarios = [
  { source: 'facebook', subject: 'Mathematics', grade: 'Grade 8', tutor: 'maya-thompson', rate: 48, depth: 6 },
  { source: 'facebook', subject: 'Mathematics', grade: 'Grade 10', tutor: 'alex-rivera', rate: 55, depth: 6 },
  { source: 'facebook', subject: 'Science', grade: 'Grade 9', tutor: 'alex-rivera', rate: 55, depth: 5 },
  { source: 'facebook', subject: 'English', grade: 'Grade 6', tutor: 'daniel-kim', rate: 42, depth: 4 },
  { source: 'facebook', subject: 'Spanish', grade: 'Grade 7', noResults: true },
  { source: 'direct', subject: 'Mathematics', grade: 'Grade 6', tutor: 'maya-thompson', rate: 48, depth: 6 },
  { source: 'direct', subject: 'Science', grade: 'Grade 11', tutor: 'alex-rivera', rate: 55, depth: 3 },
  { source: 'direct', subject: 'History', grade: 'Grade 10', tutor: 'daniel-kim', rate: 42, depth: 2 },
  { source: 'google', subject: 'English', grade: 'Grade 9', tutor: 'daniel-kim', rate: 42, depth: 6 },
  { source: 'google', subject: 'Spanish', grade: 'Grade 5', noResults: true },
  { source: 'community-newsletter', subject: 'Mathematics', grade: 'Grade 4', tutor: 'maya-thompson', rate: 48, depth: 5 },
  { source: 'community-newsletter', subject: 'Science', grade: 'Grade 7', tutor: 'maya-thompson', rate: 48, depth: 1 }
];

const now = Date.now();
const batch = [];

function addEvent(visitorId, event, properties, minuteOffset) {
  batch.push({
    event,
    properties: {
      distinct_id: visitorId,
      $process_person_profile: false,
      simulation: true,
      ...properties
    },
    timestamp: new Date(now + minuteOffset * 60_000).toISOString()
  });
}

scenarios.forEach((scenario, index) => {
  const visitorId = `abc-demo-${now}-${index + 1}`;
  const baseMinute = index * 2;
  const common = {
    traffic_source: scenario.source,
    subject: scenario.subject,
    grade: scenario.grade
  };

  addEvent(visitorId, '$pageview', {
    traffic_source: scenario.source,
    $current_url: `https://abc-tutoring.github.io/?utm_source=${encodeURIComponent(scenario.source)}`
  }, baseMinute);
  addEvent(visitorId, 'homepage_viewed', { traffic_source: scenario.source }, baseMinute);
  addEvent(visitorId, 'tutor_search_submitted', {
    ...common,
    matching_tutor_count: scenario.noResults ? 0 : 1,
    has_matches: !scenario.noResults
  }, baseMinute + 0.2);

  if (scenario.noResults) {
    addEvent(visitorId, 'tutor_search_no_results', {
      ...common,
      matching_tutor_count: 0,
      has_matches: false
    }, baseMinute + 0.25);
    return;
  }

  const booking = {
    ...common,
    tutor_id: scenario.tutor,
    tutor_name: scenario.tutor.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join(' '),
    session_format: index % 3 === 0 ? 'in-person' : 'online',
    hourly_rate: scenario.rate,
    session_date: new Date(now + 3 * 86_400_000).toISOString().slice(0, 10),
    session_time: index % 2 === 0 ? '4:00 PM' : '5:30 PM'
  };

  const funnel = [
    ['tutor_profile_viewed', 0.4],
    ['appointment_time_selected', 0.7],
    ['booking_form_started', 1.0],
    ['booking_review_viewed', 1.4],
    ['booking_completed', 1.8]
  ];

  funnel.slice(0, Math.max(0, scenario.depth - 1)).forEach(([event, offset]) => {
    addEvent(visitorId, event, booking, baseMinute + offset);
  });
});

async function main() {
  const response = await fetch(`${host.replace(/\/$/, '')}/batch/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: token, historical_migration: false, batch })
  });

  if (!response.ok) {
    throw new Error(`PostHog returned HTTP ${response.status}: ${await response.text()}`);
  }

  console.log(`Sent ${batch.length} anonymous fictional events across ${scenarios.length} visitor journeys.`);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
