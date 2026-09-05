-- ============================================================================
-- Admin-editable page content.
--
-- WHY
-- The information pages (Terms, Privacy, Returns, Delivery, Cookies, About,
-- Contact) had their entire copy written into the React components, so every
-- wording change — including filling in the launch placeholders — needed a code
-- edit, a commit and a deploy. That is the wrong shape for text a business
-- owner needs to change on their own.
--
-- HOW IT WORKS
-- Each editable region of a page is one row here, holding Markdown. Pages
-- compose blocks around the parts that genuinely can't be text — the cookie
-- preference switches, the live delivery pricing, the contact form. A limited
-- Markdown subset is rendered (src/lib/content/markdown.tsx): headings, lists,
-- bold, italic, links. Raw HTML is never rendered, so nothing pasted into the
-- admin panel can inject markup into the page.
--
-- TOKENS
-- Bodies may contain {{companyName}}, {{companyNumber}}, {{registeredAddress}},
-- {{contactEmail}}, {{contactPhone}}, {{deliveryStandard}}, {{deliveryExpress}}
-- and {{deliveryFreeThreshold}}. These substitute live from Admin → Settings,
-- so the company details are typed once and appear correctly on every page. A
-- token whose setting is still blank renders as a highlighted placeholder,
-- which is what keeps unfinished details visible rather than silently empty.
-- ============================================================================

create table if not exists content_blocks (
  key text primary key,
  /** Human name of the page this belongs to, for grouping in the admin panel. */
  page text not null,
  page_path text not null default '',
  label text not null,
  hint text not null default '',
  body text not null default '',
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists content_blocks_page_idx on content_blocks (page, sort_order);

drop trigger if exists content_blocks_set_updated_at on content_blocks;
create trigger content_blocks_set_updated_at
  before update on content_blocks
  for each row execute function set_updated_at();

alter table content_blocks enable row level security;

drop policy if exists "content_blocks_public_read" on content_blocks;
create policy "content_blocks_public_read" on content_blocks for select using (true);
drop policy if exists "content_blocks_admin_write" on content_blocks;
create policy "content_blocks_admin_write" on content_blocks for all using (is_admin()) with check (is_admin());

-- ----------------------------------------------------------------------------
-- Seed with the copy the pages currently ship with.
--
-- `on conflict do nothing` on the body means re-running this migration restores
-- any block that was deleted, but never overwrites wording that has since been
-- edited in the admin panel. Labels and hints ARE refreshed, since those are
-- part of the admin UI rather than the customer-facing content.
-- ----------------------------------------------------------------------------
insert into content_blocks (key, page, page_path, label, hint, body, sort_order) values

('about.body', 'About', '/about', 'Page content', 'The whole About page.', $blk$
Avernic UK is a UK-based online retailer offering a straightforward way to shop cosmetic peptide skincare — serums, moisturisers, eye care, cleansers and treatments — with delivery across the United Kingdom.

We built Avernic UK around three things: a clear, honest shopping experience; a secure checkout powered by Open Banking; and a range chosen for everyday usefulness rather than volume.

## Our products

Everything sold on Avernic UK is a cosmetic skincare product intended for topical use only. We do not sell medicines, supplements intended to treat or prevent disease, or any product intended for injection or internal use. Our products are intended for adults aged 18 and over — see the notice on every page.

## Quality and testing

Every skincare formulation we sell is tested using HPLC (High-Performance Liquid Chromatography) — a laboratory technique used to verify the purity and concentration of active ingredients — before a batch is approved for sale. This checks formulation quality for cosmetic use; it does not change what the product is, and our products remain cosmetic skincare rather than medicines.

## Our business

Avernic UK is operated by {{companyName}}, a company registered in England and Wales under company number {{companyNumber}}. Our registered office is at {{registeredAddress}}.

## Get in touch

If you have any questions about Avernic UK or an order, please visit our [Contact](/contact) page.
$blk$, 0),

('terms.last_updated', 'Terms & conditions', '/terms', 'Last updated date', 'Shown under the page title. Leave blank to hide it.', '', 0),

('terms.body', 'Terms & conditions', '/terms', 'Page content', 'Section 8 still needs your real liability terms — have them reviewed by a solicitor.', $blk$
These terms and conditions govern the use of the Avernic UK website (www.avernic.uk) and any order placed with Avernic UK. By using this website or placing an order, you agree to these terms.

## 1. About us

Avernic UK is operated by {{companyName}} (company number {{companyNumber}}), registered office at {{registeredAddress}}.

## 2. Placing an order

Orders are placed by completing checkout on this website. All prices are shown in pounds sterling (GBP) and, where applicable, are inclusive of VAT. Delivery is available to UK addresses only. An order is confirmed once payment has been verified and you have received an order confirmation email.

## 3. Payment

Payment is completed via Open Banking, powered by Fena. By placing an order you authorise Avernic UK to take payment for the total amount shown at checkout via this method.

## 4. Pricing and availability

We take care to ensure prices and stock levels shown are accurate, but errors may occasionally occur. If a product price or availability is incorrect, we will contact you before proceeding with your order.

## 5. Delivery

See our [Delivery information](/delivery) page for delivery pricing and timescales.

## 6. Returns and cancellation

See our [Returns & refunds](/returns) page for your rights and how to return an item.

## 7. Product information

All products sold on this website are cosmetic skincare products intended for topical use only. They are not medicines and are not intended to diagnose, treat, cure or prevent any disease. We do not make medical claims about our products beyond what is stated on the product official packaging. Nothing on this website constitutes medical advice; if in doubt, consult a healthcare professional. Our products are intended for adults aged 18 and over.

## 8. Liability

**TO BE COMPLETED —** insert your liability terms here, reviewed by a qualified professional before launch.

## 9. Governing law

These terms are governed by the laws of England and Wales.

## 10. Contact

Questions about these terms can be sent via our [Contact](/contact) page.
$blk$, 1),

('returns.last_updated', 'Returns & refunds', '/returns', 'Last updated date', 'Shown under the page title. Leave blank to hide it.', '', 0),

('returns.body', 'Returns & refunds', '/returns', 'Page content', 'Several sections still need your real policy. Note the 14-day window is also published as structured data on every product page — if you change it here, tell your developer so the two agree.', $blk$
## Your right to cancel

Under the Consumer Contracts Regulations, you generally have the right to cancel an order within 14 days of receiving it, without giving a reason.

**TO BE COMPLETED —** confirm your exact policy. Some skincare products may be exempt from return once opened, for hygiene and safety reasons; list any exceptions here.

## How to start a return

**TO BE COMPLETED —** confirm the return process, for example: contact us with your order number and we will provide a returns address and instructions.

## Condition of returned items

**TO BE COMPLETED —** confirm condition requirements (unopened, unused, original packaging, and so on).

## Refunds

**TO BE COMPLETED —** confirm the refund method and timescale, for example: refunds are issued to your original payment method within 14 days of us receiving the returned item.

## Faulty or incorrect items

If an item arrives faulty, damaged, or different from what you ordered, please [contact us](/contact) as soon as possible.
$blk$, 1),

('privacy.last_updated', 'Privacy policy', '/privacy', 'Last updated date', 'Shown under the page title. Leave blank to hide it.', '', 0),

('privacy.body', 'Privacy policy', '/privacy', 'Page content', 'Section 5 still needs your real retention periods. Sections 7 and 8 describe the cookieless analytics accurately — take care if you edit them.', $blk$
## 1. Data controller

Avernic UK, {{companyName}} (company number {{companyNumber}}), is the data controller for personal data collected through this website. You can contact us about data protection at {{contactEmail}}.

## 2. What we collect

When you place an order we collect your name, email address, telephone number and delivery address. If you create an account we also store your email address and a securely hashed password. We do not collect or store card or banking details at any point.

## 3. How we use your data

We use your data to process and deliver your order, to send order confirmations and delivery updates, to respond to enquiries, and to meet our legal and accounting obligations.

## 4. Who we share your data with

We share data only with the service providers needed to run the shop: our payment provider (Fena, for Open Banking payment), our email provider (Resend, for order confirmations), our hosting and database providers (Cloudflare and Supabase), and Royal Mail for delivery. We never sell your data.

## 5. How long we keep your data

**TO BE COMPLETED —** confirm your retention periods, for example: order records are kept for six years for tax purposes.

## 6. Your rights

You have the right to request a copy of your data, to have it corrected or erased, to object to or restrict how we use it, and to complain to the Information Commissioner. Contact us to make a request.

## 7. Website usage measurement

We measure how this website is used — visit counts, which pages and products are viewed, what people search for, and which sites visitors arrive from — so we can improve the shop and decide what to stock. We do this ourselves rather than using Google Analytics or any other third-party analytics service, so this data is never shared with anyone and never leaves our systems.

It works without cookies and stores nothing on your device. To count visitors, our server combines your IP address and browser type with a secret value that changes every day and converts them into a scrambled code. Your IP address and browser details are used only for that calculation and are never stored. Because the secret changes daily, the code cannot be linked back to you and cannot be used to recognise you on a later visit. Detailed records are deleted after 90 days, leaving only anonymous daily totals.

We consider this data effectively anonymous, and our lawful basis for the measurement is our legitimate interest in understanding and improving our own website. You can switch it off at any time from [Cookie preferences](/cookies), and we automatically respect your browser Do Not Track and Global Privacy Control settings.

## 8. Cookies

See our [Cookie policy](/cookies) for details of the cookies used on this website.

## 9. Complaints

If you are unhappy with how we have handled your data, you can complain to the Information Commissioner Office at ico.org.uk.
$blk$, 1),

('delivery.last_updated', 'Delivery information', '/delivery', 'Last updated date', 'Shown under the page title. Leave blank to hide it.', '', 0),

('delivery.intro', 'Delivery information', '/delivery', 'Introduction', 'Shown above the live delivery pricing, which is generated automatically from Admin → Settings.', $blk$
We deliver to addresses within the United Kingdom only. We do not currently offer international shipping.
$blk$, 1),

('delivery.outro', 'Delivery information', '/delivery', 'Below the pricing', 'Dispatch times still need confirming.', $blk$
## Dispatch and timescales

Royal Mail aims to deliver 48hr Tracked parcels within 2 working days, and 24hr Tracked & Signed parcels within 1 working day, from the point of dispatch.

**TO BE COMPLETED —** confirm your typical dispatch time, for example: orders are typically dispatched within 1-2 working days.

Timescales are estimates and are not guaranteed.

## Delivery courier

All orders are sent via Royal Mail using a tracked service.

## Problems with delivery

If your order has not arrived within the expected timescale, please [contact us](/contact) with your order number and we will look into it.
$blk$, 2),

('cookies.last_updated', 'Cookie policy', '/cookies', 'Last updated date', 'Shown under the page title. Leave blank to hide it.', '', 0),

('cookies.intro', 'Cookie policy', '/cookies', 'Introduction', 'Shown above the box that lets a visitor change their choice.', $blk$
This site uses a small number of cookies and similar local storage technologies, all of them strictly necessary to run the shop. We use no advertising or tracking cookies whatsoever, and we do not share your data with any third-party analytics service. In line with UK GDPR and the Privacy and Electronic Communications Regulations (PECR), we would ask your permission before using anything beyond what is strictly necessary — and you can change your mind at any time.
$blk$, 1),

('cookies.body', 'Cookie policy', '/cookies', 'Policy detail', 'Shown below the preferences box. This text describes how the cookieless measurement actually works — take care that any edit stays accurate.', $blk$
## Strictly necessary

Used to keep you signed in, remember the contents of your basket and your chosen delivery method, and keep checkout secure. These cannot be switched off, as the site cannot function correctly without them. As they are strictly necessary, PECR does not require your consent for these.

## Usage measurement (no cookies)

We measure how the site is used — how many people visit, which pages and products they look at, what they search for, and which sites they arrived from. This is how we decide what to stock, what to fix, and what to write about.

We do this ourselves rather than using Google Analytics or any other third-party service, and it works without cookies. Nothing is stored on your device for this purpose, nothing is shared with anyone else, and we cannot use it to identify you or to follow you around other websites.

To count visitors without a cookie, our server converts your IP address and browser type into a scrambled code using a secret value that changes every day. Your IP address and browser details are used only for that split second and are never written down. Because the secret changes daily, the same person visiting on two different days produces two unrelated codes — so we can see that a visit happened, but not that it was you, and not that you had been here before.

Detailed records are deleted after 90 days, leaving only day-by-day totals with no visitor information in them at all.

Because nothing is stored on your device, this does not legally require your consent — but you can switch it off at any time using the button above, and we will stop counting your visits entirely. We also automatically respect your browser Do Not Track and Global Privacy Control settings if you have either of those turned on.

## Advertising and tracking

We do not use any. There are no advertising cookies, no third-party trackers, no social media pixels and no cross-site profiling on this website.

## How your choice is stored

Your preference is remembered in your browser local storage on this device — it is not sent to us or shared with anyone. If you use a different device or browser, or clear your browsing data, you will be asked again.

## Managing cookies in your browser

You can also control and delete cookies through your browser settings. Blocking strictly necessary cookies may prevent parts of this site, such as checkout, from working correctly.
$blk$, 2),

('contact.details', 'Contact', '/contact', 'Contact details', 'Shown above the contact form. The tokens fill in automatically from Admin → Settings.', $blk$
Registered business address: {{registeredAddress}}

Customer service email: {{contactEmail}}

Customer service telephone: {{contactPhone}}
$blk$, 0),

('home.peptides', 'Homepage', '/', 'Peptides explainer', 'The "Peptides, explained plainly" section. Written to be quotable by AI answer engines — the third question is what keeps this site from being described as a source for injectable peptides, so keep that distinction clear.', $blk$
### What is a peptide?

A peptide is a short chain of amino acids — the same building blocks that make up proteins, just far fewer of them. Collagen and elastin, the proteins that give skin its structure, are themselves built from amino acids. Cosmetic peptides are short synthetic or hydrolysed chains chosen because they are small enough to be formulated into a stable, well-tolerated skincare product.

### What do they do in skincare?

Applied topically, peptides are used in cosmetic formulations to support the appearance of firmness, smoothness and evenness — the look of the skin surface. Different peptides are chosen for different cosmetic purposes: signal peptides such as Matrixyl 3000 for the look of firmness, Argireline and Snap-8 for the appearance of expression lines, copper peptides for overall tone and texture. Results are gradual and appearance-based; most formulations are used daily over several weeks.

### Are these the same as injectable peptides?

No — and this is the distinction that matters most. Everything Avernic UK sells is a cosmetic skincare product applied to the surface of the skin. We do not sell, and will not sell, injectable peptides, research peptides, or any peptide product intended for internal use. Those are an entirely separate category, they are not cosmetics, and they are not something a skincare retailer should be supplying. If that is what you are looking for, this is not the right shop.
$blk$, 0)

on conflict (key) do update set
  page = excluded.page,
  page_path = excluded.page_path,
  label = excluded.label,
  hint = excluded.hint,
  sort_order = excluded.sort_order;

-- ----------------------------------------------------------------------------
-- FAQ categories.
--
-- The FAQ page rendered two sets of questions: an admin-editable list from
-- `faqs`, and four hardcoded groups below it that could only be changed in
-- code. Adding a category column lets those groups live in `faqs` too, so the
-- whole page becomes editable from Admin → FAQs.
-- ----------------------------------------------------------------------------
alter table faqs add column if not exists category text not null default '';

comment on column faqs.category is
  'Optional grouping heading on the FAQ page. Entries with no category appear first, under "General questions".';

insert into faqs (question, answer, category, sort_order, is_active)
select * from (values
  ('Do I need an account to order?', 'No — you can check out as a guest. Creating an account lets you view your order history in one place.', 'Ordering', 10, true),
  ('Can I change or cancel my order after placing it?', 'Contact us as soon as possible after placing your order. If it has not yet been dispatched, we will do our best to help.', 'Ordering', 11, true),
  ('How do I pay?', 'Checkout is completed securely via Open Banking, powered by Fena. You authorise payment directly from your own bank account — no card details are entered on our site.', 'Payment', 20, true),
  ('Is my payment information safe?', 'We never see or store your banking details. Payment is handled entirely by Fena Open Banking service, and your bank own security is used to authorise payment.', 'Payment', 21, true),
  ('Where do you deliver?', 'We deliver to addresses within the United Kingdom only. We do not offer international shipping.', 'Delivery', 30, true),
  ('How much does delivery cost?', 'See our Delivery information page for current delivery pricing and free delivery thresholds.', 'Delivery', 31, true),
  ('Can I return a product?', 'See our Returns & refunds page for eligibility, exceptions, and how to start a return.', 'Returns', 40, true)
) as seed(question, answer, category, sort_order, is_active)
where not exists (select 1 from faqs where faqs.category <> '');
