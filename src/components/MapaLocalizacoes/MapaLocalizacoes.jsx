
import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import "./MapaLocalizacoes.css";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const BRASILIA = [-15.7939, -47.8828];

function CliqueNoMapa({ aoSelecionar }) {
  useMapEvents({
    click(event) {
      aoSelecionar([
        event.latlng.lat,
        event.latlng.lng,
      ]);
    },
  });

  return null;
}

// Ajusta o enquadramento para mostrar os marcadores históricos.
function AjustarEnquadramento({
  marcadores,
  pontoSelecionado,
}) {
  const map = useMap();

  const pontos = useMemo(() => {
    const validos = marcadores
      .filter(
        (item) =>
          Number.isFinite(Number(item.latitude)) &&
          Number.isFinite(Number(item.longitude)) &&
          item.latitude !== null &&
          item.longitude !== null
      )
      .map((item) => [
        Number(item.latitude),
        Number(item.longitude),
      ]);

    if (pontoSelecionado) {
      validos.push(pontoSelecionado);
    }

    return validos;
  }, [marcadores, pontoSelecionado]);

  useEffect(() => {
    if (pontos.length === 0) {
      map.setView(BRASILIA, 12);
      return;
    }

    if (pontos.length === 1) {
      map.setView(pontos[0], 14);
      return;
    }

    const limites = L.latLngBounds(pontos);

    map.fitBounds(limites, {
      padding: [35, 35],
      maxZoom: 14,
    });
  }, [map, pontos]);

  return null;
}

export default function MapaLocalizacoes({
  marcadores = [],
  pontoSelecionado = null,
  aoSelecionarPonto,
}) {
  return (
    <div className="mapa-localizacoes">
      <MapContainer
        center={BRASILIA}
        zoom={12}
        scrollWheelZoom
        className="mapa-localizacoes-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <AjustarEnquadramento
          marcadores={marcadores}
          pontoSelecionado={pontoSelecionado}
        />

        {aoSelecionarPonto && (
          <CliqueNoMapa aoSelecionar={aoSelecionarPonto} />
        )}

        {marcadores
          .filter(
            (item) =>
              Number.isFinite(Number(item.latitude)) &&
              Number.isFinite(Number(item.longitude)) &&
              item.latitude !== null &&
              item.longitude !== null
          )
          .map((item) => (
            <Marker
              key={item.id}
              position={[
                Number(item.latitude),
                Number(item.longitude),
              ]}
            >
              <Popup>
                <strong>
                  {item.pessoa || "Pessoa desaparecida"}
                </strong>
                <br />
                {item.local}
                <br />
                {item.data || ""}
              </Popup>
            </Marker>
          ))}

        {pontoSelecionado && (
          <Marker position={pontoSelecionado}>
            <Popup>
              Local selecionado para o avistamento
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
