import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import { FaCalendar, FaClock, FaBell, FaUsers } from 'react-icons/fa';

export default function DoctorDashboard() {
  const [stats, setStats] = useState({ todayAppointments: 0, totalAppointments: 0, unreadNotifications: 0 });
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [appts, notifs] = await Promise.all([
        api.get('/doctor/appointments?limit=5'),
        api.get('/notifications/unread-count')
      ]);
      const today = new Date().toDateString();
      setAppointments(appts.data.data.appointments);
      setStats({
        todayAppointments: appts.data.data.appointments.filter(a => new Date(a.dateTime).toDateString() === today).length,
        totalAppointments: appts.data.data.totalAppointments,
        unreadNotifications: notifs.data.data.unreadCount
      });
    } catch (e) {} finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container px-6 py-8 mx-auto">
        <h1 className="text-3xl font-semibold text-gray-800 mb-8">Doctor Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full"><FaCalendar className="w-6 h-6 text-blue-600" /></div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-semibold">{stats.todayAppointments}</p>
              </div>
            </div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full"><FaUsers className="w-6 h-6 text-green-600" /></div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Patients</p>
                <p className="text-2xl font-semibold">{stats.totalAppointments}</p>
              </div>
            </div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full"><FaBell className="w-6 h-6 text-purple-600" /></div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Notifications</p>
                <p className="text-2xl font-semibold">{stats.unreadNotifications}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Link to="/doctor/clinics" className="p-4 bg-white rounded-lg shadow hover:shadow-lg text-center">
            <FaUsers className="w-8 h-8 mx-auto text-teal-500 mb-2" />
            <p className="font-medium">My Clinics</p>
          </Link>
          <Link to="/doctor/schedules" className="p-4 bg-white rounded-lg shadow hover:shadow-lg text-center">
            <FaClock className="w-8 h-8 mx-auto text-blue-500 mb-2" />
            <p className="font-medium">Manage Schedules</p>
          </Link>
          <Link to="/doctor/appointments" className="p-4 bg-white rounded-lg shadow hover:shadow-lg text-center">
            <FaCalendar className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <p className="font-medium">Appointments</p>
          </Link>
          <Link to="/notifications" className="p-4 bg-white rounded-lg shadow hover:shadow-lg text-center">
            <FaBell className="w-8 h-8 mx-auto text-purple-500 mb-2" />
            <p className="font-medium">Notifications</p>
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Appointments</h2>
          {appointments.length === 0 ? <p className="text-gray-500 text-center py-8">No appointments yet</p> :
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Patient</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date & Time</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              </tr></thead>
              <tbody>
                {appointments.map(apt => (
                  <tr key={apt.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{apt.patient.firstName} {apt.patient.lastName}</td>
                    <td className="px-4 py-3">{new Date(apt.dateTime).toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={`px-3 py-1 text-xs font-semibold rounded-full ${apt.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : apt.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{apt.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
        </div>
      </div>
    </div>
  );
}
