import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Pessoas from "./pages/Pessoas/Pessoas";
import Agentes from "./pages/Agentes/Agentes";
import Reconhecimento from "./pages/Reconhecimento/Reconhecimento";

import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import ProtectedAgentEditRoute from "./components/ProtectedAgentEditRoute";

import DashboardLayout from "./components/Layout/DashboardLayout";

import CadastroPessoa from "./pages/Pessoas/Cadastro/CadastroPessoa";
import DetalhesPessoa from "./pages/Pessoas/Detalhes/DetalhesPessoa";
import EditarPessoa from "./pages/Pessoas/Editar/EditarPessoa";

import CadastroAgente from "./pages/Agentes/Cadastro/CadastroAgente";
import DetalhesAgente from "./pages/Agentes/Detalhes/DetalhesAgente";
import EditarAgente from "./pages/Agentes/Editar/EditarAgente";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN */}
        <Route path="/login" element={<Login />} />

        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ROTA INICIAL */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* PESSOAS */}
        <Route
          path="/pessoas"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Pessoas />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pessoas/nova"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CadastroPessoa />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pessoas/:id"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DetalhesPessoa />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pessoas/:id/editar"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <EditarPessoa />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* AGENTES */}
        <Route
          path="/agentes"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Agentes />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        {/* CADASTRAR AGENTE - SOMENTE ADMIN */}
        <Route
          path="/agentes/novo"
          element={
            <ProtectedRoute>
              <ProtectedAdminRoute>
                <DashboardLayout>
                  <CadastroAgente />
                </DashboardLayout>
              </ProtectedAdminRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/agentes/:id"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DetalhesAgente />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        {/* EDITAR AGENTE - ADMIN -> qualquer agente / AGENTE -> somente ele mesmo */}
        <Route
          path="/agentes/:id/editar"
          element={
            <ProtectedRoute>
              <ProtectedAgentEditRoute>
                <DashboardLayout>
                  <EditarAgente />
                </DashboardLayout>
              </ProtectedAgentEditRoute>
            </ProtectedRoute>
          }
        />

        {/* RECONHECIMENTO */}
        <Route
          path="/reconhecimento"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Reconhecimento />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;