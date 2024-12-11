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
docker exec -i postgres_postgis_parser /bin/bash -c "PGPASSWORD=secret pg_dump --username postgres hotels" > ./dump/dump_11_12_24_v1.sql
```

### Restore BD
``` cmd
docker exec -i postgres_postgis_parser /bin/bash -c "PGPASSWORD=secret psql --username postgres hotels" < ./dump/dump_04_12_24.sql
```

