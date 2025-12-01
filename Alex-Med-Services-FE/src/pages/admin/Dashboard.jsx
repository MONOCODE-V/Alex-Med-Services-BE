import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import { FaUsers, FaUserMd, FaUserInjured, FaCalendar, FaChartLine, FaBuilding } from 'react-icons/fa';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0, totalDoctors: 0, totalPatients: 0, totalAdmins: 0,
    totalAppointments: 0, pendingAppointments: 0, confirmedAppointments: 0, completedAppointments: 0,
    recentUsers: [], recentAppointments: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data.data);
    } catch (e) {} finally { setLoading(false); }
  };

  const getStatusColor = (status) => {
    const colors = { PENDING: 'bg-yellow-100 text-yellow-800', CONFIRMED: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800', CANCELLED: 'bg-red-100 text-red-800' };
    return colors[status];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container px-6 py-8 mx-auto">
        <h1 className="text-3xl font-semibold text-gray-800 mb-6">Admin Dashboard</h1>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <Link to="/admin/users" className="p-4 bg-white rounded-lg shadow hover:shadow-lg text-center transition-shadow">
            <FaUsers className="w-8 h-8 mx-auto text-blue-500 mb-2" />
            <p className="font-medium">Manage Users</p>
          </Link>
          <Link to="/admin/clinics" className="p-4 bg-white rounded-lg shadow hover:shadow-lg text-center transition-shadow">
            <FaBuilding className="w-8 h-8 mx-auto text-teal-500 mb-2" />
            <p className="font-medium">Manage Clinics</p>
          </Link>
          <Link to="/notifications" className="p-4 bg-white rounded-lg shadow hover:shadow-lg text-center transition-shadow">
            <FaChartLine className="w-8 h-8 mx-auto text-purple-500 mb-2" />
            <p className="font-medium">Notifications</p>
          </Link>
        </div>

        {loading ? <div className="flex justify-center py-12"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div> :
        <>
          <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4"><FaUsers className="w-6 h-6" /></div>
                <div>
                  <p className="text-sm text-gray-500">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-700">{stats.totalUsers}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4"><FaUserMd className="w-6 h-6" /></div>
                <div>
                  <p className="text-sm text-gray-500">Doctors</p>
                  <p className="text-2xl font-semibold text-gray-700">{stats.totalDoctors}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4"><FaUserInjured className="w-6 h-6" /></div>
                <div>
                  <p className="text-sm text-gray-500">Patients</p>
                  <p className="text-2xl font-semibold text-gray-700">{stats.totalPatients}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-500 mr-4"><FaCalendar className="w-6 h-6" /></div>
                <div>
                  <p className="text-sm text-gray-500">Appointments</p>
                  <p className="text-2xl font-semibold text-gray-700">{stats.totalAppointments}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-6 mb-8 md:grid-cols-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaChartLine className="text-blue-500" /> Appointment Statistics
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pending</span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full">{stats.pendingAppointments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Confirmed</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">{stats.confirmedAppointments}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Completed</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">{stats.completedAppointments}</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaUsers className="text-green-500" /> User Distribution
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Doctors</span>
                  <span className="text-lg font-semibold text-gray-700">{stats.totalDoctors}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Patients</span>
                  <span className="text-lg font-semibold text-gray-700">{stats.totalPatients}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Admins</span>
                  <span className="text-lg font-semibold text-gray-700">{stats.totalAdmins}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Recent Users</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stats.recentUsers.map(user => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">{user.firstName} {user.lastName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.role}</td>
                        <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.isActive ? 'Active' : 'Inactive'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Recent Appointments</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stats.recentAppointments.map(apt => (
                      <tr key={apt.id}>
                        <td className="px-6 py-4 text-sm text-gray-900">{apt.patient.firstName} {apt.patient.lastName}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{apt.doctor.firstName} {apt.doctor.lastName}</td>
                        <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(apt.status)}`}>{apt.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>}
      </div>
    </div>
  );
}
