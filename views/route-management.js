let map;
let routes = JSON.parse(localStorage.getItem('routes')) || [];
let buses = JSON.parse(localStorage.getItem('buses')) || [];

document.addEventListener('DOMContentLoaded', function () {
    initializeMap();
    renderRoutes();
    renderMap();
    setupEventListeners();
});

function initializeMap() {
    map = L.map('map').setView([16.5062, 80.6480], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

function renderRoutes() {
    const routesList = document.getElementById('routesList');
    routesList.innerHTML = '';

    routes.forEach(route => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="route-checkbox" data-route-id="${route.id}"></td>
            <td>${route.number}</td>
            <td>${route.startPoint}</td>
            <td>${route.endPoint}</td>
            <td>${route.status}</td>
            <td>${route.activeBuses}</td>
            <td>
                <button class="btn btn-sm btn-primary edit-route" data-route-id="${route.id}">Edit</button>
                <button class="btn btn-sm btn-danger delete-route" data-route-id="${route.id}">Delete</button>
            </td>
        `;
        routesList.appendChild(row);
    });

    document.getElementById('selectAllRoutes').addEventListener('change', function () {
        const checkboxes = document.querySelectorAll('.route-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });

    attachActionEventListeners();
}

function renderMap() {
    map.eachLayer(layer => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
            map.removeLayer(layer);
        }
    });

    const bounds = L.latLngBounds();

    routes.forEach(route => {
        const polyline = L.polyline(route.stops || [], { color: getRandomColor() }).addTo(map);
        bounds.extend(polyline.getBounds());
    });

    if (bounds.isValid()) {
        map.fitBounds(bounds);
    }
}

function setupEventListeners() {
    document.getElementById('newRouteBtn').addEventListener('click', () => {
        document.getElementById('routeForm').reset();
        document.getElementById('routeModal').removeAttribute('data-edit-id');
        const modal = new bootstrap.Modal(document.getElementById('routeModal'));
        modal.show();
    });

    document.getElementById('saveRouteBtn').addEventListener('click', () => {
        const routeNumber = document.getElementById('routeNumber').value;
        const startPoint = document.getElementById('startPoint').value;
        const endPoint = document.getElementById('endPoint').value;
        const activeBuses = parseInt(document.getElementById('activeBuses').value, 10);

        if (routeNumber && startPoint && endPoint) {
            const routeId = document.getElementById('routeModal').getAttribute('data-edit-id');

            if (routeId) {
                const route = routes.find(r => r.id === parseInt(routeId));
                route.number = routeNumber;
                route.startPoint = startPoint;
                route.endPoint = endPoint;
                route.activeBuses = activeBuses;
            } else {
                const newRoute = {
                    id: Date.now(),
                    number: routeNumber,
                    startPoint: startPoint,
                    endPoint: endPoint,
                    stops: [],
                    status: 'Active',
                    activeBuses
                };
                routes.push(newRoute);
            }

            localStorage.setItem('routes', JSON.stringify(routes));
            bootstrap.Modal.getInstance(document.getElementById('routeModal')).hide();
            renderRoutes();
            renderMap();
        }
    });

    document.getElementById('editRouteBtn').addEventListener('click', () => {
        const selectedRoutes = getSelectedRoutes();
        if (selectedRoutes.length !== 1) {
            alert('Please select exactly one route to edit.');
            return;
        }

        const route = routes.find(r => r.id === selectedRoutes[0]);
        editRoute(route);
    });

    document.getElementById('deleteRouteBtn').addEventListener('click', () => {
        const selectedRoutes = getSelectedRoutes();
        if (selectedRoutes.length === 0) {
            alert('Please select at least one route to delete.');
            return;
        }

        routes = routes.filter(route => !selectedRoutes.includes(route.id));
        localStorage.setItem('routes', JSON.stringify(routes));
        renderRoutes();
        renderMap();
    });
}

function attachActionEventListeners() {
    document.querySelectorAll('.edit-route').forEach(button => {
        button.addEventListener('click', function () {
            const routeId = parseInt(this.getAttribute('data-route-id'));
            const route = routes.find(r => r.id === routeId);
            editRoute(route);
        });
    });

    document.querySelectorAll('.delete-route').forEach(button => {
        button.addEventListener('click', function () {
            const routeId = parseInt(this.getAttribute('data-route-id'));
            routes = routes.filter(route => route.id !== routeId);
            localStorage.setItem('routes', JSON.stringify(routes));
            renderRoutes();
            renderMap();
        });
    });
}

function editRoute(route) {
    document.getElementById('routeNumber').value = route.number;
    document.getElementById('startPoint').value = route.startPoint;
    document.getElementById('endPoint').value = route.endPoint;
    document.getElementById('activeBuses').value = route.activeBuses;

    const modal = new bootstrap.Modal(document.getElementById('routeModal'));
    document.getElementById('routeModal').setAttribute('data-edit-id', route.id);
    modal.show();
}

function getSelectedRoutes() {
    const checkboxes = document.querySelectorAll('.route-checkbox:checked');
    return Array.from(checkboxes).map(checkbox => parseInt(checkbox.getAttribute('data-route-id'), 10));
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
