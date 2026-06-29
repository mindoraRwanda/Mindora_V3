/* global console */
// TEMPORARY STUB — delete this file once the real User Service (Theodora's branch) is merged.
// Mimics GET /api/v1/users/:userId/preferences so sendPushNotification can be tested end-to-end
// without the real service running.

import express from 'express';

// Replace this with a token generated from fcm-test.html before running.
const STUB_FCM_TOKEN = 'ewu_b2MWFiIIyCAp5zuaCH:APA91bE8qfwZyHM2PA4wSchZ8MKttI0b-_oVdF52VftOu6qkwMs7KOZXk_cMvYMnTWmjyvo13bUQ_oVGHKDPI1X8DdeYPAKNijVRqjsIhTRoEwMSMbfa5to';

const PORT = 3002; // must match USER_SERVICE_URL in .env (default: http://localhost:3002)

const app = express();


const TEST_USERS = {
  'patientId': {
    fcmToken: STUB_FCM_TOKEN,
    email: 'g.njunge@alustudent.com',
    phoneNumber: '+250795682259'
  },
  'therapistId': {
    fcmToken: STUB_FCM_TOKEN,
    email: 'g.njunge@alustudent.com',
    phoneNumber: '+250795682259'
  }
};

app.get('/api/v1/users/:userId/preferences', (req, res) => {
  const user = TEST_USERS[req.params.userId] ?? TEST_USERS['patientId'];
  res.json(user);
});

// Catch-all so unexpected routes are visible rather than silently hanging.
app.use((req, res) => {
  console.warn(`[stub-user-service] Unexpected request: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'not found' });
});

app.listen(PORT, () => {
  console.log(`[stub-user-service] Listening on http://localhost:${PORT}`);
  console.log(`[stub-user-service] FCM token stub: ${STUB_FCM_TOKEN}`);
});
