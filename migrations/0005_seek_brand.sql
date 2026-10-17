-- Rename the default storefront copy. Custom names and edited policies are left alone.
update site_settings
set store_name = 'SEEK'
where id = 'default' and store_name in ('BSN Market', 'BSN MARKET');

update site_settings
set tagline = 'Building on Trust.'
where id = 'default' and tagline = 'Your Market. Your Choice. Delivered.';

update policies
set body = replace(replace(body, 'BSN Market', 'SEEK'), 'Barrister Street Network', 'SEEK'),
    updated_at = now()
where body like '%BSN Market%' or body like '%Barrister Street Network%';
