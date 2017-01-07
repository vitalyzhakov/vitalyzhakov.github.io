# PostGIS - примеры использования

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