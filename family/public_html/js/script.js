var map, popup;

$(document).ready(function () {
    map = L.map('map', {
        center: [61.06, 56.03],
        zoom: 4
    });

    L.tileLayer('//a.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    setTimeout(Kambarka, 5000);
    setTimeout(Usolie, 15000);
    setTimeout(Chusovskoy, 25000);
    setTimeout(Sherya, 35000);
});


function Kambarka() {

    map.flyTo([56.2521, 54.2254], 8, {
        duration: 5
    });

    popup = L.popup()
            .setLatLng([56.2521, 54.2254])
            .setContent('<p>Родилась д Котово Сарапульский район, <br/> тогда была Камбарка</p>')
            .openOn(map);
}

function Usolie() {

    map.flyTo([59.4250, 56.8179], 11, {
        duration: 5
    });

    popup
            .setLatLng([59.4250, 56.8179])
            .setContent('<p>Раскулачили и угнали в Свердловскую область, <br/> Калий Горка</p>')
            .openOn(map);
}

function Chusovskoy() {

    map.flyTo([61.0895, 57.3267], 9, {
        duration: 5
    });

    popup
            .setLatLng([61.0895, 57.3267])
            .setContent('<p>потом угнали севернее в Ныробский район п. Чусовской. Семисосны. Богатырёво (место захоронения мужа). Нашего деда.</p>')
            .openOn(map);
}

function Sherya() {

    map.flyTo([58.0180, 55.1958], 12, {
        duration: 5
    });

    popup
            .setLatLng([58.0180, 55.1958])
            .setContent('<p>Из Ныробского района отправили в Нытвенский район на плотах до Табор, расселили по разным деревням.Рыбхоз"Шерья" с 1945 г до 1992 года. Два последних года жила у сына в Шерье.</p>')
            .openOn(map);
}