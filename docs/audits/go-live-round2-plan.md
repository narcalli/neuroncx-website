# Go-live round 2 plan

Checked 31 Oct 2026, about 16:30 IST, read-only. Live HTML used cache-busting query strings, with scripts and styles stripped before matching. CMS values came from public GET requests, so they show published content only. Block and array indexes count from 0.

## How to read the table

- **Status:** DONE means the new text is live. OPEN means the old text is live. NOT FOUND means neither was found.
- **Drafts:** whether the collection has drafts turned on. The published version could not be compared with the latest draft for any item: `draft=true` returned the published version without a login, and version history returned 403. Check this in the admin, or with an authenticated read, before any write.
- **By API:** every write needs an authenticated user or API key.
  - **Whole array** means the REST API replaces an entire block or array field, so the full current value has to be read and sent back with one change. On a Pages or Hubs document this can overwrite an unpublished draft if the latest draft is not read first.
  - **RAG** means the save can also sync content to the NCX backend through `withRag`.

## Table

| Item | Status | Where it lives | Field type | Drafts on? | Change by API safely? |
|---|---|---|---|---|---|
| H1 | OPEN | Pages > "home" (`home`), `layout[0]` `heroHarness`, `headline`. New text is the CMS default for new blocks only (`neuroncx-cms/src/blocks/HeroHarness/config.ts:22`) | Textarea | Yes, autosave | Yes, whole `layout` |
| H2 | OPEN | Pages > `home`, `layout[1]` `productSuite2`, `cards[0].description` | Textarea | Yes, autosave | Yes, whole `layout` |
| H3 | OPEN | Pages > `home`, `layout[2]` `bentoGrid`, `title` | Text, max 100 | Yes, autosave | Yes, whole `layout` |
| H4 | OPEN | Pages > `home`, `layout[6]` `heroStack`, `products[3].label` and `.caption`. The same text is on Pages > `crm`, `layout[0]` | Text, max 24 and 110 | Yes, autosave | Yes, whole `layout` |
| H5 | OPEN | Pages > `home`, `layout[2]` `bentoGrid`, `cards[4].title` and `.body` | Title text, body textarea (max 400) | Yes, autosave | Yes, whole `layout` |
| H6 | OPEN | Pages > `home`, `meta.title` and `meta.description`, both empty. Title falls back to Site Settings `defaultTitle`; description falls back to `DEFAULT_DESCRIPTION` (`src/utilities/siteDefaults.ts:13`) | SEO plugin text and textarea | Yes, autosave | Yes, `meta` only. New title is 63 characters, over the usual 60 |
| O1 | OPEN | Features > "Booking requests on WhatsApp, voice and web chat become confirmed bookings" (`ncx-appointment-assist-workflow-on-transactional-chatbot`), `title` and `summary`. Shown by Pages > `omnichannel-cx`, `layout[2]` `featureThread` | Title text, summary textarea (max 220) | Yes, autosave | Yes. New body is 198 characters |
| O2 | OPEN | Pages > "Omnichannel CX" (`omnichannel-cx`), `layout[1]` `conversationHero`, `conversation`, one `them:` line | Textarea, one field holding all lines | Yes, autosave | Yes, whole `layout` |
| O3 | OPEN | Same field as O2, one `us:` line. Saved text has a double space after "Spine specialist" | Textarea | Yes, autosave | Yes, whole `layout` |
| O4 | OPEN | Pages > `omnichannel-cx`, `layout[1]` `conversationHero`, `subhead` | Textarea | Yes, autosave | Yes, whole `layout` |
| O5 | OPEN | Pages > `omnichannel-cx`, `layout[3]` `useCases`, `cases[1].description` | Textarea | Yes, autosave | Yes, whole `layout` |
| B1 | OPEN | Micro Apps > "Student mark statement assessment" (`student-mark-statement-assessment`), `name` and `meta.title`; Hubs > "Bot swarm" (`bot-swarm`), `layout[1]` `agenticFlowDemo`, `events[2].routeText` | Text | Yes, no autosave | Yes, RAG. Hub needs whole `layout`. Keep the slug unchanged unless a redirect is planned |
| B2 | OPEN | Micro Apps > `student-mark-statement-assessment`, `summary` (defined at `neuroncx-cms/src/fields/card.ts:20`) | Text, max 140 | Yes, no autosave | Yes, RAG. New text is 92 characters |
| B3 | OPEN | Micro Apps > `student-mark-statement-assessment`, `keyPoints[0].line` | Text, max 60 | Yes, no autosave | Yes, whole `keyPoints`, RAG |
| B4 | OPEN | Hubs > `bot-swarm`, `layout[0]` `agenticOrbit`, `roles[1].subLabel` | Text, max 80 | Yes, no autosave | Yes, whole `layout`, RAG |
| K1 | OPEN | Pages > "knowledge-base" (`knowledge-base`), `layout[0]` `statHero`, `subhead` | Textarea, max 300 | Yes, autosave | Yes, whole `layout` |
| K2 | OPEN | Pages > `knowledge-base`, `layout[3]` `benefits`, `items[0].description` | Textarea | Yes, autosave | Yes, whole `layout` |
| K3 | OPEN | Features > "A content model built for semantic retrieval" (`ai-augmented-semantic-content-management-system`), `summary`, shown by `layout[1]` `featureThread` | Textarea, max 220 | Yes, autosave | **No, code first.** New text is 279 characters, and the block draws one paragraph |
| K4 | OPEN | Features > "Response quality monitoring against a threshold" (`ncx_responsequalitymonitor-monitors-content-quality-threshold`), `summary` | Textarea, max 220 | Yes, autosave | Yes. 149 characters. Slug still holds the internal name, but features have no public page |
| K5 | OPEN | Features > "Generated long-form content in your own schema" (`ncx_articlegenerate-generative-content-augmentation-workflows`), `summary` | Textarea, max 220 | Yes, autosave | Yes. 93 characters. Same slug note |
| K6 | OPEN | Pages > `knowledge-base`, `meta.title` and `meta.description`, both empty. The title is built from the page `title` value "knowledge-base" (`src/utilities/generateMeta.ts:40-44`) | SEO plugin text and textarea | Yes, autosave | Yes, `meta` only |
| U1 | OPEN | Features > "Customer data built from your own conversations" (`ai-first-customer-data-accumulation-and-analytics-platform`), `summary`, shown by Pages > `user-intelligence`, `layout[1]` `featureThread` | Textarea, max 220 | Yes, autosave | **No.** New text is 253 characters, so the save is rejected until the limit rises or the copy is cut. Saved text is 216 characters |
| U2 | OPEN | Pages > "user-intelligence" (`user-intelligence`), `meta.title` and `meta.description`, both empty | SEO plugin text and textarea | Yes, autosave | Yes, `meta` only |
| C1 | OPEN | Pages > "CRM" (`crm`), `layout[5]` `productInAction`, `cards[0].imageAlt`, **on the block**. Media `pia-1-document-workspace-1.webp` (1600x1000), `alt` empty, also referenced by Pages > `home` | Text | Yes, autosave | Yes, whole `layout` |
| C2 | OPEN | Pages > `crm`, `layout[5]`, `cards[2].imageAlt`, **on the block**. Media `pia-3-transaction-list-1.webp` (1600x1000), `alt` empty | Text | Yes, autosave | Yes, whole `layout` |
| C3 | OPEN | Pages > `crm`, `layout[5]`, `cards[3].imageAlt`, **on the block**. Media `pia-6-cx-kpis.webp` (1600x1000), `alt` empty. The filename suggests a KPI screen, not the chat and workflow in the caption | Text | Yes, autosave | Yes for the text, but the new alt would describe a picture the filename says is not there. Check or replace the image first |
| C4 | OPEN | Hard-coded in `src/blocks/ProblemStatement/Component.tsx:95-96`. Not an icon field or a fallback. Cards are Pages > `crm`, `layout[2]` | Code | Not applicable | **No, code only** |
| I1 | OPEN | Pages > "integrations" (`integrations`), `layout[1]` `integrationsMarquee`, `logos[9].name` (text); Integrations Master > `integrations`, `kbAnswer` (textarea, max 600). Also `neuroncx-cms/scripts/seed-integrations-master.ts:166,211` and `tests/int/integrationsHooks.int.spec.ts:34,40` | Text and textarea | Yes: autosave on Pages, no autosave on Integrations Master | Yes for content, whole `layout`, and `kbAnswer` may sync. The seed script would bring the old spelling back if run |
| I2 | OPEN | Pages > `integrations`, `meta.title` and `meta.description`, both empty | SEO plugin text and textarea | Yes, autosave | Yes, `meta` only. New title is 62 characters, over the usual 60 |
| I3 | OPEN | Integrations, `slug` (`neuroncx-cms/src/collections/Integrations.ts:113`), on `ncx-integrations-leadsquared` and `ncx-asttecs-dialer-integrations` | Text, unique, max 60 | Yes, no autosave | **No, code first.** See below |
| I4 | OPEN | No integration has a logo: `logo` field (`Integrations.ts:176`) is empty on all 13. All 12 `logos[n].logo` values in `layout[1]` are empty. Letters come from `src/components/cards/types.ts:78` and `IntegrationsMarquee.tsx:42`. Links come from `integrationHref` (`src/utilities/integrations.ts:81-82`): `status` live, `hasOwnPage` on, and a `slug` | Upload | Yes | Yes once files are uploaded, RAG on integrations |
| S1 | OPEN | Footer global, `tagline` (`neuroncx-cms/src/Footer/config.ts:13-15`) | Textarea, max 200 | No, saves go live | **No, code first.** New text is 217 characters |
| S2 | OPEN | Header global, `navItems[0].groups[1].items[0].label` (max 30) is the one in use. The old hidden field `navItems[0].columns[1].links[0].label` holds the same text | Text | No, saves go live | Yes, whole `navItems`. Change both so the old field stays consistent |

## Items that need code first

1. **S1, footer tagline:** raise `maxLength` from 200 at `neuroncx-cms/src/Footer/config.ts:15`, or shorten the copy by 17 characters.
2. **K3, five list items:** `summary` has a 220 limit and `src/blocks/FeatureThread/Component.tsx:112` draws it as one paragraph. A list needs a list field or line handling, plus a higher limit.
3. **U1, user intelligence paragraph:** 253 characters against the 220 limit on Features `summary` (`neuroncx-cms/src/collections/Features/index.ts:57`). Raise the limit or cut 33 characters.
4. **C4, the "!":** remove or change it in `src/blocks/ProblemStatement/Component.tsx:95-96`.
5. **I3, slug changes:** a CMS redirect record would not fire here. `src/app/(frontend)/integrations/[slug]/page.tsx:166` calls `notFound()` without `PayloadRedirects`, and the plugin's `to` picker covers Pages and Posts only (`neuroncx-cms/src/plugins/index.ts:32-33`). The direct route is a permanent redirect in `redirects.ts`, shipped before the slugs change. `PayloadRedirects` also caps at 300 records and sends temporary redirects (`src/components/PayloadRedirects/index.tsx:32,40,48`).

## Also noticed on these pages

- **Canonical tags:** missing on all 9 pages checked. `NEXT_PUBLIC_SERVER_URL` is still the likely cause on Netlify.
- **Several H1s:** `/crm` has 3, `/` has 2 and `/omnichannel-cx` has 2.
- **Em dash:** Pages > `integrations`, `layout[7]` `closingCta`, `subhead`.
- **Words outside this list:**
  - "Microbots" on Pages > `crm`, `layout[0]` `products[3]`.
  - "Student mark statement assessment" in Pages > `crm`, `layout[11]` `heroCustom`, `visualHtml` (raw HTML).
  - "marksheet" in Hubs > `bot-swarm`, Lists > `read-and-match-documents`, Sectors > `higher-education`, and other Micro Apps fields (`checks`, `waRowDescription`, `meta.description`, `startsWhen`).
- **Page titles that look like slugs:** the `title` values on these Pages are `knowledge-base`, `user-intelligence`, `integrations` and `home`.
- **Other visible copy errors:** the hidden Omnichannel features 7, 11 and 12 still have rough text and internal names (`ncx_applicationassist`, "Neuroncx").
- **WhatsApp button:** on in production and showing "Chat" with one button on `/`, `/crm`, `/contact` and `/bot-swarm`. The home page's old `whatsappWidget` block (`layout[7]`) renders nothing now and can be removed later.
