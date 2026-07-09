import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import PatientList from './pages/patients/PatientList'
import PatientForm from './pages/patients/PatientForm'
import PatientDetail from './pages/patients/PatientDetail'
import AppointmentList from './pages/appointments/AppointmentList'
import AppointmentForm from './pages/appointments/AppointmentForm'
import InvoiceList from './pages/billing/InvoiceList'
import InvoiceForm from './pages/billing/InvoiceForm'
import DoctorList from './pages/doctors/DoctorList'
import DoctorForm from './pages/doctors/DoctorForm'
import Reports from './pages/Reports'
import UserList from './pages/users/UserList'
import UserForm from './pages/users/UserForm'
import NumberSequenceList from './pages/settings/NumberSequenceList'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />

            <Route path="patients">
              <Route index element={<PatientList />} />
              <Route path="new" element={<PatientForm />} />
              <Route path=":id" element={<PatientDetail />} />
              <Route path=":id/edit" element={<PatientForm />} />
            </Route>

            <Route path="appointments">
              <Route index element={<AppointmentList />} />
              <Route path="new" element={<AppointmentForm />} />
              <Route path=":id/edit" element={<AppointmentForm />} />
            </Route>

            <Route path="billing">
              <Route index element={<InvoiceList />} />
              <Route path="new" element={<InvoiceForm />} />
            </Route>

            <Route path="doctors">
              <Route index element={<DoctorList />} />
              <Route path="new" element={<DoctorForm />} />
              <Route path=":id/edit" element={<DoctorForm />} />
            </Route>

            <Route element={<RequireAuth roles={['Admin']} />}>
              <Route path="reports" element={<Reports />} />
              <Route path="users">
                <Route index element={<UserList />} />
                <Route path="new" element={<UserForm />} />
                <Route path=":id/edit" element={<UserForm />} />
              </Route>
              <Route path="settings/numbering" element={<NumberSequenceList />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
