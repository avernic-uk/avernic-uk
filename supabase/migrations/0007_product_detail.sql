-- ============================================================================
-- Product detail fields + draft launch copy.
--
-- WHY
-- Every product row shipped with `full_description` set to a placeholder
-- ("Placeholder full product description — replace with the real, approved
-- product copy before launch."). That left product pages with almost no
-- indexable content: a name, a one-line summary and a price. Search engines
-- had nothing to rank and AI answer engines had nothing to cite, so the
-- catalogue was effectively invisible for anything except a brand-name search.
--
-- WHAT THIS ADDS
--   * size_label       — the pack size shown on the page and in schema.org
--   * key_ingredients  — one "Name — what it does" per line
--   * how_to_use       — one step per line (numbered in the UI, not here)
--   * suitability      — who the product is for / skin types
--   * ingredients_inci — the full INCI declaration, deliberately left EMPTY
--
-- ON ingredients_inci: this is a regulated ingredient declaration and must
-- match the actual formulation exactly (it is what a customer with an allergy
-- relies on). It is therefore NOT seeded with invented content — paste the
-- real list from each product's supplier specification via Admin → Products.
-- The product page simply omits the section while it is blank.
--
-- ON THE SEEDED COPY: it is DRAFT and written to stay inside cosmetic claim
-- boundaries — appearance, feel and look only; nothing that states or implies
-- a physiological, therapeutic or medicinal effect. Review it in Admin →
-- Products before launch, and check the named actives against the actual
-- formulations. Each UPDATE is guarded on the placeholder text still being
-- present, so this migration is safe to re-run and will never overwrite copy
-- that has since been edited by hand.
-- ============================================================================

alter table products add column if not exists size_label text not null default '';
alter table products add column if not exists key_ingredients text not null default '';
alter table products add column if not exists how_to_use text not null default '';
alter table products add column if not exists suitability text not null default '';
alter table products add column if not exists ingredients_inci text not null default '';

comment on column products.key_ingredients is 'One "Name — what it does" per line. Rendered as a definition list on the product page.';
comment on column products.how_to_use is 'One step per line. Numbered by the UI, so do not number them here.';
comment on column products.ingredients_inci is 'Full INCI declaration. Must match the actual formulation — never auto-generated.';

-- ----------------------------------------------------------------------------
-- Draft copy. Guarded so it only ever fills in a product still carrying the
-- original placeholder description.
-- ----------------------------------------------------------------------------

update products set
  size_label = '30ml',
  full_description = 'A daily treatment serum built around two of the most widely used peptide complexes in cosmetic skincare: Matrixyl 3000 and Argireline. Together they target the two things that make skin read as tired — a loss of surface firmness, and the fine expression lines that settle in around the eyes, mouth and forehead.

The texture is deliberately light. It absorbs in seconds and leaves no film, so it sits under a moisturiser, an SPF or makeup without pilling or shine. Most people notice the immediate smoothing effect first; the change in how firm and even the skin looks builds over four to eight weeks of consistent daily use.

Fragrance-free and suitable for use morning and night.',
  key_ingredients = 'Matrixyl 3000 (Palmitoyl Tripeptide-1 & Palmitoyl Tetrapeptide-7) — a signal peptide pairing widely used to support the appearance of firmness and smoother texture.
Argireline (Acetyl Hexapeptide-8) — targets the look of expression lines, particularly across the forehead and around the eyes.
Glycerin — a humectant that draws water into the surface layers so skin looks plumper and less papery.',
  how_to_use = 'Cleanse and pat the skin almost dry — peptides spread further on skin that is still slightly damp.
Apply three to four drops to the face and neck, avoiding the immediate eye area.
Press gently into the skin rather than rubbing, and let it absorb for around a minute.
Follow with a moisturiser, and an SPF if you are using it in the morning.',
  suitability = 'Suitable for all skin types, including sensitive skin. Fragrance-free and non-comedogenic. A good first step if you have not used a peptide serum before.'
where slug = 'triple-peptide-renewal-serum-30ml'
  and (full_description = '' or full_description like 'Placeholder%');

update products set
  size_label = '30ml',
  full_description = 'A copper peptide serum built around GHK-Cu, a naturally occurring copper tripeptide that has been used in cosmetic skincare for decades. It is the serum to reach for when the concern is overall skin quality rather than one specific line: uneven tone, a rough or crepey surface texture, and skin that has stopped looking resilient.

Copper peptides are famously temperamental to formulate with — they lose their characteristic blue colour and their usefulness when paired with the wrong actives. This one is formulated as a standalone step and is best used on its own rather than layered directly with a vitamin C or an exfoliating acid, which is why the routine below asks you to alternate rather than stack.

Expect a faint blue tint to the liquid. That is the copper, and it is entirely normal.',
  key_ingredients = 'Copper Tripeptide-1 (GHK-Cu) — the copper peptide the serum is built around, used in skincare to support the look of firmness, tone and surface texture.
Sodium Hyaluronate — a low-weight hyaluronic acid that hydrates the surface so texture looks smoother straight away.
Panthenol (Pro-Vitamin B5) — a well-tolerated humectant that helps skin feel comfortable and conditioned.',
  how_to_use = 'Use at night, on clean, slightly damp skin.
Apply three to four drops across the face and neck, avoiding the immediate eye area.
Allow it to absorb fully before applying anything else.
Follow with a moisturiser to seal it in.
Alternate nights with any vitamin C or exfoliating acid rather than layering them together — copper peptides do not stay stable alongside those actives.',
  suitability = 'Best suited to normal, combination and mature skin where the concern is overall tone and texture. If you already use a strong acid or retinoid, introduce this on alternate nights.'
where slug = 'copper-peptide-repair-serum-30ml'
  and (full_description = '' or full_description like 'Placeholder%');

update products set
  size_label = '50ml',
  full_description = 'A lightweight daytime moisturiser that does the firming work of a treatment without the weight of a rich cream. Palmitoyl Pentapeptide-4 sits alongside a straightforward hydrating base, so skin looks smoother and firmer through the day rather than simply feeling coated.

The reason to choose this one over a heavier cream is what happens next. It sinks in completely in under a minute and dries down to a matte, slightly cushioned finish, which means SPF goes on over it without rolling and makeup sits properly instead of separating by mid-morning.

Use it as the last step of a morning routine, or on its own if your skin is comfortable with minimal layering.',
  key_ingredients = 'Palmitoyl Pentapeptide-4 — a signal peptide used to support the appearance of firmness and a smoother surface.
Glycerin — draws water into the upper layers so skin looks plump rather than tight.
Squalane — a lightweight emollient that softens without leaving a greasy film.',
  how_to_use = 'Apply to clean skin in the morning, after any serum.
Warm a pea-sized amount between the fingertips and press it over the face and neck.
Give it about a minute to absorb before applying SPF or makeup.',
  suitability = 'Suitable for all skin types, and particularly good for combination or oily skin that finds most day creams too heavy. Works well under makeup and sunscreen.'
where slug = 'peptide-firming-day-cream-50ml'
  and (full_description = '' or full_description like 'Placeholder%');

update products set
  size_label = '50ml',
  full_description = 'The night-time counterpart to a light day cream, and deliberately much richer. Skin loses more water overnight than at any other point in the day, so this one pairs a peptide complex with hyaluronic acid and a more substantial emollient base to hold that moisture in until morning.

It is a cream you can feel. Applied at night it leaves a soft, slightly occlusive finish that stays put on the pillow, and by morning skin looks noticeably less creased and feels supple rather than tight. If your skin gets rough and papery in winter, or after a period of central heating and not enough sleep, this is the step that fixes the look of it fastest.

Rich enough to be used on its own as a final night step.',
  key_ingredients = 'Peptide complex — signal peptides used to support the look of firmness and smoother texture overnight.
Sodium Hyaluronate — binds water in the surface layers so skin looks plumper by morning.
Shea Butter and Squalane — emollients that soften the skin surface and slow overnight moisture loss.',
  how_to_use = 'Use at night as the final step of your routine.
Warm a generous pea-sized amount between the fingertips.
Press it over the face, neck and decolletage, working upwards.
Add a second thin layer over any areas that feel particularly dry.',
  suitability = 'Best for normal, dry and mature skin. If your skin is oily or congestion-prone, use it a few nights a week rather than nightly, or keep it to the drier areas of the face.'
where slug = 'overnight-peptide-recovery-cream-50ml'
  and (full_description = '' or full_description like 'Placeholder%');

update products set
  size_label = '15ml',
  full_description = 'The skin around the eyes is the thinnest on the face, and it shows tiredness before anywhere else. This cream pairs caffeine with a peptide complex to address the two things that make eyes read as tired: the puffiness that shows up in the morning, and the fine lines that catch the light across the eye area.

The caffeine does the immediate work — applied cool, it visibly de-puffs within minutes, which is why the routine below suggests keeping the tube in the fridge. The peptides do the slower work on how smooth and firm the eye contour looks over several weeks.

The texture is a light gel-cream, chosen so it does not migrate into the eye or slide under concealer through the day.',
  key_ingredients = 'Caffeine — helps visibly reduce the look of puffiness around the eye, most noticeably first thing in the morning.
Peptide complex — supports the appearance of a smoother, firmer eye contour over time.
Glycerin — hydrates the thin skin around the eye so fine lines look softer.',
  how_to_use = 'Use morning and night on clean skin.
Take a small amount — about the size of a grain of rice for both eyes.
Tap it gently along the orbital bone with your ring finger, staying about a centimetre from the lash line.
Let it absorb fully before applying concealer.
Store it in the fridge if morning puffiness is your main concern.',
  suitability = 'Suitable for all skin types. Ophthalmologically considerate formulation, but as with any eye product, avoid direct contact with the eye itself.'
where slug = 'peptide-eye-contour-cream-15ml'
  and (full_description = '' or full_description like 'Placeholder%');

update products set
  size_label = '15ml',
  full_description = 'A targeted serum for expression lines, built around Snap-8 — an eight-amino-acid peptide developed as a gentler alternative to Argireline for the look of lines that form through repeated movement rather than through dryness.

This is a precision product rather than an all-over one. It is worth using if your main concern is the fan of lines at the outer corner of the eye, or the horizontal creases that stay visible even when your face is at rest. It is not a replacement for an eye cream — it is the treatment step that goes underneath one.

The texture is a thin, fast-absorbing fluid with no fragrance and no slip, so it layers cleanly under a cream without pilling.',
  key_ingredients = 'Snap-8 (Acetyl Octapeptide-3) — an eight-amino-acid peptide used to soften the appearance of expression lines.
Sodium Hyaluronate — hydrates so lines that are partly dehydration look immediately less defined.
Panthenol (Pro-Vitamin B5) — keeps the thin eye-area skin feeling comfortable.',
  how_to_use = 'Apply to clean skin before your eye cream, morning and night.
Use one drop for both eyes.
Pat it along the orbital bone and out towards the temple with your ring finger.
Wait until it has fully absorbed, then follow with an eye cream.',
  suitability = 'Suitable for all skin types. Designed to be layered under Peptide Eye Contour Cream rather than used instead of it.'
where slug = 'snap8-smoothing-eye-serum-15ml'
  and (full_description = '' or full_description like 'Placeholder%');

update products set
  size_label = '150ml',
  full_description = 'A soap-free daily cleanser designed for one specific job: getting skin properly clean without undoing the peptide routine you apply afterwards.

Most foaming cleansers work because they are alkaline, and alkaline cleansing is what leaves skin feeling squeaky, tight and slightly raw. This one uses a mild, pH-balanced surfactant system with an amino peptide complex, so it removes oil, sweat and the day generally, while leaving the skin barrier intact. Skin should feel clean and comfortable afterwards — never tight.

It produces a low, soft lather rather than a dense foam. That is deliberate, and it is the point.',
  key_ingredients = 'Amino peptide complex — supports the skin surface through cleansing so it feels conditioned rather than stripped.
Mild non-sulphate surfactant system — lifts oil and daily grime at a skin-friendly pH.
Glycerin — offsets the drying effect of cleansing so skin feels comfortable straight out of the shower.',
  how_to_use = 'Use morning and night on damp skin.
Massage a small amount over the face for around thirty seconds, avoiding the eyes.
Rinse thoroughly with lukewarm water.
Pat almost dry and apply your serum while the skin is still slightly damp.',
  suitability = 'Suitable for all skin types including sensitive and easily-tightened skin. Safe to use twice daily. Not designed to remove heavy or waterproof makeup on its own — use the Peptide Micellar Water first.'
where slug = 'gentle-peptide-cleansing-gel-150ml'
  and (full_description = '' or full_description like 'Placeholder%');

update products set
  size_label = '200ml',
  full_description = 'A no-rinse micellar water for the step before cleansing. Micelles — tiny clusters of gentle cleansing molecules suspended in water — lift makeup, sunscreen and the day off the skin surface without the scrubbing that leaves the eye area red and irritated.

The reason this one belongs in a peptide routine is what it does not do. There is no alcohol to sting, no strong fragrance, and no heavy oil to leave a film that stops a serum absorbing afterwards. Skin is left clean and neutral, ready for whatever comes next.

Most useful as the first step of a double cleanse, particularly on days with SPF or long-wear makeup.',
  key_ingredients = 'Micellar cleansing system — lifts makeup and sunscreen on contact, so there is no need to rub.
Peptide complex — conditions the skin surface during removal.
Glycerin — leaves skin hydrated rather than squeaky after the pad comes away.',
  how_to_use = 'Saturate a cotton pad and press it against closed eyes for a few seconds before wiping — this dissolves eye makeup instead of dragging it.
Sweep gently over the face, eyes and lips until the pad comes away clean.
Follow with the Gentle Peptide Cleansing Gel for a full second cleanse.
No rinsing required if you are using it on its own.',
  suitability = 'Suitable for all skin types, including sensitive skin and contact lens wearers. Alcohol-free and fragrance-free.'
where slug = 'peptide-micellar-water-200ml'
  and (full_description = '' or full_description like 'Placeholder%');

update products set
  size_label = 'Box of 5 masks',
  full_description = 'A box of five single-use sheet masks soaked in a hydrolysed collagen peptide essence — the weekly treatment step in an otherwise daily routine.

A sheet mask works differently to a serum. The sheet holds the essence against the skin and slows evaporation, so the surface layers take up considerably more water in twenty minutes than they would from a product left open to the air. The visible result is immediate: skin looks plumper, fine lines look softer, and makeup goes on better for a day or two afterwards.

Worth keeping for the evening before something that matters. There is enough essence left in each sachet to sweep down the neck and decolletage once the mask comes off.',
  key_ingredients = 'Hydrolysed collagen peptides — small enough to sit on the skin surface and hold water where it shows, for a plumper look.
Sodium Hyaluronate — draws moisture into the upper layers over the twenty minutes the mask is on.
Glycerin — keeps the effect from disappearing the moment the mask is removed.',
  how_to_use = 'Use on clean, dry skin, after cleansing and before serum.
Unfold the mask and lay it over the face, lining up the eye and mouth openings, then smooth out any air pockets.
Leave on for fifteen to twenty minutes. Do not leave it until it dries out — that works against you.
Remove and discard the sheet, then press the remaining essence into the skin rather than rinsing it off.
Use the leftover essence in the sachet on the neck and decolletage.
Once or twice a week.',
  suitability = 'Suitable for all skin types. Single use — each mask is intended to be used once and discarded.'
where slug = 'collagen-peptide-sheet-masks-5pk'
  and (full_description = '' or full_description like 'Placeholder%');

update products set
  size_label = '7 x 2ml ampoules',
  full_description = 'A seven-night course of sealed, single-dose peptide ampoules at a concentration higher than a daily serum. Each glass ampoule holds 2ml — enough for the face and neck in one sitting — and is sealed until the moment you snap it open, which is why the concentration can be pushed further than a product that has to stay stable in a pump bottle for months.

This is a course, not a daily habit. Use it as a reset: over a run of consecutive nights before an event, at a change of season, or when skin has stopped responding to a routine that used to work. Run the full seven nights consecutively for the effect it is designed for — skipping nights blunts it.

Each ampoule is intended to be opened and used in a single application.',
  key_ingredients = 'Concentrated peptide complex — dosed higher than a daily serum, with each ampoule sealed until use.
Sodium Hyaluronate — supports the immediate plumping effect across the course.
Panthenol (Pro-Vitamin B5) — keeps skin comfortable at the higher concentration.',
  how_to_use = 'Use at night, over seven consecutive nights.
Snap the neck of one ampoule away from you, using the pad supplied.
Pour the contents into your palm and press over clean, slightly damp skin on the face and neck.
Let it absorb for a minute, then follow with a night cream.
Discard the ampoule after a single use — there are no preservatives holding an opened one for tomorrow.
Repeat the course no more than once every eight to twelve weeks.',
  suitability = 'Suitable for all skin types. Best used as an occasional intensive course alongside a daily routine, rather than as a permanent replacement for a serum.'
where slug = 'peptide-ampoule-booster-7x2ml'
  and (full_description = '' or full_description like 'Placeholder%');
