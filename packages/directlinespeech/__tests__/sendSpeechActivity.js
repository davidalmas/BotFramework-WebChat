/**
 * @jest-environment jsdom
 */

import 'global-agent/bootstrap';

import { timeouts } from './constants.json';
import createTestHarness from './utilities/createTestHarness';
import MockAudioContext from './utilities/MockAudioContext';
import recognizeActivityAsText from './utilities/recognizeActivityAsText';
import subscribeAll from './utilities/observable/subscribeAll';
import take from './utilities/observable/take';
import waitForConnected from './utilities/waitForConnected';

jest.setTimeout(timeouts.test);

beforeEach(() => {
  global.AudioContext = MockAudioContext;
});

test('should echo back when saying "hello" and "world"', async () => {
  const { directLine, sendTextAsSpeech } = await createTestHarness();

  const connectedPromise = waitForConnected(directLine);
  const activitiesPromise = subscribeAll(take(directLine.activity$, 2));

  await connectedPromise;

  await sendTextAsSpeech('hello');
  await sendTextAsSpeech('world');

  const activities = await activitiesPromise;
  const activityUtterances = Promise.all(activities.map(activity => recognizeActivityAsText(activity)));

  await expect(activityUtterances).resolves.toMatchInlineSnapshot(`
    Array [
      "Hello.",
      "World.",
    ]
  `);
});

test('should echo back "Bellevue" when saying "bellview"', async () => {
  const { directLine, sendTextAsSpeech } = await createTestHarness();

  const connectedPromise = waitForConnected(directLine);
  const activitiesPromise = subscribeAll(take(directLine.activity$, 1));

  await connectedPromise;

  await sendTextAsSpeech('bellview');

  const activities = await activitiesPromise;
  const activityUtterances = Promise.all(activities.map(activity => recognizeActivityAsText(activity)));

  await expect(activityUtterances).resolves.toMatchInlineSnapshot(`
    Array [
      "Bellevue.",
    ]
  `);
});

test('should not synthesis when "speak" is empty', async () => {
  const { directLine, sendTextAsSpeech } = await createTestHarness();

  const connectedPromise = waitForConnected(directLine);
  const activitiesPromise = subscribeAll(take(directLine.activity$, 1));

  await connectedPromise;

  // "Don't speak XXX" command will not send "speak" property on respond.
  await sendTextAsSpeech("Don't speak anything.");

  const activities = await activitiesPromise;
  const activityUtterances = await Promise.all(activities.map(activity => recognizeActivityAsText(activity)));

  expect(activityUtterances).toHaveProperty('length', 1);
  expect(activityUtterances[0]).toBeFalsy();
});