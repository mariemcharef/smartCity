
const API_URL = 'http://localhost:8080/api';
const graphql_url = 'http://localhost:8080/graphql';

document.addEventListener('DOMContentLoaded', () => {
    loadLines();
});

function showTab(tabName, event) {
    document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');

    if (tabName === 'lines') loadLines();
    if (tabName === 'traffic') loadTraffic();
    if (tabName === 'connections') loadConnections();
    if (tabName === 'report') loadLinesForReport();
}

async function loadLines() {
    const container = document.getElementById('linesContainer');
    container.innerHTML = '<div class="loading">⏳ Chargement...</div>';
    try {
        const type = document.getElementById('typeFilter').value;
        const status = document.getElementById('statusFilter').value;
        const params = new URLSearchParams();
        if (type) params.append('type', type);
        if (status) params.append('status', status);
        const response = await fetch(`${API_URL}/lines?${params}`);
        const data = await response.json();
        if (data.lines.length === 0) {
            container.innerHTML = '<div class="card"><p>Aucune ligne trouvée</p></div>';
            return;
        }
        container.innerHTML = data.lines.map(line => `
            <div class="card">
                <h3><span class="icon">${getTransportIcon(line.type)}</span>${line.name}</h3>
                <div style="margin-bottom: 15px;">
                    <span class="badge ${line.type}">${line.type.toUpperCase()}</span>
                    <span class="badge ${line.status}">${getStatusText(line.status)}</span>
                </div>
                <p><strong>Fréquence:</strong> Toutes les ${line.frequency} minutes</p>
                <p style="margin-top: 10px;"><strong>Horaires:</strong></p>
                <div class="time-list">${line.timetable.map(t => `<span class="time-badge">${t}</span>`).join('')}</div>
                <button onclick="viewLineDetails('${line.id}')" style="margin-top:15px;width:100%;">📊 Voir détails</button>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = `<div class="card"><p class="error">❌ Erreur: ${error.message}</p></div>`;
    }
}

async function viewLineDetails(lineId) {
    try {
        const response = await fetch(`${API_URL}/lines/${lineId}/next-departure`);
        const data = await response.json();
        alert(`🚌 ${data.line_name}\n\n⏰ Heure actuelle: ${data.current_time}\n🚀 Prochain départ: ${data.next_departure}\n📊 Statut: ${getStatusText(data.status)}\n⏱️ Retard estimé: ${data.estimated_delay} min`);
    } catch {
        alert('Erreur lors du chargement des détails');
    }
}

async function loadTraffic() {
    const container = document.getElementById('trafficContainer');
    container.innerHTML = '<div class="loading">⏳ Chargement...</div>';
    try {
        const response = await fetch(`${API_URL}/traffic/status`);
        const data = await response.json();
        let html = `<div class="card"><h3>📊 État général du trafic</h3>
            <p><strong>Statut:</strong> <span class="badge ${data.status === 'normal' ? 'on_time':'delayed'}">${data.status === 'normal' ? '✅ Normal':'⚠️ Perturbé'}</span></p>
            <p><strong>Incidents actifs:</strong> ${data.incidents_count}</p>
            <p><strong>Dernière mise à jour:</strong> ${new Date(data.timestamp).toLocaleString('fr-FR')}</p>
        </div>`;
        if (data.incidents.length > 0) {
            html += '<div class="card"><h3>⚠️ Incidents en cours</h3>';
            data.incidents.forEach(inc => {
                html += `<div class="incident ${inc.severity}">
                    <strong>Ligne ${inc.line}</strong> - ${inc.type.toUpperCase()}<br>
                    ${inc.reason}<br>
                    <small>Retard: ${inc.delay_mins} min | Résolution estimée: ${inc.estimated_resolution}</small>
                </div>`;
            });
            html += '</div>';
        }
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = `<div class="card"><p class="error">❌ Erreur: ${error.message}</p></div>`;
    }
}

async function loadConnections() {
    const container = document.getElementById('connectionsContainer');
    container.innerHTML = '<div class="loading">⏳ Chargement...</div>';
    try {
        const response = await fetch(`${API_URL}/connections`);
        const data = await response.json();
        container.innerHTML = data.connections.map(conn => `
            <div class="card">
                <h3>🚏 ${conn.stop_name}</h3>
                <p><strong>Lignes disponibles:</strong></p>
                <div style="margin: 10px 0;">${conn.lines_available.map(line => `<span class="badge">${line}</span>`).join(' ')}</div>
                <div class="connection-list"><strong>Correspondances:</strong>
                    ${conn.connections.map(c => `<div class="connection-item"><span>Ligne ${c.from} → Ligne ${c.to}</span><span class="badge">🚶 ${c.walking_time} min</span></div>`).join('')}
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = `<div class="card"><p class="error">❌ Erreur: ${error.message}</p></div>`;
    }
}

async function loadLinesForReport() {
    try {
        const response = await fetch(`${API_URL}/lines`);
        const data = await response.json();
        const select = document.getElementById('reportLine');
        select.innerHTML = '<option value="">Sélectionnez une ligne</option>' +
            data.lines.map(line => `<option value="${line.id}">${line.name}</option>`).join('');
    } catch (error) {
        console.error('Erreur chargement lignes:', error);
    }
}

async function submitReport() {
    const lineId = document.getElementById('reportLine').value;
    const issueType = document.getElementById('reportType').value;
    const description = document.getElementById('reportDescription').value;
    const reporter = document.getElementById('reportUser').value;
    const resultDiv = document.getElementById('reportResult');

    if (!lineId || !description) {
        resultDiv.innerHTML = '<p class="error">⚠️ Veuillez remplir tous les champs obligatoires</p>';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/lines/${lineId}/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ issue_type: issueType, description, reporter: reporter || 'anonymous' })
        });
        const data = await response.json();
        resultDiv.innerHTML = `<p class="success">✅ ${data.message}<br>ID: ${data.report.report_id}</p>`;
        document.getElementById('reportDescription').value = '';
        document.getElementById('reportUser').value = '';
    } catch (error) {
        resultDiv.innerHTML = `<p class="error">❌ Erreur: ${error.message}</p>`;
    }
}

function getTransportIcon(type) {
    const icons = { bus: '🚌', metro: '🚇', train: '🚆' };
    return icons[type] || '';
}

function getStatusText(status) {
    const texts = { on_time: 'À l\'heure', delayed: 'Retardé', cancelled: 'Annulé' };
    return texts[status] || status;
}

async function loadPlaces() {
    const container = document.getElementById('placesContainer');
    container.innerHTML = '<div class="loading">⏳ Chargement...</div>';

    try {
        const zone = document.getElementById('placeZone').value;
        const type = document.getElementById('placeType').value;

        const variables = {};
        if (zone && zone !== '') variables.zone = zone;
        if (type && type !== '') variables.type = type;

        const query = `
            query GetPlaces($zone: ZoneType, $type: PlaceType) {
                places(zone: $zone, type: $type) {
                    id
                    name
                    type
                    zone
                }
            }
        `;

        const response = await fetch(graphql_url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, variables })
        });

        const result = await response.json();

        if (!result.data || !result.data.places || result.data.places.length === 0) {
            container.innerHTML = '<div class="card"><p>Aucun lieu trouvé</p></div>';
            return;
        }

        container.innerHTML = result.data.places
            .map(p => `
                <div class="card">
                    <h3>📍 ${p.name}</h3>
                    <p><strong>Type:</strong> ${p.type}</p>
                    <p><strong>Zone:</strong> ${p.zone}</p>
                </div>
            `)
            .join('');

    } catch (err) {
        container.innerHTML = `<div class="card"><p class="error">❌ Erreur: ${err.message}</p></div>`;
    }
}

async function loadAirQuality() {
    const container = document.getElementById('airContainer');
    container.innerHTML = '<div class="loading">⏳ Chargement...</div>';

    try {
        const zone = document.getElementById('airZone').value || 'Centre';
        const response = await fetch(`${API_URL}/aqi?zone=${zone}`);
        const data = await response.json();

        if (!data || !data.aqi) {
            container.innerHTML = '<div class="card"><p>Aucune donnée disponible</p></div>';
            return;
        }

        container.innerHTML = `
            <div class="card">
                <h3>🌫️ Qualité de l'air - Zone: ${zone}</h3>
                <p><strong>AQI:</strong> ${data.aqi}</p>
                ${data.pollutants ? `
                    <p><strong>Polluants:</strong></p>
                    <ul>
                        <li>NO2: ${data.pollutants.NO2}</li>
                        <li>CO2: ${data.pollutants.CO2}</li>
                        <li>O3: ${data.pollutants.O3}</li>
                    </ul>
                ` : ''}
            </div>
        `;
    } catch (error) {
        container.innerHTML = `<div class="card"><p class="error">❌ Erreur: ${error.message}</p></div>`;
    }
}


function showTab(tabName, event) {
    document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');

    if (tabName === 'lines') loadLines();
    if (tabName === 'traffic') loadTraffic();
    if (tabName === 'connections') loadConnections();
    if (tabName === 'report') loadLinesForReport();
}


async function sendAlert() {
    const zone = document.getElementById('alertZone').value;
    const message = document.getElementById('alertMessage').value;
    const priority = parseInt(document.getElementById('alertPriority').value, 10);
    const resultDiv = document.getElementById('alertResult');

    if (!zone || !message) {
        resultDiv.innerHTML = '<p class="error">⚠️ Veuillez remplir tous les champs obligatoires</p>';
        return;
    }

    try {
        const response = await fetch('http://localhost:8080/sendAlert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ zone, message, priority })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);

        resultDiv.innerHTML = `<p class="success">✅ Alerte envoyée avec succès! Status: ${data.status}</p>`;
        document.getElementById('alertMessage').value = '';
    } catch (err) {
        resultDiv.innerHTML = `<p class="error">❌ Erreur: ${err.message}</p>`;
    }
}