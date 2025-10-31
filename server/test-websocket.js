/**
 * WebSocket Test Client
 */

const io = require('socket.io-client');
const axios = require('axios');

const SERVER_URL = 'http://localhost:3000';
const socket = io(SERVER_URL);

console.log('🔌 Connecting to WebSocket server...\n');

// Track events received
const eventsReceived = [];

// Set up event listeners
socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server');
  console.log(`   Socket ID: ${socket.id}\n`);
  runTests();
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  process.exit(1);
});

// Listen for all WebSocket events
socket.on('movies:initial', (movies) => {
  eventsReceived.push('movies:initial');
  console.log('📡 Received: movies:initial');
  console.log(`   Movies count: ${movies.length}`);
  if (movies.length > 0) {
    console.log(`   First movie: ${movies[0].title}`);
  }
  console.log();
});

socket.on('movie:added', (movie) => {
  eventsReceived.push('movie:added');
  console.log('📡 Received: movie:added');
  console.log(`   Title: ${movie.title}`);
  console.log(`   Year: ${movie.year}`);
  console.log(`   Votes: ${movie.votes}`);
  console.log();
});

socket.on('movie:voted', (movie) => {
  eventsReceived.push('movie:voted');
  console.log('📡 Received: movie:voted');
  console.log(`   Title: ${movie.title}`);
  console.log(`   Votes: ${movie.votes}`);
  console.log();
});

socket.on('movie:winner', (winner) => {
  eventsReceived.push('movie:winner');
  console.log('🏆 Received: movie:winner');
  console.log(`   Title: ${winner.title}`);
  console.log(`   Final Votes: ${winner.finalVotes}`);
  console.log();
});

socket.on('winners:updated', (winners) => {
  eventsReceived.push('winners:updated');
  console.log('📡 Received: winners:updated');
  console.log(`   Total winners: ${winners.length}`);
  console.log();
});

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null) {
  try {
    const config = { method, url: `${SERVER_URL}${endpoint}` };
    if (data) config.data = data;
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      return error.response.data;
    }
    throw error;
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Starting WebSocket Tests...\n');

  try {
    // Wait a bit for connection to stabilize
    await sleep(500);

    // Test 1: Add a movie (should trigger movie:added)
    console.log('Test 1: Adding a movie...');
    const movieData = {
      id: 'tt0111161',
      title: 'The Shawshank Redemption',
      year: '1994',
      poster: 'https://m.media-amazon.com/images/M/MV5BMDFkYTc0MGEtZmNhMC00ZDIzLWFmNTEtODM1ZmRlYWMwMWFmXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg'
    };
    await apiRequest('POST', '/api/movies', movieData);
    await sleep(1000);

    // Test 2: Vote for the movie (should trigger movie:voted)
    console.log('Test 2: Voting for the movie...');
    await apiRequest('POST', '/api/movies/tt0111161/vote');
    await sleep(1000);

    // Test 3: Vote multiple times to reach winner (should trigger movie:winner and winners:updated)
    console.log('Test 3: Voting to make it a winner (9 more votes)...');
    for (let i = 0; i < 9; i++) {
      await apiRequest('POST', '/api/movies/tt0111161/vote');
      await sleep(200);
    }
    await sleep(1000);

    // Test 4: Get movies list (should trigger movies:initial)
    console.log('Test 4: Fetching movies list...');
    await apiRequest('GET', '/api/movies');
    await sleep(1000);

    // Summary
    console.log('='.repeat(50));
    console.log('📊 Test Summary');
    console.log('='.repeat(50));
    console.log(`Events received: ${eventsReceived.length}`);
    console.log('Event types:');
    const eventCounts = eventsReceived.reduce((acc, event) => {
      acc[event] = (acc[event] || 0) + 1;
      return acc;
    }, {});
    Object.entries(eventCounts).forEach(([event, count]) => {
      console.log(`  - ${event}: ${count}x`);
    });
    console.log();

    // Check if all event types were received
    const expectedEvents = ['movie:added', 'movie:voted', 'movie:winner', 'winners:updated', 'movies:initial'];
    const receivedEventTypes = [...new Set(eventsReceived)];
    const missingEvents = expectedEvents.filter(e => !receivedEventTypes.includes(e));

    if (missingEvents.length === 0) {
      console.log('✅ All WebSocket events working correctly!');
    } else {
      console.log('⚠️  Missing events:', missingEvents.join(', '));
    }

    console.log('\n✨ Tests completed!');
    socket.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    socket.disconnect();
    process.exit(1);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
