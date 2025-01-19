SELECT DISTINCT category
FROM (
  SELECT jsonb_array_elements(geo_list) ->> 'category' AS category
  FROM geo_data
) AS categories WHERE category IS NOT NULL;