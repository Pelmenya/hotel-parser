/*
UPDATE hotels 
SET 
address_processed = false
WHERE id IN 
(SELECT 
hotel_id
FROM locations
GROUP BY hotel_id
HAVING COUNT(*) = 1)
*/
/*
SELECT 
* FROM hotels
WHERE id IN 
(SELECT 
hotel_id
FROM locations
GROUP BY hotel_id
HAVING COUNT(*) = 1)
*/
/*
DELETE 
FROM locations
WHERE hotel_id IN (SELECT 
hotel_id
FROM locations
GROUP BY hotel_id
HAVING COUNT(*) = 1)
*/

SELECT 
hotel_id
FROM locations
GROUP BY hotel_id
HAVING COUNT(*) = 1;

SELECT 
	h.id as id, 
	h.address_processed,
	l.address
FROM hotels h
JOIN locations l ON l.hotel_id = h.id
ORDER BY h.id;

--Обработаны, но без locations
SELECT * FROM hotels
WHERE address_processed = true
	   AND id NOT IN (SELECT 
	h.id as id 
FROM hotels h
JOIN locations l ON l.hotel_id = h.id
)

