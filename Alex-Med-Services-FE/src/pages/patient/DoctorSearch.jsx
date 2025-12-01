import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import api from '../../api/axios';
import { FaSearch, FaStar, FaUserMd } from 'react-icons/fa';

export default function DoctorSearch() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchDoctors(); }, []);

  const fetchDoctors = async () => {
    try {
      const params = search ? { search } : {};
      const res = await api.get('/doctors', { params });
      setDoctors(res.data.data.doctors);
    } catch (e) {} finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container px-6 py-8 mx-auto">
        <h1 className="text-3xl font-semibold text-gray-800 mb-8">Find Doctors</h1>
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex gap-4">
            <input type="text" placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
            <button onClick={fetchDoctors} className="px-6 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 flex items-center gap-2">
              <FaSearch /> Search
            </button>
          </div>
        </div>
        {loading ? <div className="flex justify-center py-12"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div> :
        doctors.length === 0 ? <div className="bg-white rounded-lg shadow p-12 text-center"><FaUserMd className="w-16 h-16 mx-auto text-gray-300 mb-4" /><p className="text-gray-500">No doctors found</p></div> :
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map(d => (
            <div key={d.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaUserMd className="w-8 h-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-800">{d.name}</h3>
                  <div className="flex items-center mt-1">
                    <FaStar className="w-4 h-4 text-yellow-400" />
                    <span className="ml-1 text-sm text-gray-600">{d.rating?.average?.toFixed(1) || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Experience: {d.yearsOfExperience || 0} years</p>
              <Link to={`/patient/book/${d.id}`} className="block w-full py-2 text-center text-white bg-blue-500 rounded-lg hover:bg-blue-600">
                Book Appointment
              </Link>
            </div>
          ))}
        </div>}
      </div>
    </div>
  );
}
