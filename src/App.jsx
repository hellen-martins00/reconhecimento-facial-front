import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Pessoas from "./pages/Pessoas/Pessoas";

import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/Layout/DashboardLayout";
import CadastroPessoa from "./pages/Pessoas/Cadastro/CadastroPessoa";
import DetalhesPessoa from "./pages/Pessoas/Detalhes/DetalhesPessoa";
import EditarPessoa from "./pages/Pessoas/Editar/EditarPessoa";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* LOGIN */}

        <Route
          path="/login"
          element={<Login />}
        />

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

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

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

      </Routes>

    </BrowserRouter>
  );
}

export default App;