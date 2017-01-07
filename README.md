# Процесс работы (WorkFlow)

В системе контроля задач создаётся новый элемент с уникальным именем (порядковым номером).
В репозитории проекта создаётся ветка с этим именем в нижнем регистре.

Раработчик вносит изменения в код и выполняет `push` на удалённый сервер.
CI-сервер (gitlab) подхватывает это событие и создаёт задание для `worker` для песочниц.

## Конфигурация worker:

* много оперативной памяти (из расчёта количество задач в день, над которыми предстоит работать * 3 * 128M памяти на контейнер);
* 100 GB HDD;
* `docker`-демон;
* `docker-compose`;
* хостовой nginx для проксирования сайтов;
* хостовой [consul](https://consul.io) для разрешения имён контейнеров в IP-адреса;
* скрипты для ночного удаления контейнеров;
* скрипты для еженедельного удаления песочниц.

