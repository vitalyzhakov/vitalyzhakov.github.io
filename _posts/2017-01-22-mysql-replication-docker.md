# Репликация MySQL-серверов с помощью Docker

До выхода приложения в бой, нужно смоделировать его поведение
[в тестовой среде](/2017/01/09/sandbox-for-web-developers.html).

Технология Docker Swarm позволяет легко масштабировать приложение горизонтально.
Но приложению приходится обращаться к серверу баз данных, задача масшабировать который гораздо труднее.

![Много приложений - одна база](/images/several-upstream-one-db.svg "Много приложений - одна база")

В нашем случае количество запросов на чтение информации гораздо меньше количества изменений
(есть подозрение, что так на большинстве веб-проектов).
Логичным способом увеличения такого бутылочного горлышка -
увеличить количество баз на чтение и настроить приложение таким образом,
чтобы большее количество запросов на чтение
отправлялось на SLAVE-сервера.

![Много приложений - одна база](/images/several-upstream-several-dbs.svg "Много приложений - много баз")

## Настройка репликации

### Изменение в my.cnf для каждого сервера

Каждый сервер должен иметь свой номер.
Master-сервер `server-id=1`.
Slave-сервер `server-id>1`.

Конфигурационный файл находится по адресу
`/etc/mysql/conf.d/my.cnf`

Конфигурация master-сервера

```
[mysqld]
server-id=1
binlog_format=ROW
log-bin
```

Конфигурация slave1

```
[mysqld]
server-id=2
```

Конфигурация slave2

```
[mysqld]
server-id=2
```

### Изменения при старте сервера

На master-сервере нужно выдать права пользователю для чтения файла лога

```
GRANT REPLICATION SLAVE ON *.* TO repl@'%' IDENTIFIED BY 'slavepass';
```

На slave-сервере нужно указать координаты для подключения к master

```
CHANGE MASTER TO MASTER_HOST='${COMPOSE_PROJECT_NAME}-mysql', MASTER_USER='repl', MASTER_PASSWORD='slavepass', MASTER_LOG_FILE='mysqld-bin.000004';
```

### Итоговый код

```
mysql:
  image: 'percona:5.5'
  network_mode: "bridge"
  container_name: ${COMPOSE_PROJECT_NAME}-mysql
  volumes:
    - ${PROJECT_DIR}/build_env/mysql/master.cnf:/etc/mysql/conf.d/my.cnf
    - ${PROJECT_DIR}/build_env/mysql/master.sql:/docker-entrypoint-initdb.d/start.sql
  environment:
    MYSQL_DATABASE: ${MYSQL_DB}
    MYSQL_USER: ${MYSQL_USER}
    MYSQL_PASSWORD: "${MYSQL_PASSWORD}"
    MYSQL_ROOT_PASSWORD: "${MYSQL_ROOT_PASSWORD}"
    SERVICE_NAME: ${COMPOSE_PROJECT_NAME}-mysql

mysqlread1:
  image: 'percona:5.5'
  network_mode: "bridge"
  container_name: ${COMPOSE_PROJECT_NAME}-mysqlread1
  volumes:
    - ${PROJECT_DIR}/build_env/mysql/server2.cnf:/etc/mysql/conf.d/my.cnf
    - ${PROJECT_DIR}/build_env/mysql/slave.sql:/docker-entrypoint-initdb.d/start.sql
  depends_on:
    - mysql
  environment:
    MYSQL_DATABASE: ${MYSQL_DB}
    MYSQL_USER: ${MYSQL_USER}
    MYSQL_PASSWORD: "${MYSQL_PASSWORD}"
    MYSQL_ROOT_PASSWORD: "${MYSQL_ROOT_PASSWORD}"
    SERVICE_NAME: ${COMPOSE_PROJECT_NAME}-mysqlread1

mysqlread2:
  image: 'percona:5.5'
  network_mode: "bridge"
  container_name: ${COMPOSE_PROJECT_NAME}-mysqlread2
  volumes:
    - ${PROJECT_DIR}/build_env/mysql/server2.cnf:/etc/mysql/conf.d/my.cnf
    - ${PROJECT_DIR}/build_env/mysql/slave.sql:/docker-entrypoint-initdb.d/start.sql
  depends_on:
    - mysql
  environment:
    MYSQL_DATABASE: ${MYSQL_DB}
    MYSQL_USER: ${MYSQL_USER}
    MYSQL_PASSWORD: "${MYSQL_PASSWORD}"
    MYSQL_ROOT_PASSWORD: "${MYSQL_ROOT_PASSWORD}"
    SERVICE_NAME: ${COMPOSE_PROJECT_NAME}-mysqlread2
```

### Диагностика

Для диагностики нужно иметь возможность подключения к консоли mysql. Для master-сервера вывод будет следующим:

```
mysql> show master status;
+-------------------+----------+--------------+------------------+
| File              | Position | Binlog_Do_DB | Binlog_Ignore_DB |
+-------------------+----------+--------------+------------------+
| mysqld-bin.000004 |   119471 |              |                  |
+-------------------+----------+--------------+------------------+
1 row in set (0.00 sec)
```

В процессах master-сервера мы можем видеть подчключения со SLAVE

```
mysql> SHOW PROCESSLIST;  
+-------+------+------------------+------+-------------+------+-----------------------------------------------------------------------+------------------+-----------+---------------+-----------+
| Id    | User | Host             | db   | Command     | Time | State                                                                 | Info             | Rows_sent | Rows_examined | Rows_read |
+-------+------+------------------+------+-------------+------+-----------------------------------------------------------------------+------------------+-----------+---------------+-----------+
| 24511 | root | localhost        | NULL | Query       |    0 | NULL                                                                  | SHOW PROCESSLIST |         0 |             0 |         0 |
| 24919 | repl | 172.17.0.7:44536 | NULL | Binlog Dump |    0 | Master has sent all binlog to slave; waiting for binlog to be updated | NULL             |         0 |             0 |         0 |
+-------+------+------------------+------+-------------+------+-----------------------------------------------------------------------+------------------+-----------+---------------+-----------+
2 rows in set (0.00 sec)
```

Для slave-сервера

```
mysql> SHOW SLAVE STATUS;
+----------------------------------------+-------------------------+-------------+-------------+---------------+-------------------+---------------------+-------------------------+---------------+-----------------------+------------------+-------------------+-----------------+---------------------+--------------------+------------------------+-------------------------+-----------------------------+------------+------------+--------------+---------------------+-----------------+-----------------+----------------+---------------+--------------------+--------------------+--------------------+-----------------+-------------------+----------------+-----------------------+-------------------------------+---------------+---------------+----------------+----------------+-----------------------------+------------------+
| Slave_IO_State                         | Master_Host             | Master_User | Master_Port | Connect_Retry | Master_Log_File   | Read_Master_Log_Pos | Relay_Log_File          | Relay_Log_Pos | Relay_Master_Log_File | Slave_IO_Running | Slave_SQL_Running | Replicate_Do_DB | Replicate_Ignore_DB | Replicate_Do_Table | Replicate_Ignore_Table | Replicate_Wild_Do_Table | Replicate_Wild_Ignore_Table | Last_Errno | Last_Error | Skip_Counter | Exec_Master_Log_Pos | Relay_Log_Space | Until_Condition | Until_Log_File | Until_Log_Pos | Master_SSL_Allowed | Master_SSL_CA_File | Master_SSL_CA_Path | Master_SSL_Cert | Master_SSL_Cipher | Master_SSL_Key | Seconds_Behind_Master | Master_SSL_Verify_Server_Cert | Last_IO_Errno | Last_IO_Error | Last_SQL_Errno | Last_SQL_Error | Replicate_Ignore_Server_Ids | Master_Server_Id |
+----------------------------------------+-------------------------+-------------+-------------+---------------+-------------------+---------------------+-------------------------+---------------+-----------------------+------------------+-------------------+-----------------+---------------------+--------------------+------------------------+-------------------------+-----------------------------+------------+------------+--------------+---------------------+-----------------+-----------------+----------------+---------------+--------------------+--------------------+--------------------+-----------------+-------------------+----------------+-----------------------+-------------------------------+---------------+---------------+----------------+----------------+-----------------------------+------------------+
| Queueing master event to the relay log | webcontentreplica-mysql | repl        |        3306 |            60 | mysqld-bin.000004 |              119471 | mysqld-relay-bin.007453 |           151 | mysqld-bin.000004     | Yes              | Yes               |                 |                     |                    |                        |                         |                             |          0 |            |            0 |              119471 |          112126 | None            |                |             0 | No                 |                    |                    |                 |                   |                |                   986 | No                            |             0 |               |              0 |                |                             |                1 |
+----------------------------------------+-------------------------+-------------+-------------+---------------+-------------------+---------------------+-------------------------+---------------+-----------------------+------------------+-------------------+-----------------+---------------------+--------------------+------------------------+-------------------------+-----------------------------+------------+------------+--------------+---------------------+-----------------+-----------------+----------------+---------------+--------------------+--------------------+--------------------+-----------------+-------------------+----------------+-----------------------+-------------------------------+---------------+---------------+----------------+----------------+-----------------------------+------------------+
1 row in set (0.19 sec)
```