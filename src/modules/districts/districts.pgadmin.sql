SELECT (SELECT COUNT(*) FROM districts) - (SELECT COUNT(*) FROM districts WHERE count_pages IS NOT NULL);

SELECT 
	region as "Регион",
	district_link_ostrovok as "Ссылка",
	count_pages as "Число страниц", 
	processed_pages as "Обработанные страницы"
FROM districts WHERE all_pages_loaded = true
ORDER BY count_pages DESC;

SELECT 
	region as "Регион",
	district_link_ostrovok as "Ссылка",
	count_pages as "Число страниц", 
	processed_pages as "Обработанные страницы"
FROM districts WHERE all_pages_loaded = false AND count_pages > 0
ORDER BY count_pages DESC;

SELECT COUNT(*) FROM districts WHERE count_pages < 1