--DELETE FROM hotels CASCADE;
/*
UPDATE hotels
SET 
locked_by = NULL
WHERE locked_by IS NOT NULL;
*/
--SELECT * FROM hotels WHERE locked_by IS NOT NULL;
/*
UPDATE hotels
SET locked_by = NULL
WHERE locked_by = '8';
*/
/*
SELECT * FROM hotels WHERE locked_by IS NOT NULL;
SELECT name, name_en FROM hotels WHERE page_processed = false; 
SELECT * FROM hotels WHERE hotel_link_ostrovok = '/hotel/russia/moscow_oblast_troitsk/mid13097037/manchester_private_house/';

SELECT name, LENGTH(name) AS length_name, name_en, LENGTH(name_en) AS length_en FROM hotels WHERE (LENGTH(name_en) - LENGTH(name)) > 15 ORDER BY length_en;

SELECT 
	COUNT(*) as count,
	locked_by AS "SERVER"
FROM hotels
WHERE locked_by IS NOT NULL
GROUP BY locked_by
ORDER BY count;

SELECT 
	(SELECT COUNT(*) FROM hotels WHERE name_en IS NOT NULL)  - 149758 AS "SINCE 06:50", 
	(SELECT COUNT(*) FROM hotels WHERE page_processed = true) AS "TOTAL PROCESSED HOTELS",
	(SELECT COUNT(*) FROM hotels WHERE page_processed = true) -  (SELECT COUNT(*) FROM hotels WHERE page_processed = false) AS "TOTAL HOTELS";

	*/
--SELECT * from images WHERE hotel_id = 'b9b26ceb-dd77-4d6f-aea6-0bfed6673bef';
--SELECT count(*) from images;

--SELECT * FROM hotels WHERE page_processed = false;
--SELECT name, name_en FROM hotels WHERE name_en IS NOT NULL; 
/*
UPDATE hotels
SET 
page_loaded = false
WHERE page_processed = false;
*/



/*
UPDATE hotels
SET 
page_loaded = false
WHERE id IN (SELECT id FROM hotels WHERE (LENGTH(name_en) - LENGTH(name)) > 20  AND is_visible = true);
*/

--SELECT name, name_en FROM hotels WHERE name_en IS NOT NULL; 

--SELECT name, LENGTH(name) AS length_name, name_en, LENGTH(name_en) AS length_en FROM hotels WHERE (LENGTH(name_en) - LENGTH(name)) > 15  AND is_visible = true ORDER BY length_en;
/*
SELECT * FROM abouts 
JOIN geo_data ON geo_data.hotel_id = abouts.hotel_id
WHERE abouts.hotel_id IN  (SELECT id FROM hotels WHERE LENGTH(name) = 0);

SELECT * FROM hotels
WHERE id IN 
 (SELECT id FROM hotels WHERE LENGTH(name) = 0);


SELECT name, LENGTH(name) AS length_name, name_en, LENGTH(name_en) AS length_en FROM hotels WHERE (LENGTH(name_en) - LENGTH(name)) > 20  AND is_visible = true ORDER BY length_en;
SELECT * FROM hotels WHERE page_processed = true AND is_visible = true;

SELECT address, address_page FROM hotels
WHERE address_page IS NOT NULL
AND address_page ~ '[A-Za-z]'
ORDER BY address DESC;

SELECT address, address_page FROM hotels
WHERE address_processed = false AND is_visible = true;
*/
/*
SELECT h.name, h.address_page, l.address  FROM hotels h
JOIN locations l ON l.hotel_id = h.id AND l.language = 'ru'
WHERE address_processed = true AND is_visible = true
ORDER BY l.address;
*/

--DELETE from abouts;

/*
UPDATE hotels
SET 
page_loaded = false,
page_processed = false,
abouts_processed = false,
locked_by = NULL
WHERE locked_by IS NOT NULL;
*/

/*
UPDATE hotels
SET 
page_loaded = false,
page_processed = false,
abouts_processed = false,
locked_by = NULL
WHERE is_visible = true AND id NOT IN (SELECT DISTINCT(hotel_id) FROM abouts)
*/

SELECT 
	COUNT(*) as count,
	locked_by AS "SERVER"
FROM hotels
WHERE locked_by IS NOT NULL
GROUP BY locked_by
ORDER BY count;


SELECT h.name,h.name_en, h.address, a.title, a.original_descriptions, a.descriptions FROM hotels h
JOIN abouts a ON a.hotel_id = h.id  AND a.language = 'ru'
ORDER BY h.updated_at DESC
LIMIT 10;
--28465
SELECT 
	(SELECT COUNT(*) FROM hotels h JOIN abouts a ON a.hotel_id = h.id AND a.language = 'ru') - 123070 AS "SINCE 06:20",
	(SELECT 26775) AS "ОБРАБОТАНО ВЧЕРА",	
	(SELECT COUNT(*) FROM hotels h JOIN abouts a ON a.hotel_id = h.id  AND a.language = 'ru')	 AS "ВСЕГО ОБРАБОТАНО",
	(SELECT COUNT(*) from hotels WHERE is_visible = true) - (SELECT COUNT(*) FROM hotels h JOIN abouts a ON a.hotel_id = h.id  AND a.language = 'ru')	 AS "ВСЕГО ОСТАЛОСЬ ОБРАБОТАТЬ";
