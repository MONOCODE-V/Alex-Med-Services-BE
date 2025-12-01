import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import { FaCalendar } from 'react-icons/fa';

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchAppointments(); }, [filter]);

  const fetchAppointments = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const res = await api.get('/appointments/my-appointments', { params });
      setAppointments(res.data.data.appointments);
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-gray-800">My Appointments</h1>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2 border border-gray-200 rounded-lg">
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        {loading ? <div className="flex justify-center py-12"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div> :
        appointments.length === 0 ? <div className="bg-white rounded-lg shadow p-12 text-center">
          <FaCalendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No appointments found</p>
          <Link to="/patient/doctors" className="mt-4 inline-block px-6 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600">Book an Appointment</Link>
        </div> :
        <div className="grid gap-6">
          {appointments.map(apt => (
            <div key={apt.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">Dr. {apt.doctor.firstName} {apt.doctor.lastName}</h3>
                  <p className="text-gray-600 mt-1">{new Date(apt.dateTime).toLocaleString()}</p>
                  {apt.notes && <p className="text-gray-500 text-sm mt-2">{apt.notes}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(apt.status)}`}>{apt.status}</span>
                  {apt.status === 'COMPLETED' && <Link to={`/patient/review/${apt.id}`} className="text-sm text-blue-600 hover:text-blue-800">Write Review</Link>}
                </div>
              </div>
            </div>
          ))}
        </div>}
      </div>
    </div>
  );
}
