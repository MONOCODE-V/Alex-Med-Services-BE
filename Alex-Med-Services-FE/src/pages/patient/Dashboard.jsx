import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import { FaCalendar, FaUserMd, FaBell } from 'react-icons/fa';

export default function PatientDashboard() {
  const [stats, setStats] = useState({ upcomingAppointments: 0, totalAppointments: 0, unreadNotifications: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appts, notifs] = await Promise.all([
        api.get('/appointments/my-appointments?limit=5'),
        api.get('/notifications/unread-count')
      ]);
      setStats({
        upcomingAppointments: appts.data.data.appointments.filter(a => ['PENDING','CONFIRMED'].includes(a.status)).length,
        totalAppointments: appts.data.data.totalAppointments,
        unreadNotifications: notifs.data.data.unreadCount
      });
    } catch (e) {} finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container px-6 py-8 mx-auto">
        <h1 className="text-3xl font-semibold text-gray-800 mb-8">Patient Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full"><FaCalendar className="w-6 h-6 text-blue-600" /></div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-2xl font-semibold">{stats.upcomingAppointments}</p>
              </div>
            </div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full"><FaUserMd className="w-6 h-6 text-green-600" /></div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Appointments</p>
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link to="/patient/doctors" className="p-4 bg-white rounded-lg shadow hover:shadow-lg text-center">
            <FaUserMd className="w-8 h-8 mx-auto text-blue-500 mb-2" />
            <p className="font-medium">Find Doctors</p>
          </Link>
          <Link to="/patient/appointments" className="p-4 bg-white rounded-lg shadow hover:shadow-lg text-center">
            <FaCalendar className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <p className="font-medium">My Appointments</p>
          </Link>
          <Link to="/notifications" className="p-4 bg-white rounded-lg shadow hover:shadow-lg text-center">
            <FaBell className="w-8 h-8 mx-auto text-purple-500 mb-2" />
            <p className="font-medium">Notifications</p>
          </Link>
          <Link to="/profile" className="p-4 bg-white rounded-lg shadow hover:shadow-lg text-center">
            <FaUserMd className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
            <p className="font-medium">Profile</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
