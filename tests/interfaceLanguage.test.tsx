import './notificationDisplay.test';
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
import ReportStructure from '../src/pages/workspace/ReportStructure/index';
import ReportBuilder from '../src/pages/workspace/ReportBuilder/index';
import Presentation from '../src/pages/workspace/Presentation/index';
import Pitch, { getPitchExportCopy } from '../src/pages/workspace/Pitch/index';
import { OnboardingProvider } from '../src/context/OnboardingContext';
import JuryQASession from '../src/pages/workspace/JuryQA/JuryQASession';

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

const globalNames = ['window', 'document', 'navigator', 'localStorage', 'fetch', 'Event', 'StorageEvent', 'IS_REACT_ACT_ENVIRONMENT', 'HTMLElement', 'Element', 'Node', 'MutationObserver', 'DOMParser', 'getComputedStyle', 'ShadowRoot', 'MediaRecorder'];
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
    { Page: ReportStructure, ns: 'outline', key: 'title', path: '/workspace/report-structure' },
    { Page: ReportBuilder, ns: 'report', key: 'header.title', path: '/workspace/report-builder' },
    { Page: Presentation, ns: 'delivery', key: 'presentation.title', path: '/workspace/presentation' },
    { Page: Pitch, ns: 'delivery', key: 'pitch.title', path: '/workspace/pitch' },
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
        env.root.render(<MemoryRouter initialEntries={[path]}><CreditProvider><AiGenerationProvider><OnboardingProvider><Page /></OnboardingProvider></AiGenerationProvider></CreditProvider></MemoryRouter>);
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

test('report outline UI switching preserves chapter text and all existing content-language choices', async (t) => {
  for (const language of ['English', 'French', 'Arabic']) {
    await t.test(language, async child => {
      const structure = [{ id: 'c-a', title: 'My existing English chapter', collapsed: false,
        children: [{ id: 's-a', title: 'عنوان محفوظ بالعربية', collapsed: false, children: [] }] }];
      const requests: string[] = [];
      const env = installBrowser(child, async (input, options) => {
        assert.equal(options?.method || 'GET', 'GET');
        requests.push(String(input));
        const body = String(input).endsWith('/my-project') ? { _id: 'p', basics: { language }, reportStructureLanguage: language }
          : { reportStructure: structure };
        return { ...jsonResponse(body), headers: new Headers({ 'content-type': 'application/json' }) };
      });
      await act(async () => {
        await i18n.changeLanguage('en');
        env.root.render(<MemoryRouter initialEntries={['/workspace/report-structure']}><CreditProvider><AiGenerationProvider><ReportStructure /></AiGenerationProvider></CreditProvider></MemoryRouter>);
      });
      const initialRequests = requests.length;
      const chapterBefore = [...env.container.querySelectorAll('button')].find(button => button.textContent?.trim() === structure[0].title);
      assert.ok(chapterBefore);
      await act(async () => { await i18n.changeLanguage('fr'); });
      assert.ok(env.container.textContent?.includes(structure[0].title));
      assert.ok(env.container.textContent?.includes(structure[0].children[0].title));
      assert.equal([...env.container.querySelectorAll('button')].find(button => button.textContent?.trim() === structure[0].title), chapterBefore);
      assert.equal(requests.length, initialRequests);
      assert.ok(env.container.textContent?.includes(i18n.t('title', { ns: 'outline', lng: 'fr' })));
    });
  }
});

test('Pitch PDF scaffold follows content language independently of interface locale', async () => {
  const english = getPitchExportCopy('English');
  const french = getPitchExportCopy('French');
  const arabic = getPitchExportCopy('Arabic');
  assert.notDeepEqual(english, french);
  assert.notDeepEqual(english, arabic);
  await i18n.changeLanguage('fr');
  assert.deepEqual(getPitchExportCopy('English'), english);
  assert.deepEqual(getPitchExportCopy('Arabic'), arabic);
  await i18n.changeLanguage('en');
  assert.deepEqual(getPitchExportCopy('French'), french);
  assert.deepEqual(getPitchExportCopy('unknown-language'), english);
});

test('a Jury Q&A answer keeps its question and microphone recording active during a UI switch', async (t) => {
  let requests = 0;
  const env = installBrowser(t, async () => { requests++; throw new Error('No session request expected'); });
  let microphoneStarts = 0;
  let recorderStarts = 0;
  let trackStops = 0;
  let sessionChanges = 0;
  Object.defineProperty(env.browser.navigator, 'mediaDevices', { configurable: true, value: {
    getUserMedia: async () => { microphoneStarts++; return { getTracks: () => [{ stop: () => { trackStops++; } }] }; },
  } });
  class TestRecorder {
    static isTypeSupported() { return true; }
    mimeType = 'audio/webm';
    ondataavailable: unknown;
    onstop: unknown;
    start() { recorderStarts++; }
    stop() { throw new Error('Recording must not stop on locale switch'); }
  }
  setGlobal('MediaRecorder', TestRecorder);
  let countdownTick!: () => void;
  const originalInterval = env.browser.setInterval.bind(env.browser);
  env.browser.setInterval = ((callback: () => void, delay: number) => {
    if (delay === 1000) { countdownTick = callback; return 123456; }
    return originalInterval(callback, delay);
  }) as typeof env.browser.setInterval;
  const initialSession = { _id: 'qa-a', juryAttemptId: 'attempt-a', presentationVersion: 1, pitchVersion: 1,
    status: 'in-progress' as const, questions: [{ id: 'question-a', question: 'Keep this English jury question.',
      category: 'My custom category', difficulty: 'hard' as const, source: 'report' as const }] };
  await act(async () => {
    await i18n.changeLanguage('en');
    env.root.render(<JuryQASession projectId="project-a" attempt={{ _id: 'attempt-a', attemptNumber: 1 }} initialSession={initialSession}
      onSessionChange={() => { sessionChanges++; }} onBackToResults={() => undefined} onCompleted={() => undefined} />);
  });
  const startLabel = i18n.t('qa.startAnswer', { ns: 'jury', lng: 'en' });
  const startButton = [...env.container.querySelectorAll('button')].find(button => button.textContent?.trim() === startLabel);
  assert.ok(startButton);
  await act(async () => { startButton.dispatchEvent(new env.browser.MouseEvent('click', { bubbles: true })); });
  assert.equal(microphoneStarts, 1);
  await act(async () => { countdownTick(); countdownTick(); countdownTick(); });
  assert.equal(recorderStarts, 1);
  await act(async () => { await i18n.changeLanguage('fr'); });
  assert.ok(env.container.textContent?.includes(initialSession.questions[0].question));
  assert.ok(env.container.textContent?.includes(initialSession.questions[0].category));
  assert.ok(env.container.textContent?.includes(i18n.t('qa.finishAnswer', { ns: 'jury', lng: 'fr' })));
  assert.equal(microphoneStarts, 1);
  assert.equal(recorderStarts, 1);
  assert.equal(trackStops, 0);
  assert.equal(requests, 0);
  assert.equal(sessionChanges, 0);
});

test('report, presentation and speech editors retain loaded document content across UI language changes', async (t) => {
  const structure = [{ id: 'c-a', title: 'Existing English chapter', collapsed: false,
    children: [{ id: 's-a', title: 'Existing English section', collapsed: false, children: [] }] }];
  const chapter = { sectionId: 's-a', title: 'Existing English section', contentHtml: '<p>Keep this English report paragraph.</p>',
    contentMarkdown: 'Keep this English report paragraph.', contentLatex: 'Keep this English report paragraph.',
    status: 'in-progress', generatedFrom: [], sourceFingerprint: '', language: 'en' };
  const slide = { id: 'slide-a', title: 'Existing English slide', bullets: ['Keep this English bullet'], notes: 'Keep these English notes', language: 'en' };
  const speech = { slideId: 'slide-a', title: 'Existing English slide', speech: 'Keep this English speech.', tips: ['Keep this speaker tip'], estimatedSeconds: 60, language: 'en' };
  for (const { Page, path, expected } of [
    { Page: ReportBuilder, path: '/workspace/report-builder', expected: 'Keep this English report paragraph.' },
    { Page: Presentation, path: '/workspace/presentation', expected: 'Keep this English bullet' },
    { Page: Pitch, path: '/workspace/pitch', expected: speech.speech },
  ]) {
    await t.test(path, async child => {
      const requests: string[] = [];
      const env = installBrowser(child, async (input, options) => {
        assert.equal(options?.method || 'GET', 'GET');
        requests.push(String(input));
        let body: unknown = {};
        if (String(input).endsWith('/my-project')) body = { _id: 'p', basics: { language: 'English' } };
        if (String(input).endsWith('/report-structure')) body = { reportStructure: structure };
        if (String(input).endsWith('/report-chapters')) body = { reportChapters: [chapter] };
        if (String(input).endsWith('/presentation')) body = { presentation: { durationMinutes: 10, slides: [slide] } };
        if (String(input).endsWith('/pitch')) body = { pitch: { durationMinutes: 10, slides: [speech] } };
        return { ...jsonResponse(body), headers: new Headers({ 'content-type': 'application/json' }) };
      });
      await act(async () => {
        await i18n.changeLanguage('en');
        env.root.render(<MemoryRouter initialEntries={[path]}><CreditProvider><AiGenerationProvider><OnboardingProvider><Page /></OnboardingProvider></AiGenerationProvider></CreditProvider></MemoryRouter>);
      });
      const editableValues = () => [...env.container.querySelectorAll('input, textarea')].map(element => (element as HTMLInputElement).value);
      if (path === '/workspace/report-builder') {
        const sectionButton = [...env.container.querySelectorAll('button')].find(button => button.textContent?.includes('Existing English section'));
        assert.ok(sectionButton);
        await act(async () => { sectionButton.dispatchEvent(new env.browser.MouseEvent('click', { bubbles: true })); });
      }
      const beforeValues = editableValues();
      const editor = env.container.querySelector('[contenteditable="true"]');
      const beforeHtml = editor?.innerHTML;
      assert.ok(env.container.textContent?.includes(expected) || beforeValues.some(value => value.includes(expected)));
      const initialRequests = requests.length;
      await act(async () => { await i18n.changeLanguage('fr'); });
      assert.deepEqual(editableValues(), beforeValues);
      assert.equal(env.container.querySelector('[contenteditable="true"]'), editor);
      assert.equal(editor?.innerHTML, beforeHtml);
      assert.ok(env.container.textContent?.includes(expected) || editableValues().some(value => value.includes(expected)));
      assert.equal(requests.length, initialRequests);
    });
  }
});
import CreditHistory from '../src/pages/workspace/CreditHistory';
import AdminCreditRequests from '../src/pages/admin/AdminCreditRequests';
import AdminCredits from '../src/pages/admin/AdminCredits';
import AdminUsers from '../src/pages/admin/AdminUsers';
import AdminProjects from '../src/pages/admin/AdminProjects';
import BackofficeDashboard from '../src/pages/admin/BackofficeDashboard';

test('credit and admin pages switch interface language without reloading or mutating financial data', async (t) => {
  for (const { Page, path } of [
    { Page: CreditHistory, path: '/workspace/settings/credits' },
    { Page: AdminCreditRequests, path: '/admin/credit-requests' },
    { Page: AdminCredits, path: '/admin/credits' },
    { Page: AdminUsers, path: '/admin/users' },
    { Page: AdminProjects, path: '/admin/projects' },
    { Page: BackofficeDashboard, path: '/admin/dashboard' },
  ]) await t.test(path, async child => {
    const requests: string[] = [];
    const env = installBrowser(child, async (input, options) => {
      assert.equal(options?.method || 'GET', 'GET');
      requests.push(String(input));
      let body: unknown = {};
      if (String(input).includes('/credits/history?')) body = { items: [], total: 0, page: 1, pages: 1, limit: 10 };
      if (String(input).includes('/admin/credit-requests')) body = { requests: [] };
      if (String(input).endsWith('/admin/users') || String(input).endsWith('/admin/projects')) body = [];
      if (String(input).endsWith('/admin/dashboard')) body = { totals: { users: 0, students: 0, admins: 0, projects: 0, completedOnboarding: 0, creditsSpent: 0, purchasedFulfilled: 0, walletCredits: 0 }, charts: { studentGrowth: [], projectGrowth: [], onboardingStatus: [], domains: [], actionDemand: [], creditActivity: [], creditMonthly: [] }, recentUsers: [], recentProjects: [], recentFulfillments: [] };
      if (String(input).endsWith('/credits/economy')) body = { settings: { welcomeCredits: 20, dailyPromotionalRefill: 5, timezone: 'Africa/Tunis', enforcementMode: 'shadow', version: 1 }, policies: [], history: [] };
      return { ...jsonResponse(body), headers: new Headers({ 'content-type': 'application/json' }) };
    });
    await act(async () => {
      await i18n.changeLanguage('en');
      env.root.render(<MemoryRouter initialEntries={[path]}><CreditProvider><Page /></CreditProvider></MemoryRouter>);
    });
    const values = () => [...env.container.querySelectorAll('input,select,textarea')].map(e => (e as HTMLInputElement).value);
    const initialValues = values();
    const initialText = env.container.textContent;
    const count = requests.length;
    assert.ok(count > 0);
    await act(async () => { await i18n.changeLanguage('fr'); });
    assert.deepEqual(values(), initialValues);
    assert.notEqual(env.container.textContent, initialText);
    assert.equal(requests.length, count);
  });
});

test('French credit-history filters send canonical status and kind values and survive locale switching', async t => {
  const requests: string[] = [];
  const env = installBrowser(t, async (input, options) => {
    assert.equal(options?.method || 'GET', 'GET');
    requests.push(String(input));
    return { ...jsonResponse({ items: [], total: 0, page: 1, pages: 1, limit: 10 }), headers: new Headers({ 'content-type': 'application/json' }) };
  });
  await act(async () => {
    await i18n.changeLanguage('fr');
    env.root.render(<MemoryRouter initialEntries={['/workspace/settings/credits?view=transactions']}><CreditProvider><CreditHistory /></CreditProvider></MemoryRouter>);
  });
  const selects = [...env.container.querySelectorAll('select')];
  const status = selects.find(s => [...s.options].some(o => o.value === 'reserved'))!;
  const kind = selects.find(s => [...s.options].some(o => o.value === 'admin_adjustment'))!;
  assert.ok(status); assert.ok(kind);
  await act(async () => { status.value = 'reserved'; status.dispatchEvent(new env.browser.Event('change', { bubbles: true })); });
  await act(async () => { kind.value = 'admin_adjustment'; kind.dispatchEvent(new env.browser.Event('change', { bubbles: true })); });
  const query = new URL(requests.at(-1)!, 'http://localhost').searchParams;
  assert.equal(query.get('status'), 'reserved');
  assert.equal(query.get('kind'), 'admin_adjustment');
  assert.equal(query.get('section'), 'transactions');
  const count = requests.length;
  await act(async () => { await i18n.changeLanguage('en'); });
  assert.equal(status.value, 'reserved'); assert.equal(kind.value, 'admin_adjustment');
  assert.equal(requests.length, count);
});

test('a French credit request drawer preserves purchased amount, currency, package and administrator note', async t => {
  const request = { _id: 'r-a', requestedCredits: 1250, packageLabel: 'Original English package', price: 29.5, currency: 'TND', status: 'CONFIRMED', createdAt: '2026-10-07T12:00:00Z', adminNote: 'Original English administrator note.' };
  let calls = 0;
  const env = installBrowser(t, async (input, options) => {
    assert.equal(options?.method || 'GET', 'GET'); calls++;
    const body = String(input).includes('/credits/requests/') ? { request } : { items: [request], total: 1, page: 1, pages: 1, limit: 10 };
    return { ...jsonResponse(body), headers: new Headers({ 'content-type': 'application/json' }) };
  });
  await act(async () => {
    await i18n.changeLanguage('en');
    env.root.render(<MemoryRouter initialEntries={['/workspace/settings/credits?request=r-a']}><CreditProvider><CreditHistory /></CreditProvider></MemoryRouter>);
  });
  const count = calls;
  await act(async () => { await i18n.changeLanguage('fr'); });
  assert.ok(env.browser.document.body.textContent?.includes(request.adminNote));
  assert.ok(env.browser.document.body.textContent?.includes(request.packageLabel));
  assert.ok(env.browser.document.body.textContent?.includes('29,50 TND'));
  assert.ok(env.browser.document.body.textContent?.includes(new Intl.NumberFormat('fr').format(1250)));
  assert.equal(calls, count);
});

test('an unsaved credit-policy timezone choice survives interface switching without an API write', async t => {
  let calls = 0;
  const env = installBrowser(t, async (_input, options) => {
    assert.equal(options?.method || 'GET', 'GET'); calls++;
    return { ...jsonResponse({ settings: { welcomeCredits: 20, dailyPromotionalRefill: 5, timezone: 'Africa/Tunis', enforcementMode: 'shadow', version: 1 }, policies: [], history: [] }), headers: new Headers({ 'content-type': 'application/json' }) };
  });
  await act(async () => { await i18n.changeLanguage('fr'); env.root.render(<AdminCredits />); });
  const select = [...env.container.querySelectorAll('select')].find(s => [...s.options].some(o => o.value === 'Europe/Paris'))!;
  assert.ok(select);
  await act(async () => { select.value = 'Europe/Paris'; select.dispatchEvent(new env.browser.Event('change', { bubbles: true })); });
  const count = calls;
  await act(async () => { await i18n.changeLanguage('en'); });
  assert.equal(select.value, 'Europe/Paris');
  assert.equal(calls, count);
});

import { apiMessage, displayApiMessage } from '../src/lib/apiMessage';
import { fetchApi } from '../src/lib/api';
import Login from '../src/pages/auth/Login';
import { NotificationProvider } from '../src/context/NotificationContext';
import NotificationBell from '../src/components/layout/NotificationBell';

test('known API error metadata follows interface language, preserving arbitrary errors and request content', async t => {
  const payload = { language: 'Arabic', content: 'Original English paragraph', action: 'Translate' };
  const calls: { headers: Headers; body: unknown }[] = [];
  const env = installBrowser(t, async (_input, options) => {
    calls.push({ headers: options?.headers as Headers, body: options?.body });
    return { ok: false, json: async () => ({ message: 'Invalid email or password', messageKey: 'auth.invalidCredentials', code: 'TEST_CODE', extra: 'Keep server details' }), headers: new Headers({ 'content-type': 'application/json' }) };
  });
  await i18n.changeLanguage('fr');
  let error: any;
  try { await fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(payload) }); } catch (caught) { error = caught; }
  assert.ok(error instanceof Error);
  assert.equal(error.message, 'Invalid email or password');
  assert.equal(displayApiMessage(apiMessage(error)), i18n.t('auth.invalidCredentials', { ns: 'server', lng: 'fr' }));
  assert.equal(error.code, 'TEST_CODE'); assert.equal(error.extra, 'Keep server details');
  assert.deepEqual(JSON.parse(String(calls[0].body)), payload);
  assert.equal(calls[0].headers.get('X-UI-Language'), 'fr');
  const descriptor = apiMessage(error);
  await i18n.changeLanguage('en');
  assert.equal(displayApiMessage(descriptor), 'Invalid email or password');
  assert.equal(error.message, 'Invalid email or password');
  assert.equal(displayApiMessage(apiMessage({ message: 'Custom English server detail', messageKey: 'unknown.notShipped' })), 'Custom English server detail');
  assert.equal(displayApiMessage(apiMessage(new Error('Custom English server detail'))), 'Custom English server detail');
  assert.equal(calls.length, 1);
});

test('a visible login API failure switches language without another authentication request', async t => {
  let calls = 0;
  const env = installBrowser(t, async (_input, options) => {
    assert.equal(options?.method, 'POST'); calls++;
    return { ok: false, json: async () => ({ message: 'Invalid email or password', messageKey: 'auth.invalidCredentials' }), headers: new Headers({ 'content-type': 'application/json' }) };
  });
  await act(async () => { await i18n.changeLanguage('en'); env.root.render(<MemoryRouter><Login /></MemoryRouter>); });
  const form = env.container.querySelector('form')!;
  await act(async () => { form.dispatchEvent(new env.browser.Event('submit', { bubbles: true, cancelable: true })); });
  assert.ok(env.container.textContent?.includes('Invalid email or password'));
  await act(async () => { await i18n.changeLanguage('fr'); });
  assert.ok(env.container.textContent?.includes(i18n.t('auth.invalidCredentials', { ns: 'server', lng: 'fr' })));
  assert.equal(calls, 1);
});

test('notification history and SSE toasts switch language without reconnecting or changing read state', async t => {
  const requests: string[] = [];
  const saved = { _id: 'n-history', title: 'Actors section is ready', message: 'The Actors section has been generated successfully.', type: 'generation_complete', feature: 'actors', read: false, createdAt: '2026-10-08T12:00:00Z' };
  const custom = { _id: 'n-custom', title: 'Existing English custom title', message: 'Existing English custom content', type: 'info', read: false, createdAt: '2026-10-08T11:00:00Z' };
  const env = installBrowser(t, async (input, options) => {
    assert.equal(options?.method || 'GET', 'GET'); requests.push(String(input));
    return { ...jsonResponse([saved, custom]), headers: new Headers({ 'content-type': 'application/json' }) };
  });
  env.browser.localStorage.setItem('token', 'test-placeholder');
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'EventSource');
  let opens = 0; let closes = 0;
  const listeners = new Map<string, (event: { data: string }) => void>();
  class TestEventSource { onerror: unknown; constructor() { opens++; } addEventListener(name: string, callback: (event: { data: string }) => void) { listeners.set(name, callback); } close() { closes++; } }
  setGlobal('EventSource', TestEventSource);
  t.after(() => { if (previous) Object.defineProperty(globalThis, 'EventSource', previous); else delete (globalThis as any).EventSource; });
  await act(async () => { await i18n.changeLanguage('en'); env.root.render(<MemoryRouter><NotificationProvider><NotificationBell /></NotificationProvider></MemoryRouter>); });
  const bell = env.container.querySelector('button')!;
  await act(async () => { bell.dispatchEvent(new env.browser.MouseEvent('click', { bubbles: true })); });
  await act(async () => { listeners.get('notification')!({ data: JSON.stringify({ ...saved, _id: 'n-stream' }) }); });
  const count = requests.length;
  await act(async () => { await i18n.changeLanguage('fr'); });
  assert.ok(env.container.textContent?.includes(i18n.t('generation.actors.title', { ns: 'notifications', lng: 'fr' })));
  assert.ok(env.container.textContent?.includes(custom.message));
  assert.ok(env.container.querySelector('[role="status"]')?.textContent?.includes(i18n.t('generation.actors.message', { ns: 'notifications', lng: 'fr' })));
  assert.equal(opens, 1); assert.equal(closes, 0); assert.equal(requests.length, count);
});
