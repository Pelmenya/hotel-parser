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
docker exec -i postgres_postgis_parser /bin/bash -c "PGPASSWORD=secret pg_dump --username postgres hotel_parser" > ./dump/dump_21_11_24.sql
```

### Restore BD
``` cmd
docker exec -i postgres_postgis_parser /bin/bash -c "PGPASSWORD=secret psql --username postgres hotel_parser" < ./dump/dump.sql
```

