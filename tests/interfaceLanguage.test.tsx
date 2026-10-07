import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Window } from 'happy-dom';
import React, { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { InterfaceLanguageProvider, useInterfaceLanguage } from '../src/context/InterfaceLanguageContext';

type FetchResponse = { ok: boolean; json: () => Promise<unknown> };
type FetchMock = (input: RequestInfo | URL, init?: RequestInit) => Promise<FetchResponse>;

const globalNames = ['window', 'document', 'navigator', 'localStorage', 'fetch', 'Event', 'StorageEvent', 'IS_REACT_ACT_ENVIRONMENT'];
const originalGlobals = new Map(globalNames.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));

function setGlobal(name: string, value: unknown) {
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
}

function restoreGlobals() {
  for (const [name, descriptor] of originalGlobals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete (globalThis as Record<string, unknown>)[name];
  }
}

function installBrowser(t: test.TestContext, fetchMock: FetchMock) {
  const browser = new Window({ url: 'http://localhost/' });
  setGlobal('window', browser);
  setGlobal('document', browser.document);
  setGlobal('navigator', browser.navigator);
  setGlobal('localStorage', browser.localStorage);
  setGlobal('fetch', fetchMock);
  setGlobal('Event', browser.Event);
  setGlobal('StorageEvent', browser.StorageEvent);
  setGlobal('IS_REACT_ACT_ENVIRONMENT', true);

  const container = browser.document.createElement('div');
  browser.document.body.append(container);
  const root = createRoot(container);
  t.after(async () => {
    await act(async () => root.unmount());
      await browser.happyDOM.abort();
      restoreGlobals();
  });
  return { browser, container, root };
}

function Harness() {
  const { uiLanguage, setUiLanguage, error } = useInterfaceLanguage();
  const [editorText, setEditorText] = useState('unsaved editor content');
  return (
    <>
      <span data-testid="language">{uiLanguage}</span>
      <span data-testid="editor">{editorText}</span>
      <span data-testid="error">{String(error)}</span>
      <button onClick={() => setEditorText('edited content')}>Edit</button>
      <button onClick={() => void setUiLanguage('fr')}>Switch to French</button>
    </>
  );
}

async function renderProvider(root: Root) {
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={['/workspace/settings']}>
        <InterfaceLanguageProvider><Harness /></InterfaceLanguageProvider>
      </MemoryRouter>,
    );
  });
}

function jsonResponse(body: unknown, ok = true): FetchResponse {
  return { ok, json: async () => body };
}

function identity(storage: Storage, userId: string, token: string, uiLanguage = 'en') {
  storage.setItem('token', token);
  storage.setItem('user', JSON.stringify({ _id: userId, uiLanguage }));
}

function text(container: HTMLElement, testId: string) {
  return container.querySelector(`[data-testid="${testId}"]`)?.textContent;
}

test('a delayed preference GET cannot overwrite a newer UI language choice', async (t) => {
  let resolveGet!: (response: FetchResponse) => void;
  const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
  const browserEnv = installBrowser(t, async (input, init) => {
    requests.push({ input, init });
    if (init?.method === 'PUT') return jsonResponse({ uiLanguage: 'fr' });
    return new Promise((resolve) => { resolveGet = resolve; });
  });
  identity(browserEnv.browser.localStorage, 'account-a', 'token-a');

  await renderProvider(browserEnv.root);
  await act(async () => {
    browserEnv.container.querySelector('button:last-of-type')!.dispatchEvent(
      new browserEnv.browser.MouseEvent('click', { bubbles: true }),
    );
    await Promise.resolve();
    await Promise.resolve();
  });
  assert.equal(text(browserEnv.container, 'language'), 'fr');

  await act(async () => {
    resolveGet(jsonResponse({ uiLanguage: 'en' }));
    await Promise.resolve();
    await Promise.resolve();
  });
  assert.equal(text(browserEnv.container, 'language'), 'fr');
  assert.equal(requests.length, 2);
});

test('a UI switch sends only uiLanguage and preserves project data and child editor state', async (t) => {
  const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
  const browserEnv = installBrowser(t, async (input, init) => {
    requests.push({ input, init });
    return jsonResponse({ uiLanguage: init?.method === 'PUT' ? 'fr' : 'en' });
  });
  const storage = browserEnv.browser.localStorage;
  identity(storage, 'account-a', 'token-a');
  storage.setItem('pfe:onboarding:account-a', JSON.stringify({ basics: { language: 'French' } }));
  const projectStorageKeys = ['English', 'French', 'Arabic'].map((language) => {
    const key = `smartpfe:project:account-a:${language.toLowerCase()}`;
    storage.setItem(key, JSON.stringify({ basics: { language }, content: `Keep ${language} content` }));
    return key;
  });
  const projectKeysBefore = ['pfe:onboarding:account-a', ...projectStorageKeys]
    .map((key) => [key, storage.getItem(key)]);

  await renderProvider(browserEnv.root);
  await act(async () => {
    browserEnv.container.querySelector('button:first-of-type')!.dispatchEvent(
      new browserEnv.browser.MouseEvent('click', { bubbles: true }),
    );
  });
  assert.equal(text(browserEnv.container, 'editor'), 'edited content');

  await act(async () => {
    browserEnv.container.querySelector('button:last-of-type')!.dispatchEvent(
      new browserEnv.browser.MouseEvent('click', { bubbles: true }),
    );
    await Promise.resolve();
    await Promise.resolve();
  });

  const putRequest = requests.find(({ init }) => init?.method === 'PUT');
  assert.ok(putRequest);
  assert.deepEqual(JSON.parse(String(putRequest.init?.body)), { uiLanguage: 'fr' });
  assert.deepEqual(
    projectKeysBefore.map(([key]) => [key, storage.getItem(key)]),
    projectKeysBefore,
  );
  assert.ok(requests.every(({ input }) => String(input).endsWith('/auth/preferences')));
  assert.equal(text(browserEnv.container, 'language'), 'fr');
  assert.equal(text(browserEnv.container, 'editor'), 'edited content');
});

test('a delayed response from the previous account cannot change the current account preference', async (t) => {
  let resolveAccountA!: (response: FetchResponse) => void;
  const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
  const browserEnv = installBrowser(t, async (input, init) => {
    requests.push({ input, init });
    const authorization = new Headers(init?.headers).get('Authorization');
    if (authorization === 'Bearer token-a') {
      return new Promise((resolve) => { resolveAccountA = resolve; });
    }
    return jsonResponse({ uiLanguage: 'fr' });
  });
  const storage = browserEnv.browser.localStorage;
  identity(storage, 'account-a', 'token-a');

  await renderProvider(browserEnv.root);
  await act(async () => {
    identity(storage, 'account-b', 'token-b', 'fr');
    browserEnv.browser.dispatchEvent(new browserEnv.browser.Event('user-updated'));
    await Promise.resolve();
    await Promise.resolve();
  });
  assert.equal(text(browserEnv.container, 'language'), 'fr');

  await act(async () => {
    resolveAccountA(jsonResponse({ uiLanguage: 'en' }));
    await Promise.resolve();
    await Promise.resolve();
  });
  assert.equal(text(browserEnv.container, 'language'), 'fr');
  assert.equal(requests.length, 2);
});

test('a cross-tab device preference change updates the interface', async (t) => {
  const browserEnv = installBrowser(t, async () => jsonResponse({ uiLanguage: 'en' }));
  const storage = browserEnv.browser.localStorage;
  storage.setItem('smartpfe:uiLanguage', 'en');
  await renderProvider(browserEnv.root);

  await act(async () => {
    storage.setItem('smartpfe:uiLanguage', 'fr');
    browserEnv.browser.dispatchEvent(new browserEnv.browser.StorageEvent('storage', {
      key: 'smartpfe:uiLanguage',
      newValue: 'fr',
    }));
  });
  assert.equal(text(browserEnv.container, 'language'), 'fr');
});

test('a cross-tab preference update for the same account synchronizes the interface', async (t) => {
  const browserEnv = installBrowser(t, async () => jsonResponse({ uiLanguage: 'en' }));
  const storage = browserEnv.browser.localStorage;
  identity(storage, 'account-a', 'token-a');
  await renderProvider(browserEnv.root);

  await act(async () => {
    storage.setItem('user', JSON.stringify({ _id: 'account-a', uiLanguage: 'fr' }));
    browserEnv.browser.dispatchEvent(new browserEnv.browser.StorageEvent('storage', {
      key: 'user',
      newValue: storage.getItem('user'),
    }));
  });
  assert.equal(text(browserEnv.container, 'language'), 'fr');
});

test('a failed preference save rolls back the optimistic language change', async (t) => {
  const browserEnv = installBrowser(t, async (_input, init) => init?.method === 'PUT'
    ? jsonResponse({ message: 'Unavailable' }, false)
    : jsonResponse({ uiLanguage: 'en' }));
  identity(browserEnv.browser.localStorage, 'account-a', 'token-a');
  await renderProvider(browserEnv.root);

  await act(async () => {
    browserEnv.container.querySelector('button:last-of-type')!.dispatchEvent(
      new browserEnv.browser.MouseEvent('click', { bubbles: true }),
    );
    await Promise.resolve();
    await Promise.resolve();
  });
  assert.equal(text(browserEnv.container, 'language'), 'en');
  assert.equal(text(browserEnv.container, 'error'), 'true');
});

test('English and French dictionaries contain matching keys', () => {
  const readDictionary = (locale: string, namespace: string) => JSON.parse(readFileSync(
    new URL(`../src/locales/${locale}/${namespace}.json`, import.meta.url),
    'utf8',
  ));
  const flattenKeys = (value: Record<string, unknown>, prefix = ''): string[] => Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return child && typeof child === 'object' && !Array.isArray(child)
      ? flattenKeys(child as Record<string, unknown>, path)
      : [path];
  });

  for (const namespace of ['common', 'settings']) {
    const english = flattenKeys(readDictionary('en', namespace)).sort();
    const french = flattenKeys(readDictionary('fr', namespace)).sort();
    assert.deepEqual(french, english, `${namespace} keys must stay aligned`);
  }
});
