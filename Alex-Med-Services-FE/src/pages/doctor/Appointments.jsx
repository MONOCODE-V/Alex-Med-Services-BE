import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import { FaCalendar, FaCheck, FaTimes, FaCheckCircle } from 'react-icons/fa';

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchAppointments(); }, [filter]);

  const fetchAppointments = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const res = await api.get('/doctor/appointments', { params });
      setAppointments(res.data.data.appointments);
    } catch (e) {} finally { setLoading(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/doctor/appointments/${id}/status`, { status });
      fetchAppointments();
    } catch (error) {
      alert(error.response?.data?.error?.message || 'Failed to update status');
    }
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
        </div> :
        <div className="grid gap-6">
          {appointments.map(apt => (
            <div key={apt.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">{apt.patient.firstName} {apt.patient.lastName}</h3>
                  <p className="text-gray-600 mt-1">{new Date(apt.dateTime).toLocaleString()}</p>
                  {apt.notes && <p className="text-gray-500 text-sm mt-2"><span className="font-medium">Reason:</span> {apt.notes}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(apt.status)}`}>{apt.status}</span>
                  {apt.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus(apt.id, 'CONFIRMED')} className="px-3 py-1 text-xs text-white bg-blue-500 rounded hover:bg-blue-600 flex items-center gap-1">
                        <FaCheck /> Confirm
                      </button>
                      <button onClick={() => updateStatus(apt.id, 'CANCELLED')} className="px-3 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600 flex items-center gap-1">
                        <FaTimes /> Cancel
                      </button>
                    </div>
                  )}
                  {apt.status === 'CONFIRMED' && (
                    <button onClick={() => updateStatus(apt.id, 'COMPLETED')} className="px-3 py-1 text-xs text-white bg-green-500 rounded hover:bg-green-600 flex items-center gap-1">
                      <FaCheckCircle /> Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>}
      </div>
    </div>
  );
}
