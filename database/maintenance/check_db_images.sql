-- Check product images in database
SELECT id, name, brand, images 
FROM products 
WHERE name LIKE '%미우미우%' OR name LIKE '%원더백%';
