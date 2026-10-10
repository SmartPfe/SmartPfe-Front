import AccountSettings from "../src/pages/workspace/AccountSettings";
import CreditWalletButton from "../src/components/credits/CreditWalletButton";
import WorkspaceTourProvider, { useWorkspaceTour, tourCardPosition } from '../src/components/tour/WorkspaceTour';
import { passwordPolicyError } from "../src/lib/passwordPolicy";

function TourHarness() {
  const { startTour } = useWorkspaceTour();
  return <div data-tour-root><button data-tour-help onClick={startTour}>Replay tour</button><main data-tour="content"><input defaultValue="unsaved project content" /></main></div>;
}
test('new students receive a five-step bilingual tour without editing or generating project content', async t => {
  const writes: unknown[] = [];
  const env = installBrowser(t, async (url, options) => {
    assert.ok(String(url).endsWith('/auth/workspace-tour'));
    if (options?.method === 'PUT') { writes.push(JSON.parse(String(options.body))); return { ...jsonResponse({ status: 'completed' }), headers: new Headers({ 'content-type': 'application/json' }) }; }
    return { ...jsonResponse({ status: 'pending', eligible: true }), headers: new Headers({ 'content-type': 'application/json' }) };
  });
  env.browser.localStorage.setItem('user', JSON.stringify({ _id: 'new-tour-user' }));
  await act(async () => { await i18n.changeLanguage('en'); env.root.render(<MemoryRouter initialEntries={['/workspace/overview']}><WorkspaceTourProvider sidebarOpen={false} setSidebarOpen={() => {}}><TourHarness /></WorkspaceTourProvider></MemoryRouter>); });
  const dialog = () => env.browser.document.querySelector('[role="dialog"]')!;
  const click = async (text: string) => act(async () => [...dialog().querySelectorAll('button')].find(b => b.textContent === text)!.click());
  assert.ok(dialog().textContent?.includes('Your project is ready'));
  assert.equal((env.container.firstChild as HTMLElement).inert, true);
  await click('Show me around');
  assert.ok(dialog().textContent?.includes('Step 1 of 5'));
  await click('Back'); assert.ok(dialog().textContent?.includes('Show me around'));
  await click('Show me around'); await click('Next');
  assert.ok(dialog().textContent?.includes('Step 2 of 5'));
  await act(async () => { await i18n.changeLanguage('fr'); });
  assert.ok(dialog().textContent?.includes('Étape 2 sur 5')); assert.equal(writes.length, 0);
  await click('Suivant'); await click('Suivant'); await click('Suivant'); await click('C’est parti !');
  assert.equal(env.browser.document.querySelector('[role="dialog"]'), null);
  assert.deepEqual(writes, [{ status: 'completed' }]);
  assert.equal(env.browser.localStorage.getItem('smartpfe:workspace-tour:v1:new-tour-user'), 'completed');
  assert.equal((env.container.firstChild as HTMLElement).inert, false);
  assert.equal(env.container.querySelector('input')!.value, 'unsaved project content');
});

test('existing, finished and ineligible accounts remain uninterrupted but can replay and skip the tour', async t => {
  for (const sample of [{ status: 'inactive', eligible: true }, { status: 'completed', eligible: true }, { status: 'skipped', eligible: true }, { status: 'pending', eligible: false }]) await t.test(sample.status + '/' + sample.eligible, async child => {
    const writes: unknown[] = [];
    const env = installBrowser(child, async (_url, options) => {
      if (options?.method === 'PUT') writes.push(JSON.parse(String(options.body)));
      return { ...jsonResponse(sample), headers: new Headers({ 'content-type': 'application/json' }) };
    });
    await act(async () => { await i18n.changeLanguage('en'); env.root.render(<MemoryRouter><WorkspaceTourProvider sidebarOpen={true} setSidebarOpen={() => {}}><TourHarness /></WorkspaceTourProvider></MemoryRouter>); });
    assert.equal(env.browser.document.querySelector('[role="dialog"]'), null);
    const replay = env.container.querySelector('button')!; replay.focus();
    await act(async () => replay.click());
    assert.ok(env.browser.document.querySelector('[role="dialog"]'));
    await act(async () => env.browser.document.dispatchEvent(new env.browser.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    assert.deepEqual(writes, [{ status: 'skipped' }]);
    assert.equal(env.browser.document.querySelector('[role="dialog"]'), null);
    assert.equal(env.browser.document.activeElement, replay);
  });
});

test('replaying the tour from a project or settings page navigates to overview before the first step', async t => {
  function RoutedTourHarness() {
    const location = useLocation();
    return <><output data-current-route>{location.pathname}</output><TourHarness />{location.pathname === '/workspace/overview' && <section data-tour="overview">Project overview</section>}</>;
  }
  for (const path of ['/workspace/problem-statement', '/workspace/settings/onboarding']) await t.test(path, async t => {
    const env = installBrowser(t, async () => ({ ...jsonResponse({ status: 'inactive', eligible: true }), headers: new Headers({ 'content-type': 'application/json' }) }));
    await act(async () => { await i18n.changeLanguage('en'); env.root.render(<MemoryRouter initialEntries={[path]}><WorkspaceTourProvider sidebarOpen={true} setSidebarOpen={() => {}}><RoutedTourHarness /></WorkspaceTourProvider></MemoryRouter>); });
    assert.equal(env.container.querySelector('[data-current-route]')?.textContent, path);
    assert.equal(env.browser.document.querySelector('[role="dialog"]'), null);
    await act(async () => env.container.querySelector<HTMLButtonElement>('[data-tour-help]')!.click());
    assert.equal(env.container.querySelector('[data-current-route]')?.textContent, '/workspace/overview');
    assert.ok(env.container.querySelector('[data-tour="overview"]'));
    const dialog = env.browser.document.querySelector('[role="dialog"]')!;
    await act(async () => [...dialog.querySelectorAll('button')].find(b => b.textContent === 'Show me around')!.click());
    assert.ok(dialog.textContent?.includes('Your project, at a glance'));
    assert.equal(env.container.querySelector('[data-current-route]')?.textContent, '/workspace/overview');
  });
});

test('tour completion fallback is isolated by account and retries a failed server save', async t => {
  const writes: unknown[] = [];
  const env = installBrowser(t, async (_url, options) => { if (options?.method === 'PUT') writes.push(JSON.parse(String(options.body))); return { ...jsonResponse({ status: 'pending', eligible: true }), headers: new Headers({ 'content-type': 'application/json' }) }; });
  env.browser.localStorage.setItem('user', JSON.stringify({ _id: 'account-a' }));
  env.browser.localStorage.setItem('smartpfe:workspace-tour:v1:account-a', 'skipped');
  await act(async () => env.root.render(<MemoryRouter initialEntries={['/workspace/overview']}><WorkspaceTourProvider key="account-a" sidebarOpen={true} setSidebarOpen={() => {}}><TourHarness /></WorkspaceTourProvider></MemoryRouter>));
  assert.equal(env.browser.document.querySelector('[role="dialog"]'), null);
  assert.deepEqual(writes, [{ status: 'skipped' }]);
  env.browser.localStorage.setItem('user', JSON.stringify({ _id: 'account-b' }));
  await act(async () => env.root.render(<MemoryRouter initialEntries={['/workspace/overview']}><WorkspaceTourProvider key="account-b" sidebarOpen={true} setSidebarOpen={() => {}}><TourHarness /></WorkspaceTourProvider></MemoryRouter>));
  assert.ok(env.browser.document.querySelector('[role="dialog"]'));
});

test('credit tour opens the real wallet and closes it when leaving without modifying credits', async t => {
  const writes: string[] = [];
  const env = installBrowser(t, async (url, options) => {
    if (options?.method && options.method !== 'GET') writes.push(String(url));
    const path = String(url);
    const data = path.includes('/auth/workspace-tour') ? { status: 'inactive', eligible: true }
      : path.includes('/credits/me') ? { wallet: { total: 42, promotional: 30, purchased: 12, dailyRefillTarget: 20 } }
      : path.includes('/credits/catalog') ? { policies: [] } : { items: [], requests: [] };
    return { ...jsonResponse(data), headers: new Headers({ 'content-type': 'application/json' }) };
  });
  env.browser.localStorage.setItem('user', JSON.stringify({ _id: 'wallet-tour-user' }));
  env.browser.localStorage.setItem('token', 'test-token');
  await act(async () => { await i18n.changeLanguage('fr'); env.root.render(<MemoryRouter initialEntries={['/workspace/overview']}><CreditProvider><WorkspaceTourProvider sidebarOpen={false} setSidebarOpen={() => {}}><TourHarness /><CreditWalletButton /></WorkspaceTourProvider></CreditProvider></MemoryRouter>); });
  const dialog = () => env.browser.document.querySelector('[role="dialog"]')!;
  const click = async (text: string) => act(async () => [...dialog().querySelectorAll('button')].find(b => b.textContent === text)!.click());
  await act(async () => env.container.querySelector<HTMLButtonElement>('[data-tour-help]')!.click());
  await click('Découvrir');
  for (let i = 0; i < 3; i++) await click('Suivant');
  assert.equal(env.browser.document.querySelector('[data-tour="credit-wallet"]'), null, 'highlight the source button before opening');
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 700)); });
  const wallet = env.browser.document.querySelector('[data-tour="credit-wallet"]');
  assert.ok(wallet, 'the actual wallet is opened during the credit step');
  assert.ok(wallet.textContent?.includes('42'));
  assert.ok(wallet.textContent?.includes('30'));
  assert.ok(wallet.textContent?.includes('12'));
  assert.equal(writes.length, 0, 'opening the wallet does not purchase or spend credits');
  await click('Suivant');
  assert.equal(env.browser.document.querySelector('[data-tour="credit-wallet"]'), null);
  await click('Retour');
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 700)); });
  assert.ok(env.browser.document.querySelector('[data-tour="credit-wallet"]'));
  await click('Passer la visite');
  assert.equal(env.browser.document.querySelector('[data-tour="credit-wallet"]'), null);
  assert.ok(writes.every(path => path.endsWith('/auth/workspace-tour')));
});

test('cold credit step keeps the button highlighted until a positioned wallet mounts', async t => {
  const env = installBrowser(t, async () => ({ ...jsonResponse({ status: 'inactive', eligible: true }), headers: new Headers({ 'content-type': 'application/json' }) }));
  function LateWalletHarness() {
    const { startTour, creditStep } = useWorkspaceTour();
    const [stage, setStage] = useState(0);
    return <div data-tour-root><button data-tour-help onClick={startTour}>Replay</button>
      <button data-mount-wallet onClick={() => setStage(value => value + 1)}>Mount wallet</button>
      <button data-tour="credit-trigger" ref={node => { if (node) node.getBoundingClientRect = () => new env.browser.DOMRect(700, 20, 50, 32); }}>Credits</button>
      <main data-tour="content" ref={node => { if (node) node.getBoundingClientRect = () => new env.browser.DOMRect(100, 100, 800, 500); }} />
      {creditStep && stage > 0 && <div data-tour="credit-wallet" style={stage > 1 ? { left: 400, top: 64 } : undefined} ref={node => { if (node) {
        node.getBoundingClientRect = () => new env.browser.DOMRect(400, 64, 300, 250);
        Object.defineProperty(node, 'offsetWidth', { configurable: true, value: 300 });
        Object.defineProperty(node, 'offsetHeight', { configurable: true, value: 250 });
      } }}>Wallet</div>}
    </div>;
  }
  await act(async () => { await i18n.changeLanguage('en'); env.root.render(<MemoryRouter initialEntries={['/workspace/overview']}><WorkspaceTourProvider sidebarOpen={false} setSidebarOpen={() => {}}><LateWalletHarness /></WorkspaceTourProvider></MemoryRouter>); });
  const click = async (text: string) => act(async () => [...env.browser.document.querySelectorAll('[role="dialog"] button')].find(b => b.textContent === text)!.click());
  await act(async () => env.container.querySelector<HTMLButtonElement>('[data-tour-help]')!.click());
  await click('Show me around');
  for (let i = 0; i < 3; i++) await click('Next');
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 720)); });
  const spotlight = () => env.browser.document.querySelector('mask rect.tour-spotlight')!;
  assert.equal(spotlight().getAttribute('x'), '694', 'a missing wallet keeps the source button highlighted');
  await act(async () => { env.container.querySelector<HTMLButtonElement>('[data-mount-wallet]')!.click(); await new Promise(resolve => setTimeout(resolve, 30)); });
  assert.equal(spotlight().getAttribute('x'), '694', 'an unpositioned wallet never becomes the target');
  await act(async () => { env.container.querySelector<HTMLButtonElement>('[data-mount-wallet]')!.click(); });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 30)); });
  assert.equal(spotlight().getAttribute('x'), '394', 'the highlight moves directly to the measured wallet');
});

test('tour cards stay inside desktop and narrow mobile viewports', () => {
  for (const width of [320, 390, 768, 1280]) for (const height of [420, 720]) for (const rect of [null, { x: width - 60, y: height - 60, width: 50, height: 50 }, { x: 8, y: 8, width: 250, height: 400 }]) {
    const result = tourCardPosition(rect, width, height, 340);
    assert.ok(result.left >= 16); assert.ok(result.top >= 16);
    assert.ok(result.left + result.width <= width - 16); assert.ok(result.top + 340 <= height - 16);
  }
});
import './notificationDisplay.test';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { Window } from 'happy-dom';
import React, { act, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute from '../src/components/ProtectedRoute';
import { sanitizeDiagram } from '../src/lib/sanitizeDiagram';
import { JSDOM } from 'jsdom';
import { InterfaceLanguageProvider, useInterfaceLanguage } from '../src/context/InterfaceLanguageContext';
import { SelectField, OptionCards, MultiSelectChips } from '../src/components/onboarding/FormControls';
import GoogleLoginButton from '../src/components/GoogleLoginButton';
import i18n from '../src/lib/i18n';
import { initialInterfaceLanguage, normalizeInterfaceLanguage } from '../src/lib/interfaceLanguage';
import { initializeTheme, useTheme } from '../src/lib/theme';
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
import PresentationRoute from '../src/pages/workspace/Presentation';
import PitchRoute from '../src/pages/workspace/Pitch';
import InfoTooltip from '../src/components/ui/InfoTooltip';

test('route guards use server permissions and onboarding state instead of browser claims', async t => {
  for (const sample of [
    { serverRole: 'etudiant', cachedRole: 'admin', requiredRole: 'admin', completed: true, onboardingOnly: false, expected: 'Workspace' },
    { serverRole: 'admin', cachedRole: 'etudiant', requiredRole: 'etudiant', completed: false, onboardingOnly: false, expected: 'Admin' },
    { serverRole: 'etudiant', cachedRole: 'etudiant', requiredRole: 'etudiant', completed: true, onboardingOnly: true, expected: 'Edit project' },
    { serverRole: 'etudiant', cachedRole: 'etudiant', requiredRole: 'etudiant', completed: false, onboardingOnly: true, expected: 'Protected content' },
    { serverRole: 'invalid', cachedRole: 'admin', requiredRole: 'admin', completed: false, onboardingOnly: false, expected: 'Login' },
  ] as const) await t.test(`${sample.serverRole}/${sample.requiredRole}/${sample.completed}`, async child => {
    const env = installBrowser(child, async () => ({ ...jsonResponse({ role: sample.serverRole, hasCompletedOnboarding: sample.completed }), headers: new Headers({ 'content-type': 'application/json' }) }));
    env.browser.localStorage.setItem('token', 'test-token');
    env.browser.localStorage.setItem('user', JSON.stringify({ role: sample.cachedRole }));
    await act(async () => env.root.render(<MemoryRouter initialEntries={['/protected']}><Routes>
      <Route path="/protected" element={<ProtectedRoute requiredRole={sample.requiredRole} onboardingOnly={sample.onboardingOnly}><div>Protected content</div></ProtectedRoute>} />
      <Route path="/workspace/overview" element={<div>Workspace</div>} />
      <Route path="/workspace/settings/onboarding" element={<div>Edit project</div>} />
      <Route path="/admin/dashboard" element={<div>Admin</div>} />
      <Route path="/login" element={<div>Login</div>} />
    </Routes></MemoryRouter>));
    assert.equal(env.container.textContent, sample.expected);
  });
});

test('live delivery route wrappers resolve to the localized page implementations', () => {
  assert.equal(PresentationRoute, Presentation);
  assert.equal(PitchRoute, Pitch);
  const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
  assert.match(appSource, /import ReportBuilder from ["']\.\/pages\/workspace\/ReportBuilder\/index["']/);
});

test('theme controls and the rendered theme agree on mount and cross-tab changes', async t => {
  for (const sample of [
    { saved: 'dark', systemDark: false, expected: 'dark' },
    { saved: 'light', systemDark: true, expected: 'light' },
    { saved: null, systemDark: true, expected: 'dark' },
  ]) {
    await t.test(`saved=${sample.saved}, systemDark=${sample.systemDark}`, async child => {
      const env = installBrowser(child, async () => jsonResponse({}));
      if (sample.saved) env.browser.localStorage.setItem('theme', sample.saved);
      Object.defineProperty(env.browser, 'matchMedia', { value: () => ({ matches: sample.systemDark, addEventListener() {}, removeEventListener() {} }) });
      assert.equal(initializeTheme(), sample.expected);
      assert.equal(env.browser.document.documentElement.classList.contains('dark'), sample.expected === 'dark');
      assert.equal(env.browser.document.documentElement.style.colorScheme, sample.expected);
      assert.equal(env.browser.localStorage.getItem('theme'), sample.saved);
      function ThemeControl() {
        const { isDarkMode, toggleTheme } = useTheme();
        return <button aria-pressed={isDarkMode} onClick={toggleTheme}>Theme</button>;
      }
      await act(async () => { env.root.render(<><ThemeControl /><ThemeControl /></>); });
      assert.equal(env.browser.document.documentElement.classList.contains('dark'), sample.expected === 'dark');
      assert.deepEqual([...env.container.querySelectorAll('button')].map(button => button.getAttribute('aria-pressed')), [String(sample.expected === 'dark'), String(sample.expected === 'dark')]);
      await act(async () => { env.container.querySelector('button')!.click(); });
      assert.equal(env.browser.document.documentElement.classList.contains('dark'), sample.expected !== 'dark');
      assert.deepEqual([...env.container.querySelectorAll('button')].map(button => button.getAttribute('aria-pressed')), [String(sample.expected !== 'dark'), String(sample.expected !== 'dark')]);
      env.browser.localStorage.setItem('theme', 'dark');
      await act(async () => { env.browser.dispatchEvent(new env.browser.StorageEvent('storage', { key: 'theme', newValue: 'dark' })); });
      assert.equal(env.browser.document.documentElement.classList.contains('dark'), true);
      assert.deepEqual([...env.container.querySelectorAll('button')].map(button => button.getAttribute('aria-pressed')), ['true', 'true']);
    });
  }
});

test('system theme changes synchronize controls without overriding a saved choice', async t => {
  const env = installBrowser(t, async () => jsonResponse({}));
  let systemDark = true;
  const listeners = new Set<() => void>();
  Object.defineProperty(env.browser, 'matchMedia', { value: () => ({
    get matches() { return systemDark; },
    addEventListener(_event: string, listener: () => void) { listeners.add(listener); },
    removeEventListener(_event: string, listener: () => void) { listeners.delete(listener); },
  }) });
  function ThemeControl() {
    const { isDarkMode, setTheme } = useTheme();
    return <button aria-pressed={isDarkMode} onClick={() => setTheme('dark')}>Theme</button>;
  }
  await act(async () => { env.root.render(<ThemeControl />); });
  assert.equal(env.browser.document.documentElement.classList.contains('dark'), true);
  await act(async () => { systemDark = false; listeners.forEach(listener => listener()); });
  assert.equal(env.browser.document.documentElement.classList.contains('dark'), false);
  assert.equal(env.container.querySelector('button')!.getAttribute('aria-pressed'), 'false');
  assert.equal(env.browser.localStorage.getItem('theme'), null);
  await act(async () => { env.container.querySelector('button')!.click(); listeners.forEach(listener => listener()); });
  assert.equal(env.browser.document.documentElement.classList.contains('dark'), true);
  assert.equal(env.container.querySelector('button')!.getAttribute('aria-pressed'), 'true');
  assert.equal(env.browser.localStorage.getItem('theme'), 'dark');
});

test('every UI/content language combination preserves project data and an active generation', async t => {
  for (const uiLanguage of ['en', 'fr'] as const) {
    for (const contentLanguage of ['English', 'French', 'Arabic']) {
      await t.test(`${uiLanguage} UI / ${contentLanguage} content`, async child => {
        const project = { _id: 'matrix-project', basics: { language: contentLanguage }, actorsLanguage: contentLanguage };
        const originalActor = { _id: 'matrix-actor', name: 'Original English name', description: 'Contenu utilisateur à conserver', type: 'primary', icon: 'person' };
        const generatedActor = { ...originalActor, name: `Generated in ${contentLanguage}` };
        const requests: Array<{ url: string; options?: RequestInit }> = [];
        let complete!: (response: FetchResponse) => void;
        const env = installBrowser(child, async (input, options) => {
          const url = String(input);
          requests.push({ url, options });
          if (url.endsWith('/auth/preferences')) return jsonResponse({ uiLanguage: options?.method === 'PUT' ? JSON.parse(String(options.body)).uiLanguage : uiLanguage });
          if (url.endsWith('/ai/actors/generate')) return new Promise(resolve => { complete = resolve; });
          const body = url.endsWith('/my-project') ? project : { actors: [originalActor] };
          return { ...jsonResponse(body), headers: new Headers({ 'content-type': 'application/json' }) };
        });
        identity(env.browser.localStorage, 'matrix-account', 'matrix-token', uiLanguage);
        const projectKey = 'smartpfe:matrix:project';
        env.browser.localStorage.setItem(projectKey, JSON.stringify(project));
        let actorsState: ReturnType<typeof useActors>;
        function MatrixHarness() {
          const { uiLanguage: currentUiLanguage, setUiLanguage } = useInterfaceLanguage();
          actorsState = useActors();
          return <>
            <button onClick={() => void actorsState.generateWithAi()}>Generate</button>
            <button onClick={() => void setUiLanguage(currentUiLanguage === 'en' ? 'fr' : 'en')}>Switch interface</button>
            <output>{JSON.stringify({ actors: actorsState.actors, project: actorsState.project, suggestion: actorsState.suggestion })}</output>
          </>;
        }
        await act(async () => {
          env.root.render(<MemoryRouter><InterfaceLanguageProvider><AiGenerationProvider><MatrixHarness /></AiGenerationProvider></InterfaceLanguageProvider></MemoryRouter>);
        });
        assert.equal(actorsState!.projectLanguage, { English: 'en', French: 'fr', Arabic: 'ar' }[contentLanguage]);
        const loadedData = env.container.querySelector('output')!.textContent;
        const afterLoad = requests.length;
        // Starting generation is explicit; a UI switch alone must never start it.
        await act(async () => { env.container.querySelectorAll('button')[1].click(); });
        assert.equal(env.container.querySelector('output')!.textContent, loadedData);
        assert.deepEqual(requests.slice(afterLoad).map(request => JSON.parse(String(request.options?.body))), [{ uiLanguage: uiLanguage === 'en' ? 'fr' : 'en' }]);
        await act(async () => { env.container.querySelectorAll('button')[0].click(); });
        const generation = requests.find(request => request.url.endsWith('/ai/actors/generate'))!;
        assert.ok(generation);
        assert.equal(generation.options?.body, undefined); // The server reads the existing project preference.
        const beforeActiveSwitch = requests.length;
        await act(async () => { env.container.querySelectorAll('button')[1].click(); });
        assert.equal(requests.filter(request => request.url.endsWith('/ai/actors/generate')).length, 1);
        assert.equal(generation.options?.signal?.aborted, false);
        assert.equal(requests.length, beforeActiveSwitch + 1);
        assert.deepEqual(JSON.parse(String(requests.at(-1)?.options?.body)), { uiLanguage });
        assert.equal(env.container.querySelector('output')!.textContent, loadedData);
        assert.equal(env.browser.localStorage.getItem(projectKey), JSON.stringify(project));
        assert.equal(requests.some(request => request.options?.method === 'PUT' && !request.url.endsWith('/auth/preferences')), false);
        await act(async () => { complete({ ...jsonResponse({ actors: [generatedActor] }), headers: new Headers({ 'content-type': 'application/json' }) } as FetchResponse); });
        assert.deepEqual(actorsState!.actors, [originalActor]);
        assert.deepEqual(actorsState!.suggestion, [generatedActor]);
      });
    }
  }
});

test('French is the default interface while explicit account and device choices are preserved', () => {
  assert.equal(initialInterfaceLanguage(null, null), 'fr');
  assert.equal(initialInterfaceLanguage(null, 'invalid'), 'fr');
  assert.equal(initialInterfaceLanguage(null, 'en'), 'en');
  assert.equal(initialInterfaceLanguage({ _id: 'u', uiLanguage: 'en' }, 'fr'), 'en');
  assert.equal(initialInterfaceLanguage({ _id: 'u', uiLanguage: 'fr' }, 'en'), 'fr');
  assert.equal(initialInterfaceLanguage({ _id: 'u' }, null), 'fr');
  assert.equal(normalizeInterfaceLanguage(undefined), 'fr');
});

test('Google SDK bootstrap follows account/device UI preference and ignores content language', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const bootstrap = html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
  assert.ok(bootstrap);
  const cases = [
    { token: 'test-session', user: '{"_id":"u","uiLanguage":"fr","language":"English"}', device: 'en', expected: 'fr' },
    { token: 'test-session', user: '{"_id":"u","uiLanguage":"en","language":"French"}', device: 'fr', expected: 'en' },
    { token: 'test-session', user: '{"_id":"u","language":"French"}', device: 'fr', expected: 'fr' },
    { token: null, user: '{"_id":"u","uiLanguage":"en"}', device: 'fr', expected: 'fr' },
    { token: 'test-session', user: 'invalid-json', device: 'fr', expected: 'fr' },
    { token: null, user: null, device: null, expected: 'fr' },
    { token: null, user: null, device: 'en', expected: 'en' },
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

test('help tooltips are keyboard accessible, stay inside the viewport and dismiss without moving focus', async t => {
  const env = installBrowser(t, async () => { throw new Error('No requests expected'); });
  await act(async () => { env.root.render(<InfoTooltip label="Aide en français" tooltip="Une explication utile." />); });
  const button = env.container.querySelector('button')!;
  const tooltip = env.container.querySelector('[role="tooltip"]')! as HTMLElement;
  assert.equal(button.getAttribute('aria-describedby'), tooltip.id);
  assert.equal(button.getAttribute('aria-label'), 'Aide en français');
  button.getBoundingClientRect = () => ({ left: env.browser.innerWidth - 28, right: env.browser.innerWidth, top: 100, bottom: 128, width: 28, height: 28, x: 0, y: 100, toJSON: () => ({}) });
  await act(async () => { button.focus(); });
  assert.ok(tooltip.classList.contains('visible'));
  assert.ok(parseFloat(tooltip.style.left) >= 16);
  assert.ok(parseFloat(tooltip.style.left) + parseFloat(tooltip.style.width) <= env.browser.innerWidth - 16);
  assert.ok(parseFloat(tooltip.style.top) + parseFloat(tooltip.style.maxHeight) <= env.browser.innerHeight - 16);
  await act(async () => { button.dispatchEvent(new env.browser.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
  assert.ok(tooltip.classList.contains('invisible'));
  assert.equal(env.browser.document.activeElement, button);
  await act(async () => { button.blur(); button.focus(); });
  assert.ok(tooltip.classList.contains('visible'));
  await act(async () => { env.browser.dispatchEvent(new env.browser.Event('scroll')); });
  assert.ok(tooltip.classList.contains('invisible'));
});

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

test('counted interface labels use singular and plural forms in both languages', () => {
  const cases = [
    ['delivery', 'presentation.slideCount', 'slide', 'diapositive', 'slides', 'diapositives'],
    ['jury', 'simulation.slidesReady', 'Slide Ready', 'diapositive prête', 'Slides Ready', 'diapositives prêtes'],
    ['report', 'overview.wordsCount', 'word', 'mot', 'words', 'mots'],
    ['adminCredits', 'economy.actions', 'Action', 'action', 'Actions', 'actions'],
    ['adminManagement', 'dashboard.studentsCount', 'student', 'étudiant', 'students', 'étudiants'],
    ['adminManagement', 'dashboard.projectsCount', 'project', 'projet', 'projects', 'projets'],
  ];
  for (const [ns, key, english, french, englishPlural, frenchPlural] of cases) {
    assert.equal(i18n.t(key, { ns, lng: 'en', count: 1 }), `1 ${english}`);
    assert.equal(i18n.t(key, { ns, lng: 'fr', count: 1 }), `1 ${french}`);
    assert.equal(i18n.t(key, { ns, lng: 'en', count: 2 }), `2 ${englishPlural}`);
    assert.equal(i18n.t(key, { ns, lng: 'fr', count: 2 }), `2 ${frenchPlural}`);
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
  assert.ok(browserEnv.container.textContent?.includes('Le mot de passe doit contenir au moins 15 caractères.'));
  await act(async () => { await i18n.changeLanguage('en'); });
  assert.ok(browserEnv.container.textContent?.includes('Password must be at least 15 characters.'));
  assert.ok(!browserEnv.container.textContent?.includes('Le mot de passe doit contenir au moins 15 caractères.'));
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
    const saveButton = [...env.container.querySelectorAll('button')].find(button => button.textContent?.trim() === i18n.t('saveStatus.saveNow', { ns: 'controls', lng: 'fr' }));
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
  assert.ok(env.browser.document.body.textContent?.includes('ID de demande'));
  assert.equal(env.browser.document.body.textContent?.includes('requestDetails.requestId'), false);
  assert.ok(env.browser.document.body.textContent?.includes(new Intl.NumberFormat('fr').format(1250)));
  assert.equal(calls, count);
});

test('credit activity details have localized heading and accessible close label', async t => {
  const transaction = { _id: 'activity-test', kind: 'welcome', status: 'settled', promotionalDelta: 20, purchasedDelta: 0, createdAt: '2026-10-08T12:00:00Z' };
  const env = installBrowser(t, async () => ({ ...jsonResponse({ items: [transaction], total: 1, page: 1, pages: 1, limit: 10 }), headers: new Headers({ 'content-type': 'application/json' }) }));
  await act(async () => {
    await i18n.changeLanguage('fr');
    env.root.render(<MemoryRouter initialEntries={['/workspace/settings/credits?view=transactions']}><CreditProvider><CreditHistory /></CreditProvider></MemoryRouter>);
  });
  await act(async () => { env.container.querySelector('#credit-history-panel button')!.dispatchEvent(new env.browser.MouseEvent('click', { bubbles: true })); });
  assert.ok(env.browser.document.querySelector('button[aria-label="Fermer les détails de l’activité"]'));
  assert.equal(env.browser.document.querySelector('#credit-activity-title')?.textContent, 'Détails de l’activité');
  await act(async () => { await i18n.changeLanguage('en'); });
  assert.ok(env.browser.document.querySelector('button[aria-label="Close activity details"]'));
  assert.equal(env.browser.document.querySelector('#credit-activity-title')?.textContent, 'Activity details');
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
  let opens = 0; let closes = 0;
  let stream: ReadableStreamDefaultController<Uint8Array>;
  const saved = { _id: 'n-history', title: 'Actors section is ready', message: 'The Actors section has been generated successfully.', type: 'generation_complete', feature: 'actors', read: false, createdAt: '2026-10-08T12:00:00Z' };
  const custom = { _id: 'n-custom', title: 'Existing English custom title', message: 'Existing English custom content', type: 'info', read: false, createdAt: '2026-10-08T11:00:00Z' };
  const env = installBrowser(t, async (input, options) => {
    assert.equal(options?.method || 'GET', 'GET'); requests.push(String(input));
    if (String(input).endsWith('/notifications/stream')) {
      opens++;
      assert.equal(new Headers(options?.headers).get('Authorization'), 'Bearer test-placeholder');
      assert.ok(!String(input).includes('token='));
      options?.signal?.addEventListener('abort', () => { closes++; stream.close(); });
      return { ok: true, headers: new Headers({ 'content-type': 'text/event-stream' }), body: new ReadableStream<Uint8Array>({ start(controller) { stream = controller; } }) } as unknown as FetchResponse;
    }
    return { ...jsonResponse([saved, custom]), headers: new Headers({ 'content-type': 'application/json' }) };
  });
  env.browser.localStorage.setItem('token', 'test-placeholder');
  await act(async () => { await i18n.changeLanguage('en'); env.root.render(<MemoryRouter><NotificationProvider><NotificationBell /></NotificationProvider></MemoryRouter>); });
  const bell = env.container.querySelector('button')!;
  await act(async () => { bell.dispatchEvent(new env.browser.MouseEvent('click', { bubbles: true })); });
  await act(async () => { stream.enqueue(new TextEncoder().encode(`event: notification\ndata: ${JSON.stringify({ ...saved, _id: 'n-stream' })}\n\n`)); });
  const count = requests.length;
  await act(async () => { await i18n.changeLanguage('fr'); });
  assert.ok(env.container.textContent?.includes(i18n.t('generation.actors.title', { ns: 'notifications', lng: 'fr' })));
  assert.ok(env.container.textContent?.includes(custom.message));
  assert.ok(env.container.querySelector('[role="status"]')?.textContent?.includes(i18n.t('generation.actors.message', { ns: 'notifications', lng: 'fr' })));
  assert.equal(opens, 1); assert.equal(closes, 0); assert.equal(requests.length, count);
});

test('diagram sanitization strips executable markup and external resources while preserving geometry', t => {
  installBrowser(t, async () => jsonResponse({}));
  const dom = new JSDOM('');
  setGlobal('window', dom.window);
  t.after(() => dom.window.close());
  const clean = sanitizeDiagram('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(1)</script><foreignObject><img src=x onerror="alert(1)" /></foreignObject><a href="javascript:alert(1)"><text>Label</text></a><image href="https://example.invalid/a"/><rect width="10" height="20" style="stroke:red"/><path d="M0 0L10 10" style="fill:url(https://example.invalid/a)"/></svg>');
  assert.doesNotMatch(clean, /onload|onerror|script|foreignObject|javascript:|https:\/\//);
  assert.match(clean, /<rect/);
  assert.match(clean, /width="10"/);
  assert.match(clean, /stroke:red/);
  assert.match(clean, /<path/);
});


test('Google linking sends the current password to the protected connection endpoint and preserves the current page', async t => {
  let callback: ((value: { credential: string }) => void) | undefined;
  const requests: { url: string; options?: RequestInit }[] = [];
  const env = installBrowser(t, async (url, options) => {
    requests.push({ url: String(url), options });
    return { ...jsonResponse({ _id: 'same-account', fullName: 'Existing user', email: 'same@example.com', role: 'etudiant', hasPassword: true, googleConnected: true, token: 'new-token', authProvider: 'email' }), headers: new Headers({ 'content-type': 'application/json' }) };
  });
  env.browser.localStorage.setItem('token', 'old-token');
  (env.browser as unknown as Window).google = { accounts: { id: { initialize: (options: any) => { callback = options.callback; }, renderButton: () => {} } } };
  let connected: any;
  await act(async () => env.root.render(<MemoryRouter initialEntries={['/workspace/account']}><Routes><Route path="/workspace/account" element={<GoogleLoginButton mode="connect" currentPassword="existing-password" onConnected={profile => { connected = profile; }} onLoading={() => {}} onError={() => {}} />} /><Route path="/workspace/overview" element={<div>Wrong redirect</div>} /></Routes></MemoryRouter>));
  await act(async () => callback!({ credential: 'google-fixture' }));
  assert.equal(requests.length, 1); assert.ok(requests[0].url.endsWith('/auth/google/connect'));
  assert.equal(new Headers(requests[0].options?.headers).get('Authorization'), 'Bearer old-token');
  assert.deepEqual(JSON.parse(String(requests[0].options?.body)), { credential: 'google-fixture', currentPassword: 'existing-password' });
  assert.equal(connected._id, 'same-account'); assert.equal(env.browser.localStorage.getItem('token'), 'new-token');
  assert.equal(JSON.parse(env.browser.localStorage.getItem('user')!).hasPassword, true);
  assert.ok(!env.container.textContent?.includes('Wrong redirect'));
});
test('linking Google does not hide the password controls for accounts with both login methods', async t => {
  const env = installBrowser(t, async () => ({ ...jsonResponse({ fullName: 'Existing user', email: 'same@example.com', authProvider: 'google', googleConnected: true, hasPassword: true, googleAccount: { fullName: 'Google Name', email: 'same@example.com' } }), headers: new Headers({ 'content-type': 'application/json' }) }));
  env.browser.localStorage.setItem('token', 'fixture');
  env.browser.localStorage.setItem('user', JSON.stringify({ authProvider: 'google', hasPassword: true, googleConnected: true }));
  await act(async () => { await i18n.changeLanguage('fr'); env.root.render(<MemoryRouter><AccountSettings /></MemoryRouter>); });
  assert.ok(env.container.querySelector('#account-current-password')); assert.ok(env.container.querySelector('#account-new-password'));
  assert.ok(env.container.textContent?.includes('Compte Google associé'));
  const section = [...env.container.querySelectorAll('section')].find(s => s.textContent?.includes('Connexion Google'))!;
  assert.equal(section.textContent!.split('Compte Google associé').length - 1, 1);
  assert.ok(section.textContent?.includes('Google Name')); assert.ok(section.textContent?.includes('same@example.com'));
  assert.ok(section.textContent?.includes('Continuer avec Google'));
  await act(async () => [...section.querySelectorAll('button')].find(b => b.textContent === 'Dissocier Google')!.click());
  assert.ok(section.querySelector('#google-disconnect-password'));
  assert.equal(section.querySelector('button[type="submit"]')?.hasAttribute('disabled'), true);
  await act(async () => { await i18n.changeLanguage('en'); });
  assert.ok(section.textContent?.includes('Continue with Google'));
  assert.ok(section.textContent?.includes('Confirm disconnect'));
});

test('Google-only accounts must set a password before disconnecting, without sending a disconnect request', async t => {
  const calls: string[] = [];
  const env = installBrowser(t, async url => { calls.push(String(url)); return { ...jsonResponse({ fullName: 'Google User', authProvider: 'google', googleConnected: true, hasPassword: false }), headers: new Headers({ 'content-type': 'application/json' }) }; });
  await act(async () => { await i18n.changeLanguage('en'); env.root.render(<MemoryRouter><AccountSettings /></MemoryRouter>); });
  await act(async () => [...env.container.querySelectorAll('button')].find(b => b.textContent === 'Disconnect Google')!.click());
  assert.ok(env.container.textContent?.includes('Google is your only sign-in method'));
  assert.ok(env.container.querySelector('a[href="/forgot-password"]'));
  assert.equal(env.container.querySelector('#google-disconnect-password'), null);
  assert.equal(env.container.querySelector('button[type="submit"]'), null);
  assert.ok(calls.every(url => url.endsWith('/auth/profile')));
});
test('Google email collisions show recovery instructions without saving a session', async t => {
  let callback: ((value: { credential: string }) => void) | undefined;
  const env = installBrowser(t, async () => ({ ...jsonResponse({ message: 'Link required', messageKey: 'auth.googleLinkRequired', code: 'GOOGLE_LINK_REQUIRED' }, false), headers: new Headers({ 'content-type': 'application/json' }), status: 409 }));
  (env.browser as unknown as Window).google = { accounts: { id: { initialize: (options: any) => { callback = options.callback; }, renderButton: () => {} } } };
  let error: any;
  await act(async () => env.root.render(<MemoryRouter><GoogleLoginButton onError={value => { error = value; }} onLoading={() => {}} /></MemoryRouter>));
  await act(async () => callback!({ credential: 'fixture' }));
  assert.equal(error.messageKey, 'auth.googleLinkRequired'); assert.equal(env.browser.localStorage.getItem('token'), null); assert.equal(env.browser.localStorage.getItem('user'), null);
});
test('password policy counts Unicode characters and rejects bcrypt truncation without requiring character mixtures', () => {
  assert.equal(passwordPolicyError('a long simple passphrase'), null);
  assert.equal(passwordPolicyError('Short1!'), 'password.tooShort');
  assert.equal(passwordPolicyError('🙂'.repeat(14)), 'password.tooShort');
  assert.equal(passwordPolicyError('🙂'.repeat(18)), null);
  assert.equal(passwordPolicyError('🙂'.repeat(19)), 'password.tooLong');
  assert.equal(passwordPolicyError('x'.repeat(73)), 'password.tooLong');
});
