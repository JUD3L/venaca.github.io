let PLACE_SELECTOR  = "store"; // Variable global para el tipo de lugar
let GLOBAL_LOCATION;
 
function initMap() {
    // Obtener la ubicación del usuario
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            GLOBAL_LOCATION = userLocation;

            // Crear el mapa con la ubicación del usuario
            const map = new google.maps.Map(document.getElementById('map'), {
                center: userLocation,
                zoom: 15
            });

            // Iniciar el servicio de lugares
            initPlacesService(map);
        },
        (error) => {
            console.error('Error al obtener la ubicación:', error);
        }
    );
}

function initPlacesService(map) {
    // Resto de tu código...
    const service = new google.maps.places.PlacesService(map);
    let getNextPage;
    const moreButton = document.getElementById("more");

    moreButton.onclick = function () {
        moreButton.disabled = true;
        if (getNextPage) {
            getNextPage();
        }
    };

    // Limpiar la lista antes de realizar una nueva búsqueda
    clearResults();

    // Perform a nearby search.
    service.nearbySearch(
        { location: map.getCenter(), radius: 500, type: PLACE_SELECTOR },
        (results, status, pagination) => {
            if (status !== "OK" || !results) return;

            addPlaces(results, map);
            moreButton.disabled = !pagination || !pagination.hasNextPage;
            if (pagination && pagination.hasNextPage) {
                getNextPage = () => {
                    pagination.nextPage();
                };
            }
            // Obtener los lugares más cercanos
            const closestPlaces = getClosestPlaces(results);

            // Mostrar los lugares más cercanos
            showClosestPlaces(closestPlaces);
        }
    );
}

function getClosestPlaces(results) {
    let closestPlaces = [];
    let closestPlacesDistances = [];

    for (const result of results) {
        console.log(result);
        const placeDistance = haversine_distance(GLOBAL_LOCATION, result.geometry.location);
        closestPlacesDistances.push(placeDistance);
        closestPlaces.push(result);
    }

    // Ordenar los lugares según las distancias
    closestPlaces = closestPlaces.sort((a, b) => {
        const indexA = closestPlaces.indexOf(a);
        const indexB = closestPlaces.indexOf(b);
        return closestPlacesDistances[indexA] - closestPlacesDistances[indexB];
    });

    return closestPlaces.slice(0, 3); // Devolver los 3 lugares más cercanos
}

function haversine_distance(mk1, mk2) {
    var R = 3958.8; // Radius of the Earth in miles

    var rlat1 = mk1.lat * (Math.PI/180); // Convert degrees to radians
    var rlat2 = mk2.lat() * (Math.PI/180); // Convert degrees to radians
    var difflat = rlat2-rlat1; // Radian difference (latitudes)
    var difflon = (mk2.lng()-mk1.lng) * (Math.PI/180); // Radian difference (longitudes)

    var d = 2 * R * Math.asin(Math.sqrt(Math.sin(difflat/2)*Math.sin(difflat/2)+Math.cos(rlat1)*Math.cos(rlat2)*Math.sin(difflon/2)*Math.sin(difflon/2)));
    return d;
}

function showClosestPlaces(closestPlaces) {
    const details = document.getElementById("details");

    // Borrar el contenido existente en el contenedor
    details.innerHTML = '';

    for (const place of closestPlaces) {
        const containerDiv = document.createElement("div");

        // Crear un span para el nombre
        const nameSpan = document.createElement("span");
        nameSpan.textContent = `Nombre: ${place.name}`;
                
        // Crear un span para la distancia
        const distanceSpan = document.createElement("span");
        distanceSpan.textContent = `Distancia: ${haversine_distance(GLOBAL_LOCATION, place.geometry.location)}`;

        // Crear un span para la dirección
        const vicinitySpan = document.createElement("span");
        vicinitySpan.textContent = `Dirección: ${place.vicinity}`;

        // Agregar los spans al contenedor
        containerDiv.appendChild(nameSpan);
        containerDiv.appendChild(distanceSpan);
        containerDiv.appendChild(vicinitySpan);

        // Agregar el contenedor al contenedor 'details'
        details.appendChild(containerDiv);
    }
}

const filterButton = document.getElementById("filterButton");
const placeSelector = document.getElementById("placeSelector");

filterButton.addEventListener("click", () => {
    // Cambiar el valor de PLACE_SELECTOR según la opción seleccionada en el filtro
    PLACE_SELECTOR = placeSelector.value;
    // Limpiar la lista antes de realizar una nueva búsqueda
    clearResults();
    // Volver a realizar la búsqueda al cambiar el filtro
    initMap();
});

function clearResults() {
    const placesList = document.getElementById("places");
    // Limpiar la lista
    placesList.innerHTML = "";
}

function addPlaces(places, map) {
    const placesList = document.getElementById("places");

    for (const place of places) {
        if (place.geometry && place.geometry.location && place.types.includes(PLACE_SELECTOR)) {
            const image = {
                url: place.icon,
                size: new google.maps.Size(71, 71),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(17, 34),
                scaledSize: new google.maps.Size(25, 25),
            };

            new google.maps.Marker({
                map,
                icon: image,
                title: place.name,
                position: place.geometry.location,
            });

            const li = document.createElement("li");

            li.textContent = place.name;
            placesList.appendChild(li);
            li.addEventListener("click", () => {
                map.setCenter(place.geometry.location);
            });
        }
    }
}

// Llamada a initMap al cargar la página
window.initMap = initMap;
