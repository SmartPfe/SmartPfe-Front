import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { Window } from 'happy-dom';
import React, { act, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { InterfaceLanguageProvider, useInterfaceLanguage } from '../src/context/InterfaceLanguageContext';
import { SelectField, OptionCards, MultiSelectChips } from '../src/components/onboarding/FormControls';
import GoogleLoginButton from '../src/components/GoogleLoginButton';
import i18n from '../src/lib/i18n';
import Signup from '../src/pages/auth/Signup';
import { displayOptions } from '../src/lib/onboardingOptions';
import { AiGenerationProvider, useAiGeneration } from '../src/context/AiGenerationContext';
import FloatingAiDock from '../src/components/ai/FloatingAiDock';
import RichTextEditor from '../src/pages/workspace/ProblemStatement/components/RichTextEditor';
import { useActors } from '../src/pages/workspace/Actors/hooks/useActors';
import { RequirementsTable } from '../src/pages/workspace/FunctionalRequirements/index';
import FunctionalRequirements from '../src/pages/workspace/FunctionalRequirements/index';
import NonFunctionalRequirements from '../src/pages/workspace/NonFunctionalRequirements/index';
import ProductBacklog from '../src/pages/workspace/ProductBacklog/index';
import Actors from '../src/pages/workspace/Actors';
import ExistingSolutions from '../src/pages/workspace/ExistingSolutions/index';
import { CreditProvider } from '../src/context/CreditContext';

test('Google SDK bootstrap follows account/device UI preference and ignores content language', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const bootstrap = html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
  assert.ok(bootstrap);
  const cases = [
    { token: 'test-session', user: '{"_id":"u","uiLanguage":"fr","language":"English"}', device: 'en', expected: 'fr' },
    { token: 'test-session', user: '{"_id":"u","uiLanguage":"en","language":"French"}', device: 'fr', expected: 'en' },
    { token: 'test-session', user: '{"_id":"u","language":"French"}', device: 'fr', expected: 'en' },
    { token: null, user: '{"_id":"u","uiLanguage":"en"}', device: 'fr', expected: 'fr' },
    { token: 'test-session', user: 'invalid-json', device: 'fr', expected: 'fr' },
    { token: null, user: null, device: null, expected: 'en' },
  ];
  for (const sample of cases) {
    const appended: any[] = [];
    runInNewContext(bootstrap, {
      localStorage: { getItem: (key: string) => ({ token: sample.token, user: sample.user, 'smartpfe:uiLanguage': sample.device }[key] ?? null) },
      document: { createElement: () => ({}), head: { appendChild: (script: any) => appended.push(script) } },
    });
    assert.equal(appended.length, 1);
    assert.equal(appended[0].src, `https://accounts.google.com/gsi/client?hl=${sample.expected}`);
  }
});

type FetchResponse = { ok: boolean; json: () => Promise<unknown> };
type FetchMock = (input: RequestInfo | URL, init?: RequestInit) => Promise<FetchResponse>;

const globalNames = ['window', 'document', 'navigator', 'localStorage', 'fetch', 'Event', 'StorageEvent', 'IS_REACT_ACT_ENVIRONMENT', 'HTMLElement', 'Element', 'Node', 'MutationObserver', 'DOMParser', 'getComputedStyle', 'ShadowRoot'];
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
  for (const name of ['HTMLElement', 'Element', 'Node', 'MutationObserver', 'DOMParser', 'ShadowRoot']) setGlobal(name, (browser as any)[name]);
  setGlobal('getComputedStyle', browser.getComputedStyle.bind(browser));

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
    return child && typeof child === 'object'
      ? flattenKeys(child as Record<string, unknown>, path)
      : [path];
  });

  const namespaces = readdirSync(new URL('../src/locales/en/', import.meta.url)).filter(file => file.endsWith('.json')).map(file => file.slice(0, -5));
  assert.deepEqual(readdirSync(new URL('../src/locales/fr/', import.meta.url)).filter(file => file.endsWith('.json')).sort(), namespaces.map(namespace => namespace + '.json').sort());
  for (const namespace of namespaces) {
    const english = flattenKeys(readDictionary('en', namespace)).sort();
    const french = flattenKeys(readDictionary('fr', namespace)).sort();
    assert.deepEqual(french, english, `${namespace} keys must stay aligned`);
  }
});

test('translated UI messages preserve interpolation arguments', () => {
  const namespaces = readdirSync(new URL('../src/locales/en/', import.meta.url)).filter(file => file.endsWith('.json'));
  const entries = (value: Record<string, unknown>, prefix = ''): [string, string][] => Object.entries(value).flatMap(([key, child]) => {
    const name = prefix ? `${prefix}.${key}` : key;
    return child && typeof child === 'object'
      ? entries(child as Record<string, unknown>, name)
      : typeof child === 'string' ? [[name, child] as [string, string]] : [];
  });
  for (const namespace of namespaces) {
    const english = entries(JSON.parse(readFileSync(new URL(`../src/locales/en/${namespace}`, import.meta.url), 'utf8')));
    const french = new Map(entries(JSON.parse(readFileSync(new URL(`../src/locales/fr/${namespace}`, import.meta.url), 'utf8'))));
    const argumentsOf = (message: string) => [...message.matchAll(/{{\s*([^},]+)(?:,[^}]*)?\s*}}/g)].map(match => match[1].trim()).sort();
    for (const [key, message] of english) {
      assert.deepEqual(argumentsOf(french.get(key) || ''), argumentsOf(message), `${namespace}:${key} interpolation must match`);
    }
  }
});

function OnboardingControlsHarness() {
  const { uiLanguage, setUiLanguage } = useInterfaceLanguage();
  const [generationLanguage, setGenerationLanguage] = useState('Arabic');
  const [projectType, setProjectType] = useState('Academic Project');
  const [developmentTypes, setDevelopmentTypes] = useState(['Web Application']);
  const french = uiLanguage === 'fr';
  return <>
    <SelectField id="generation-language-test" label="Generation language" value={generationLanguage} onChange={setGenerationLanguage}
      options={displayOptions(['English', 'French', 'Arabic'], 'generationLanguage', i18n.getFixedT(uiLanguage, 'onboarding'))} />
    <OptionCards label="Project type" value={projectType} onChange={setProjectType} options={[
      { value: 'Academic Project', label: french ? 'Projet académique' : 'Academic Project', description: '', icon: 'school' },
      { value: 'Research Project', label: french ? 'Projet de recherche' : 'Research Project', description: '', icon: 'biotech' },
    ]} />
    <MultiSelectChips label="Development types" values={developmentTypes} onChange={setDevelopmentTypes}
      options={[{ value: 'Web Application', label: french ? 'Application web' : 'Web Application' }, { value: 'Other', label: french ? 'Autre' : 'Other' }]} />
    <output data-testid="stored-options">{JSON.stringify({ generationLanguage, projectType, developmentTypes })}</output>
    <button onClick={() => void setUiLanguage(uiLanguage === 'fr' ? 'en' : 'fr')}>Switch interface</button>
  </>;
}

test('French onboarding controls keep canonical generation, project type and development selections', async (t) => {
  const browserEnv = installBrowser(t, async () => jsonResponse({}));
  browserEnv.browser.localStorage.setItem('smartpfe:uiLanguage', 'fr');
  await act(async () => browserEnv.root.render(<MemoryRouter><InterfaceLanguageProvider><OnboardingControlsHarness /></InterfaceLanguageProvider></MemoryRouter>));
  const select = browserEnv.container.querySelector('select')!;
  assert.equal(select.value, 'Arabic');
  assert.equal(select.selectedOptions[0].textContent, 'Arabe');
  const clickText = async (label: string) => {
    const button = [...browserEnv.container.querySelectorAll('button')].find(item => item.textContent?.includes(label));
    assert.ok(button, `button ${label} exists`);
    await act(async () => button.dispatchEvent(new browserEnv.browser.MouseEvent('click', { bubbles: true })));
  };
  await act(async () => {
    select.value = 'French';
    select.dispatchEvent(new browserEnv.browser.Event('change', { bubbles: true }));
  });
  await clickText('Projet de recherche');
  await clickText('Autre');
  const expected = { generationLanguage: 'French', projectType: 'Research Project', developmentTypes: ['Web Application', 'Other'] };
  assert.deepEqual(JSON.parse(text(browserEnv.container, 'stored-options')), expected);
  await clickText('Switch interface');
  assert.equal(select.value, 'French');
  assert.equal(select.querySelector('option[value="French"]')?.textContent, 'French');
  assert.deepEqual(JSON.parse(text(browserEnv.container, 'stored-options')), expected);
  const selectedCard = [...browserEnv.container.querySelectorAll('button')].find(item => item.textContent?.includes('Research Project'));
  assert.equal(selectedCard?.getAttribute('aria-pressed'), 'true');
  const selectedChip = [...browserEnv.container.querySelectorAll('button')].find(item => item.textContent?.trim() === 'Other');
  assert.equal(selectedChip?.getAttribute('aria-pressed'), 'true');
});

test('changing the Google button locale re-renders its text without restarting authentication', async (t) => {
  const browserEnv = installBrowser(t, async () => jsonResponse({}));
  let initializationCount = 0;
  const buttonLocales: string[] = [];
  (browserEnv.browser as unknown as Window & { google: unknown }).google = { accounts: { id: {
    initialize: () => { initializationCount++; },
    renderButton: (_parent: HTMLElement, options: { locale: string }) => { buttonLocales.push(options.locale); },
  } } };
  await act(async () => {
    await i18n.changeLanguage('en');
    browserEnv.root.render(<MemoryRouter><GoogleLoginButton onError={() => undefined} onLoading={() => undefined} /></MemoryRouter>);
  });
  // Let the existing SDK readiness poll settle before comparing locale-only updates.
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 180)); });
  const initializedBeforeSwitch = initializationCount;
  assert.ok(initializedBeforeSwitch >= 1);
  assert.equal(buttonLocales.at(-1), 'en');
  await act(async () => { await i18n.changeLanguage('fr'); });
  assert.equal(buttonLocales.at(-1), 'fr');
  assert.equal(initializationCount, initializedBeforeSwitch);
});

test('visible local signup validation changes language without sending an authentication request', async (t) => {
  let requestCount = 0;
  const browserEnv = installBrowser(t, async () => { requestCount++; return jsonResponse({}); });
  await act(async () => {
    await i18n.changeLanguage('fr');
    browserEnv.root.render(<MemoryRouter><Signup /></MemoryRouter>);
  });
  await act(async () => {
    browserEnv.container.querySelector('form')!.dispatchEvent(new browserEnv.browser.Event('submit', { bubbles: true, cancelable: true }));
  });
  assert.ok(browserEnv.container.textContent?.includes('Le mot de passe doit contenir au moins 6 caractères.'));
  await act(async () => { await i18n.changeLanguage('en'); });
  assert.ok(browserEnv.container.textContent?.includes('Password must be at least 6 characters.'));
  assert.ok(!browserEnv.container.textContent?.includes('Le mot de passe doit contenir au moins 6 caractères.'));
  assert.equal(requestCount, 0);
});

test('a live task changes display language without restarting or aborting its runner', async (t) => {
  const env = installBrowser(t, async () => { throw new Error('No network calls expected'); });
  let runnerCount = 0;
  let taskSignal: AbortSignal | undefined;
  let finish!: (value: string) => void;
  const pending = new Promise<string>(resolve => { finish = resolve; });
  function RunningTask() {
    const { startTask } = useAiGeneration();
    useEffect(() => {
      void startTask({ id: 'stage5-display-test', scope: 'actors', title: 'Actors & Stakeholders',
        subTitle: 'Generating actors with AI...', uiTitleKey: 'analysis:actors.title',
        uiSubTitleKey: 'analysis:actors.tasks.generating', pageRoute: '/workspace/actors',
        runner: async signal => { runnerCount++; taskSignal = signal; return pending; } });
    }, [startTask]);
    return <FloatingAiDock />;
  }
  await act(async () => {
    await i18n.changeLanguage('en');
    env.root.render(<MemoryRouter initialEntries={['/workspace/settings']}><AiGenerationProvider><RunningTask /></AiGenerationProvider></MemoryRouter>);
  });
  assert.ok(env.container.textContent?.includes(i18n.t('actors.title', { ns: 'analysis', lng: 'en' })));
  await act(async () => { await i18n.changeLanguage('fr'); });
  assert.ok(env.container.textContent?.includes(i18n.t('actors.title', { ns: 'analysis', lng: 'fr' })));
  assert.ok(env.container.textContent?.includes(i18n.t('actors.tasks.generating', { ns: 'analysis', lng: 'fr' })));
  assert.equal(runnerCount, 1);
  assert.equal(taskSignal?.aborted, false);
  await act(async () => { finish('unchanged English generated content'); });
});

test('rich-text placeholder and toolbar switch language without replacing content or reporting an edit', async (t) => {
  const env = installBrowser(t, async () => { throw new Error('No network calls expected'); });
  let updates = 0;
  function EditorHarness() {
    const { t: translate } = useTranslation('design');
    return <RichTextEditor content="<p>Keep this English project content.</p>" placeholder={translate('problem.editorPlaceholder')}
      onChange={() => { updates++; }} />;
  }
  await act(async () => { await i18n.changeLanguage('en'); env.root.render(<EditorHarness />); });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });
  const originalEditor = env.container.querySelector('.ProseMirror');
  assert.ok(originalEditor);
  const originalHtml = originalEditor.innerHTML;
  const baselineUpdates = updates;
  await act(async () => { await i18n.changeLanguage('fr'); });
  assert.equal(env.container.querySelector('.ProseMirror'), originalEditor);
  assert.equal(originalEditor.innerHTML, originalHtml);
  assert.equal(updates, baselineUpdates);
  assert.ok(env.container.querySelector('button[title="Gras"]'));
});

test('an empty rich-text editor refreshes its placeholder without reporting a content change', async (t) => {
  const env = installBrowser(t, async () => { throw new Error('No network calls expected'); });
  let updates = 0;
  function EmptyEditorHarness() {
    const { t: translate } = useTranslation('design');
    return <RichTextEditor content="" placeholder={translate('problem.editorPlaceholder')} onChange={() => { updates++; }} />;
  }
  await act(async () => { await i18n.changeLanguage('en'); env.root.render(<EmptyEditorHarness />); });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });
  const paragraph = env.container.querySelector('.ProseMirror p')!;
  assert.equal(paragraph.getAttribute('data-placeholder'), i18n.t('problem.editorPlaceholder', { ns: 'design', lng: 'en' }));
  const baseline = updates;
  await act(async () => { await i18n.changeLanguage('fr'); });
  assert.equal(paragraph.getAttribute('data-placeholder'), i18n.t('problem.editorPlaceholder', { ns: 'design', lng: 'fr' }));
  assert.equal(updates, baseline);
});

test('switching interface language leaves a loaded Actors hook unchanged and sends no save or generation request', async (t) => {
  const requests: string[] = [];
  const actor = { _id: 'actor-a', name: 'External English actor', description: 'Keep this user content', type: 'external', icon: 'api' };
  const env = installBrowser(t, async input => {
    requests.push(String(input));
    const body = String(input).endsWith('/actors') ? { actors: [actor] } : { _id: 'project-a', basics: { language: 'Arabic' }, actorsLanguage: 'Arabic' };
    return { ...jsonResponse(body), headers: new Headers({ 'content-type': 'application/json' }) };
  });
  function ActorHarness() {
    const state = useActors();
    return <output>{JSON.stringify({ actors: state.actors, projectLanguage: state.projectLanguage, actorsLanguage: state.actorsLanguage })}</output>;
  }
  await act(async () => {
    await i18n.changeLanguage('en');
    env.root.render(<MemoryRouter><AiGenerationProvider><ActorHarness /></AiGenerationProvider></MemoryRouter>);
  });
  const original = env.container.textContent;
  assert.ok(original?.includes('External English actor'));
  assert.equal(requests.length, 2);
  await act(async () => { await i18n.changeLanguage('fr'); });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 80)); });
  assert.equal(env.container.textContent, original);
  assert.equal(requests.length, 2);
  assert.ok(original?.includes('"projectLanguage":"ar"'));
});

test('French requirement options preserve canonical priority and status values across a UI switch', async (t) => {
  const env = installBrowser(t, async () => { throw new Error('No network calls expected'); });
  const original = { _id: 'r-a', code: 'FR-01', module: 'My custom English module', title: 'My English title',
    description: 'My unchanged description', priority: 'Must Have' as const, status: 'Draft' as const };
  const changes: Record<string, unknown>[] = [];
  await act(async () => {
    await i18n.changeLanguage('fr');
    env.root.render(<RequirementsTable requirements={[original]} editingId="r-a" onEdit={() => undefined}
      onDelete={() => undefined} onMove={() => undefined} onUpdate={(_id, value) => changes.push(value)} />);
  });
  const [priority, status] = [...env.container.querySelectorAll('select')];
  assert.equal(priority.value, 'Must Have');
  assert.equal(priority.querySelector('option[value="Must Have"]')?.textContent?.trim(), 'Obligatoire');
  assert.equal(status.querySelector('option[value="Draft"]')?.textContent?.trim(), 'Brouillon');
  await act(async () => {
    priority.value = 'Could Have';
    priority.dispatchEvent(new env.browser.Event('change', { bubbles: true }));
    status.value = 'In Review';
    status.dispatchEvent(new env.browser.Event('change', { bubbles: true }));
  });
  assert.deepEqual(changes, [{ priority: 'Could Have' }, { status: 'In Review' }]);
  await act(async () => { await i18n.changeLanguage('en'); });
  assert.equal(changes.length, 2);
  assert.equal(env.container.querySelector('input')?.value, original.module);
  assert.equal(priority.querySelector('option[value="Could Have"]')?.textContent?.trim(), 'Could Have');
});

test('planning and analysis pages render French and change locale without starting requests', async (t) => {
  const pages = [
    { Page: Actors, ns: 'analysis', key: 'actors.title', path: '/workspace/actors' },
    { Page: ExistingSolutions, ns: 'analysis', key: 'solutions.title', path: '/workspace/solutions' },
    { Page: FunctionalRequirements, ns: 'planning', key: 'functional.title', path: '/workspace/functional-requirements' },
    { Page: NonFunctionalRequirements, ns: 'planning', key: 'nonFunctional.title', path: '/workspace/non-functional-requirements' },
    { Page: ProductBacklog, ns: 'planning', key: 'backlog.title', path: '/workspace/backlog' },
  ];
  for (const { Page, ns, key, path } of pages) {
    await t.test(path, async child => {
      const requests: string[] = [];
      const env = installBrowser(child, async (input, options) => {
        assert.equal(options?.method || 'GET', 'GET');
        requests.push(String(input));
        const body = String(input).endsWith('/my-project') ? { _id: 'p', basics: { language: 'Arabic' } } : {};
        return { ...jsonResponse(body), headers: new Headers({ 'content-type': 'application/json' }) };
      });
      await act(async () => {
        await i18n.changeLanguage('fr');
        env.root.render(<MemoryRouter initialEntries={[path]}><CreditProvider><AiGenerationProvider><Page /></AiGenerationProvider></CreditProvider></MemoryRouter>);
      });
      assert.ok(env.container.querySelector('h1')?.textContent?.trim().startsWith(i18n.t(key, { ns, lng: 'fr' })));
      const initialRequests = requests.length;
      assert.ok(initialRequests >= 2);
      await act(async () => { await i18n.changeLanguage('en'); });
      assert.ok(env.container.querySelector('h1')?.textContent?.trim().startsWith(i18n.t(key, { ns, lng: 'en' })));
      assert.equal(requests.length, initialRequests);
    });
  }
});

test('Actors local validation is visible and updates language without a save request', async (t) => {
  const requests: string[] = [];
  const env = installBrowser(t, async (input, options) => {
    assert.equal(options?.method || 'GET', 'GET');
    requests.push(String(input));
    return { ...jsonResponse({}), headers: new Headers({ 'content-type': 'application/json' }) };
  });
  await act(async () => {
    await i18n.changeLanguage('fr');
    env.root.render(<MemoryRouter initialEntries={['/workspace/actors']}><CreditProvider><AiGenerationProvider><Actors /></AiGenerationProvider></CreditProvider></MemoryRouter>);
  });
  const initialRequests = requests.length;
  await act(async () => {
    const saveButton = [...env.container.querySelectorAll('button')].find(button => button.textContent?.trim() === 'Enregistrer maintenant');
    assert.ok(saveButton);
    saveButton.dispatchEvent(new env.browser.MouseEvent('click', { bubbles: true }));
  });
  assert.ok(env.container.textContent?.includes(i18n.t('actors.errors.projectNotReady', { ns: 'analysis', lng: 'fr' })));
  await act(async () => { await i18n.changeLanguage('en'); });
  assert.ok(env.container.textContent?.includes(i18n.t('actors.errors.projectNotReady', { ns: 'analysis', lng: 'en' })));
  assert.equal(requests.length, initialRequests);
});
