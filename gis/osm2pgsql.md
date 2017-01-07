# Импорт данных OpenStreetMap в PostgreSQL средствами osm2pgsql

На сайте бывает полезно отобразить географические данные, но простой интеграции с публичными проприетарными сервисами карт может не хватить.
На помощь приходят открытые данные, для географических карт - это <a href="http://www.openstreetmap.org/" target="_blank">Openstreet Map</a>.

## Требования

Действия выполняются на системе

* debian jessie 8.2
* PostgreSQL 9.4
* osm2pgsql 0.86
* пользователь, от которого исполняется скрипт, должен иметь права на запись в целевую базу


## Подготовка базы

Создаём БД gis, добавляем расширения *postgis* и *hstore*

```bash
createdb gis
psql -d gis -c 'CREATE EXTENSION postgis; CREATE EXTENSION hstore'
```

## Импорт данных
Найти географические координаты прямоугольника, который мы хотим импортировать можно на http://www.openstreetmap.org

Для примера взяты [координаты города Нытва](http://vnytve.ru/) в Пермском крае

```bash
#!/bin/bash
FULL_PATH=$(readlink -f $0);
DIR=$(dirname $FULL_PATH);
STYLE_FILE=$DIR/vndb.style;

#проинициализировать переменные настоящими значениями
HOST=''; # хост базы данных
PORT=''; # порт базы данных
DB=''; # название базы данных на сервере
USER=''; # пользователь базы данных

XMLFILE_PATH=/tmp/data.xml
wget "http://overpass-api.de/api/interpreter?data=(node(57.90, 55.30,57.96, 55.37);<;);out;" -O $XMLFILE_PATH;

osm2pgsql --create --database $DB -H $HOST -P $PORT -U $USER -W -S $STYLE_FILE /tmp/data.xml
rm $XMLFILE_PATH;
```

Настройки импорта (какие теги импортировать, к каким типам геометрий привязывать) хранятся в файле стилей (задаётся *опцией -S* команды *osm2pgsql*).

Содержимое файла gis.style

```
# OsmType  Tag          DataType     Flags
node,way   access       text         linear
node,way   addr:housename      text  linear
node,way   addr:housenumber    text  linear
node,way   addr:street    text       linear
node       addr:door     text        linear
node,way   amenity      text         polygon
node,way   area         text         polygon # hard coded support for area=1/yes => polygon is in osm2pgsql
node,way   building     text         polygon
node,way   construction text         linear
node,way   covered      text         linear
node,way   culvert      text         linear
node,way   cutting      text         linear
node,way   denomination text         linear
node,way   disused      text         linear
node       ele          text         linear
node,way   embankment   text         linear
node,way   foot         text         linear
node,way   generator:source    text  linear
node,way   harbour      text         polygon
node,way   highway      text         linear
node,way   historic     text         polygon
node,way   horse        text         linear
node,way   intermittent text         linear
node,way   junction     text         linear
node,way   landuse      text         polygon
node,way   layer        text         linear
node,way   leisure      text         polygon
node,way   lock         text         linear
node,way   man_made     text         polygon
node,way   military     text         polygon
node,way   motorcar     text         linear
node,way   name         text         linear
node,way   natural      text         polygon  # natural=coastline tags are discarded by a hard coded rule in osm2pgsql
node,way   office       text         polygon
node,way   oneway       text         linear
node,way   operator     text         linear
node,way   place        text         polygon
node       poi          text         linear
node,way   population   text         linear
node,way   power        text         polygon
node,way   power_source text         linear
node,way   public_transport text     polygon
node,way   railway      text         linear
node,way   ref          text         linear
node,way   religion     text         linear
node,way   route        text         linear
node,way   service      text         linear
node,way   shop         text         polygon
node,way   sport        text         polygon
node,way   surface      text         linear
node,way   toll         text         linear
node,way   tourism      text         polygon
node,way   tower:type   text         linear
way        tracktype    text         linear
node,way   tunnel       text         linear
node,way   water        text         polygon
node,way   waterway     text         polygon
node,way   wetland      text         polygon
node,way   width        text         linear
node,way   wood         text         linear
node,way   z_order      int4         linear # This is calculated during import
way        way_area     real         linear # This is calculated during import
node       opening_hours text        linear
node       phone        text         linear
node       craft        text         linear
node       description        text         linear
way        building:levels int4      polygon
node       level        text         linear
node       email        text         linear
node       website      text         linear
node       seasonal     text         linear
node,way   internet_access     text         linear
node,way   osm_timestamp timestamptz(0) linear
```


[Оригинальный файл стилей](https://github.com/openstreetmap/osm2pgsql/blob/master/default.style)

## Результат
После выполнения скрипта в базе данных появляются 4 таблицы:

* planet_osm_line
* planet_osm_point
* planet_osm_polygon
* planet_osm_roads

По ним [можно выполнять различные запросы над геоданными](/geo/postgis-examples)

Более подробно про [опции использования osm2pgsql на странице репозитория](https://github.com/openstreetmap/osm2pgsql)