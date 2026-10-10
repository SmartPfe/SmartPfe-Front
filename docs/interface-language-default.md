# French interface default

Updated 2026-10-10 at the user's request.

French (`fr`) is the default for visitors and accounts without an interface
preference. Explicit `en` and `fr` account/device choices remain supported and
are preserved; there is no database backfill or forced reset of saved choices.
Project/generation English/French/Arabic settings are unchanged.

The frontend preference normalizer, initial i18next language, HTML language,
Google SDK bootstrap, API language header and auth storage fallbacks agree on
French. English remains the missing-translation dictionary fallback, which is
separate from the default selected interface language.

The backend user schema, auth preference/response defaults, validated request
header fallback and transactional-email fallback also use French. A recipient's
explicit English preference still wins. Mail transport, recipients, credits,
project data and content-generation request fields are unchanged.

Earlier handoff/audit documents describe the original English defaults at the
time of the migration; this note records the newer default decision.
