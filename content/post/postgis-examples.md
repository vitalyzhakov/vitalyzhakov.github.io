+++
title = "Примеры использования PostGis расширения в PostgreSQL"
summary = "Примеры использования PostGIS"
date = 2016-02-23T00:10:06+05:00
draft = false

# Tags and categories
# For example, use `tags = []` for no tags, or the form `tags = ["A Tag", "Another Tag"]` for one or more tags.
tags = ["pgsql", "openstreetmap"]
categories = []

# Featured image
# Place your image in the `static/img/` folder and reference its filename below, e.g. `image = "example.jpg"`.
[header]
image = ""
caption = ""

+++


## Здание (полигон), которое содержит точку с координатами $lng, $lat

```
<?php
    'SELECT * FROM planet_osm_polygon WHERE ' .
    'ST_contains(
        way,
        ST_Transform(
            ST_SetSRID(
                          ST_Point(' . $lng . ',' . $lat . '), 4326' .
                     '), 900913
                    )
          )' .
    "AND building != ''"
```
     

## Точки (организации) внутри найденного полигона

```php
    'SELECT point.* FROM planet_osm_point point, '  .  
    'planet_osm_polygon polygon '  .
    'WHERE polygon.osm_id = ' . $polygon->osm_id . 
    ' AND ST_Contains (polygon.way, point.way)'
```