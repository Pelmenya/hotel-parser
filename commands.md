### Запуск с одним сервером 
``` bash
docker compose -f docker-compose.dev.yml up --build
```

### Запуск всех instance hotel parser
``` bash
docker compose up --build
```
### Dump BD
``` cmd
docker exec -i postgres_postgis_parser /bin/bash -c "PGPASSWORD=secret pg_dump --username postgres hotels" > ./dump/dump_24_12_24_106155.sql
```

### Restore BD
``` cmd
docker exec -i postgres_postgis_parser /bin/bash -c "PGPASSWORD=secret psql --username postgres hotels" < ./dump/dump_24_12_24.sql
```

### Dump Table
``` cmd
docker exec -i postgres_postgis_parser /bin/bash -c "PGPASSWORD=secret pg_dump --username postgres --dbname=hotels_backup --table=public.locations --data-only --no-owner --no-privileges" > ./dump/locations_backup.sql
```

# Удаляем данные из таблицы locations
``` cmd
docker exec -i postgres_postgis_parser /bin/bash -c "PGPASSWORD=secret psql --username postgres --dbname=hotels -c 'DELETE FROM public.locations'"
```

# Импортируем данные из файла
``` cmd
docker exec -i postgres_postgis_parser /bin/bash -c "PGPASSWORD=secret psql --username postgres --dbname=hotels" < ./dump/locations_backup.sql
```
