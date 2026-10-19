
import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Corrige os ícones padrão do Leaflet no React.
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

export default function MapaLocalizacoes({
  marcadores = [],
  pontoSelecionado = null,
  aoSelecionarPonto,
}) {
  const centro = pontoSelecionado || BRASILIA;

  return (
    <div className="mapa-localizacoes">
      <MapContainer
        center={centro}
        zoom={12}
        scrollWheelZoom
        className="mapa-localizacoes-container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {aoSelecionarPonto && (
          <CliqueNoMapa aoSelecionar={aoSelecionarPonto} />
        )}

        {marcadores.map((item) => (
          <Marker
            key={item.id}
            position={[item.latitude, item.longitude]}
          >
            <Popup>
              <strong>{item.pessoa || "Pessoa desaparecida"}</strong>
              <br />
              {item.local}
              <br />
              {item.data || ""}
            </Popup>
          </Marker>
        ))}

        {pontoSelecionado && (
          <Marker position={pontoSelecionado}>
            <Popup>Local selecionado para o avistamento</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
