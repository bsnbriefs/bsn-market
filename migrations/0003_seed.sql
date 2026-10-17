insert into site_settings (id, store_name, tagline, support_email, support_phone, contact_address)
values (
  'default',
  'SEEK',
  'Building on Trust.',
  '',
  '',
  ''
) on conflict (id) do nothing;

insert into product_categories (id, slug, name, sort_order) values
  ('fashion', 'fashion', 'Fashion', 1),
  ('beauty', 'beauty', 'Beauty', 2),
  ('home', 'home', 'Home & kitchen', 3),
  ('groceries', 'groceries', 'Groceries', 4),
  ('phones', 'phones', 'Phones', 5),
  ('electronics', 'electronics', 'Electronics', 6),
  ('baby', 'baby', 'Baby', 7),
  ('sports', 'sports', 'Sports', 8)
on conflict (id) do nothing;

insert into retailer_profiles (
  id, user_id, business_name, contact_name, phone, email, address, state, city,
  categories, description, catalogue_note, terms_accepted, status, is_sample
) values
  (
    'r-lagos', 'catalogue-seed-lagos', 'Lagos Home Goods', 'Catalogue desk', '', '',
    'Sample fulfilment point', 'Lagos', 'Ikeja',
    'Home, beauty, electronics',
    'Home, beauty, and small electronics fulfilled from Ikeja.',
    'Starter catalogue. Not a signed retailer partnership.',
    true, 'approved', true
  ),
  (
    'r-abuja', 'catalogue-seed-abuja', 'Abuja Style House', 'Catalogue desk', '', '',
    'Sample fulfilment point', 'FCT', 'Wuse',
    'Fashion, phones, sports',
    'Fashion and devices fulfilled from Wuse.',
    'Starter catalogue. Not a signed retailer partnership.',
    true, 'approved', true
  ),
  (
    'r-ph', 'catalogue-seed-ph', 'Creek Pantry', 'Catalogue desk', '', '',
    'Sample fulfilment point', 'Rivers', 'Port Harcourt',
    'Groceries, baby',
    'Pantry and baby goods fulfilled from Port Harcourt.',
    'Starter catalogue. Not a signed retailer partnership.',
    true, 'approved', true
  ),
  (
    'r-suspended', 'catalogue-seed-suspended', 'Paused Stall', 'Catalogue desk', '', '',
    'Sample fulfilment point', 'Lagos', 'Yaba',
    'Fashion',
    'Suspended sample retailer. Listings must stay hidden.',
    'Used to prove suspended retailers are not public.',
    true, 'suspended', true
  )
on conflict (id) do nothing;

insert into commission_rules (id, scope, category_id, retailer_id, bps, effective_from, active)
values ('rule-default', 'default', null, null, 1000, '2020-01-01', true)
on conflict (id) do nothing;

insert into delivery_zones (id, state, city, fee_kobo) values
  ('zone-lagos', 'Lagos', '', 250000),
  ('zone-fct', 'FCT', '', 350000),
  ('zone-rivers', 'Rivers', '', 350000)
on conflict (id) do nothing;

insert into promotional_campaigns (id, title, subtitle, image_url, link_path, active, sort_order)
values (
  'camp-market-week',
  'Shop the starter market',
  'Home, fashion, and pantry listings you can edit or archive before launch.',
  '/products/hero.jpg',
  '/shop',
  true,
  1
) on conflict (id) do nothing;

insert into products (
  id, slug, retailer_id, category_id, name, description, brand, price_kobo, compare_at_kobo,
  stock, status, featured, return_eligible, delivery_days_min, delivery_days_max
) values
  ('ankara-midi-dress', 'ankara-midi-dress', 'r-abuja', 'fashion', 'Ankara midi dress',
   'Cotton wax-print midi dress with a lined bodice. Choose a size before checkout.',
   'Studio weave', 2450000, 2800000, 24, 'approved', true, true, 3, 7),
  ('embroidered-kaftan', 'embroidered-kaftan', 'r-abuja', 'fashion', 'Embroidered kaftan',
   'Ivory kaftan with light embroidery at the neck. Fulfilled from Wuse.',
   'Studio weave', 3200000, null, 14, 'approved', true, true, 3, 7),
  ('school-backpack', 'school-backpack', 'r-abuja', 'fashion', 'Canvas school backpack',
   'Olive canvas backpack with a padded laptop sleeve.',
   'Studio weave', 1800000, null, 24, 'approved', false, true, 3, 7),
  ('shea-body-butter', 'shea-body-butter', 'r-lagos', 'beauty', 'Shea and honey body butter',
   'Whipped shea butter blended with honey. 200 ml jar.',
   'Home still', 650000, null, 40, 'approved', true, true, 2, 5),
  ('black-soap-trio', 'black-soap-trio', 'r-lagos', 'beauty', 'Black soap trio',
   'Three bars of traditional black soap. No added fragrance.',
   'Home still', 480000, 550000, 36, 'approved', false, true, 2, 5),
  ('market-basket', 'market-basket', 'r-lagos', 'home', 'Handwoven market basket',
   'Round palm basket for market runs or storage.',
   'Home still', 1850000, null, 15, 'approved', true, true, 2, 6),
  ('pot-set', 'pot-set', 'r-lagos', 'home', 'Three-piece steel pot set',
   'Nested saucepans with lids. Hand wash recommended.',
   'Home steel', 4200000, null, 12, 'approved', false, true, 2, 6),
  ('table-blender', 'table-blender', 'r-lagos', 'home', '1.5 litre table blender',
   'Countertop blender with a clear jug. Confirm voltage with the retailer before use.',
   'Home steel', 3600000, 4100000, 10, 'approved', false, true, 2, 6),
  ('ortho-pillow', 'ortho-pillow', 'r-lagos', 'home', 'Contour sleep pillow',
   'Contoured pillow with a washable cover.',
   'Home still', 1400000, null, 20, 'approved', false, true, 2, 6),
  ('parboiled-rice', 'parboiled-rice', 'r-ph', 'groceries', 'Parboiled rice, 5 kg',
   'Long-grain parboiled rice. Pantry item, packed dry.',
   'Creek pantry', 1250000, null, 50, 'approved', true, false, 2, 5),
  ('dried-crayfish', 'dried-crayfish', 'r-ph', 'groceries', 'Dried crayfish, 500 g',
   'Dried crayfish for soups and stews. Store sealed.',
   'Creek pantry', 720000, null, 30, 'approved', false, false, 2, 5),
  ('neckband-earphones', 'neckband-earphones', 'r-lagos', 'electronics', 'Wireless neckband earphones',
   'Bluetooth neckband with a charging cable. No branded accessories included.',
   'Northside audio', 890000, null, 22, 'approved', false, true, 2, 5),
  ('standing-fan', 'standing-fan', 'r-lagos', 'electronics', 'Rechargeable standing fan',
   'Pedestal fan with a rechargeable pack. Fulfilled from Ikeja.',
   'Home steel', 4500000, null, 8, 'approved', true, true, 2, 6),
  ('android-handset', 'android-handset', 'r-abuja', 'phones', '6.5 inch Android handset',
   'Unlocked Android handset. Storage option changes the price. Charger included.',
   'Northside', 9800000, null, 8, 'approved', true, true, 3, 7),
  ('baby-romper-set', 'baby-romper-set', 'r-ph', 'baby', 'Cotton baby romper, set of 3',
   'Three cotton rompers in sage, cream, and clay. 6–12 months.',
   'Creek pantry', 1500000, null, 18, 'approved', false, true, 3, 7),
  ('football-boots', 'football-boots', 'r-abuja', 'sports', 'Moulded football boots',
   'Firm-ground boots. Pick a size. Not a licensed club product.',
   'Studio weave', 2750000, null, 16, 'approved', false, true, 3, 7),
  ('draft-sample-bowl', 'draft-sample-bowl', 'r-lagos', 'home', 'Unfinished ceramic bowl',
   'Draft listing. Must not appear in the public shop.',
   'Home still', 900000, null, 4, 'draft', false, true, 2, 5),
  ('hidden-paused-cap', 'hidden-paused-cap', 'r-suspended', 'fashion', 'Paused stall cap',
   'Approved product on a suspended retailer. Must stay hidden.',
   'Studio weave', 500000, null, 6, 'approved', false, true, 3, 7)
on conflict (id) do nothing;

insert into product_images (id, product_id, url, sort_order) values
  ('img-ankara', 'ankara-midi-dress', '/products/ankara-midi-dress.jpg', 0),
  ('img-kaftan', 'embroidered-kaftan', '/products/embroidered-kaftan.jpg', 0),
  ('img-bag', 'school-backpack', '/products/school-backpack.jpg', 0),
  ('img-shea', 'shea-body-butter', '/products/shea-body-butter.jpg', 0),
  ('img-soap', 'black-soap-trio', '/products/black-soap-trio.jpg', 0),
  ('img-basket', 'market-basket', '/products/market-basket.jpg', 0),
  ('img-pots', 'pot-set', '/products/pot-set.jpg', 0),
  ('img-blender', 'table-blender', '/products/table-blender.jpg', 0),
  ('img-pillow', 'ortho-pillow', '/products/ortho-pillow.jpg', 0),
  ('img-rice', 'parboiled-rice', '/products/parboiled-rice.jpg', 0),
  ('img-cray', 'dried-crayfish', '/products/dried-crayfish.jpg', 0),
  ('img-buds', 'neckband-earphones', '/products/neckband-earphones.jpg', 0),
  ('img-fan', 'standing-fan', '/products/standing-fan.jpg', 0),
  ('img-phone', 'android-handset', '/products/android-handset.jpg', 0),
  ('img-baby', 'baby-romper-set', '/products/baby-romper-set.jpg', 0),
  ('img-boots', 'football-boots', '/products/football-boots.jpg', 0)
on conflict (id) do nothing;

insert into product_variants (id, product_id, label, sku, price_delta_kobo, stock) values
  ('ankara-s', 'ankara-midi-dress', 'S', 'ANK-S', 0, 6),
  ('ankara-m', 'ankara-midi-dress', 'M', 'ANK-M', 0, 8),
  ('ankara-l', 'ankara-midi-dress', 'L', 'ANK-L', 0, 6),
  ('ankara-xl', 'ankara-midi-dress', 'XL', 'ANK-XL', 0, 4),
  ('kaftan-m', 'embroidered-kaftan', 'M', 'KAF-M', 0, 5),
  ('kaftan-l', 'embroidered-kaftan', 'L', 'KAF-L', 0, 5),
  ('kaftan-xl', 'embroidered-kaftan', 'XL', 'KAF-XL', 0, 4),
  ('phone-128', 'android-handset', '128 GB', 'PH-128', 0, 5),
  ('phone-256', 'android-handset', '256 GB', 'PH-256', 1500000, 3),
  ('boot-41', 'football-boots', 'EU 41', 'BT-41', 0, 4),
  ('boot-42', 'football-boots', 'EU 42', 'BT-42', 0, 4),
  ('boot-43', 'football-boots', 'EU 43', 'BT-43', 0, 4),
  ('boot-44', 'football-boots', 'EU 44', 'BT-44', 0, 4)
on conflict (id) do nothing;

insert into policies (slug, title, body) values
  ('terms', 'Terms and conditions', $pol$
Draft for the business owner to review before launch. This is not legal advice and it is not a claim of regulatory approval.

SEEK is a marketplace operated under the SEEK. Independent retailers supply the products. SEEK facilitates the listing, payment collection, and order record. SEEK is not the manufacturer of retailer products unless a listing clearly says otherwise.

By creating an account you agree to provide accurate contact and delivery details, to pay the amount confirmed on the server at checkout, and not to misuse another person's account.

Orders are confirmed only after payment is verified on the server, or after a delivery fee quote is accepted and then paid. A browser redirect is not proof of payment.
$pol$),
  ('privacy', 'Privacy policy', $pol$
Draft for the business owner to review before launch. This is not legal advice.

SEEK stores the account details, delivery addresses, and order records needed to run the marketplace. Retailers see only the name, phone number, and delivery address required to fulfil their part of an order. They do not see your sign-in password or card details. Card details are never stored on SEEK.

Payment references are kept so an order can be matched to a verified Paystack transaction. Support messages are visible to you and to marketplace administrators.
$pol$),
  ('retailer-agreement', 'Retailer agreement', $pol$
Draft for the business owner to review before launch. This is not legal advice.

Retailers apply with their business details and wait for an administrator to approve them. Until approval, products cannot go live and new orders cannot be allocated.

The retailer is responsible for the accuracy of prices, stock, descriptions, and lawful products. Commission is set by SEEK, recorded on each order item at the time of the order, and cannot be edited by the retailer. Later commission changes do not rewrite old orders.

Retailers must only use customer details to fulfil the order.
$pol$),
  ('returns', 'Returns and refunds', $pol$
Draft for the business owner to review before launch. This is not legal advice.

Return eligibility is shown on each product. A return can be requested after the retailer's part of the order is marked delivered, and only for items marked return-eligible. Groceries in the starter catalogue are not return-eligible.

A refund request is a record. It is not completed until an administrator records it. If Paystack is connected, the platform can submit a refund to Paystack. If that call fails, the ledger still shows the request and the failure is not hidden.

Cancelling is available while every retailer fulfilment is still pending.
$pol$),
  ('delivery', 'Delivery policy', $pol$
Draft for the business owner to review before launch.

Delivery fees are the amounts an administrator has configured for a state or city. Where no fee is configured, checkout creates a quote request instead of inventing a rate. SEEK does not promise nationwide coverage.

An order with more than one retailer is fulfilled separately. Each retailer has their own preparation and dispatch status. A retailer order is marked delivered only by that retailer or an administrator.

The starter fees for Lagos, FCT, and Rivers are setup values. Confirm them before accepting real orders.
$pol$),
  ('prohibited', 'Prohibited products', $pol$
Draft for the business owner to review before launch. This is not a complete statement of Nigerian law.

Do not list weapons, counterfeit goods, recalled items, prescription medicines, wildlife products, or anything you are not legally allowed to sell. Administrators can reject or remove a listing and suspend the retailer.

Customers can report a listing through customer support.
$pol$)
on conflict (slug) do nothing;
