alter table product_categories add column if not exists parent_id text references product_categories (id);

insert into product_categories (id, slug, name, sort_order, parent_id) values
  ('fashion-women', 'fashion-women', 'Women''s clothing', 11, 'fashion'),
  ('fashion-men', 'fashion-men', 'Men''s clothing', 12, 'fashion'),
  ('fashion-bags', 'fashion-bags', 'Bags', 13, 'fashion'),
  ('beauty-skin', 'beauty-skin', 'Skincare', 21, 'beauty'),
  ('home-kitchen', 'home-kitchen', 'Kitchenware', 31, 'home'),
  ('home-appliances', 'home-appliances', 'Home appliances', 32, 'home'),
  ('home-bedding', 'home-bedding', 'Bedding', 33, 'home'),
  ('home-decor', 'home-decor', 'Home décor', 34, 'home'),
  ('groceries-food', 'groceries-food', 'Foodstuffs', 41, 'groceries'),
  ('electronics-audio', 'electronics-audio', 'Audio', 61, 'electronics'),
  ('electronics-appliances', 'electronics-appliances', 'Appliances', 62, 'electronics'),
  ('phones-android', 'phones-android', 'Android phones', 51, 'phones'),
  ('baby-clothing', 'baby-clothing', 'Baby clothing', 71, 'baby'),
  ('sports-footwear', 'sports-footwear', 'Sports footwear', 81, 'sports')
on conflict (id) do nothing;

update products set category_id = 'fashion-women' where id = 'ankara-midi-dress' and category_id = 'fashion';
update products set category_id = 'fashion-men' where id = 'embroidered-kaftan' and category_id = 'fashion';
update products set category_id = 'fashion-bags' where id = 'school-backpack' and category_id = 'fashion';
update products set category_id = 'beauty-skin' where id in ('shea-body-butter', 'black-soap-trio') and category_id = 'beauty';
update products set category_id = 'home-kitchen' where id = 'pot-set' and category_id = 'home';
update products set category_id = 'home-appliances' where id = 'table-blender' and category_id = 'home';
update products set category_id = 'home-bedding' where id = 'ortho-pillow' and category_id = 'home';
update products set category_id = 'home-decor' where id = 'market-basket' and category_id = 'home';
update products set category_id = 'groceries-food' where id in ('parboiled-rice', 'dried-crayfish') and category_id = 'groceries';
update products set category_id = 'electronics-audio' where id = 'neckband-earphones' and category_id = 'electronics';
update products set category_id = 'electronics-appliances' where id = 'standing-fan' and category_id = 'electronics';
update products set category_id = 'phones-android' where id = 'android-handset' and category_id = 'phones';
update products set category_id = 'baby-clothing' where id = 'baby-romper-set' and category_id = 'baby';
update products set category_id = 'sports-footwear' where id = 'football-boots' and category_id = 'sports';

alter table promotional_campaigns add column if not exists retailer_id text;
alter table promotional_campaigns add column if not exists status text not null default 'approved';
alter table promotional_campaigns add column if not exists rejection_reason text not null default '';
