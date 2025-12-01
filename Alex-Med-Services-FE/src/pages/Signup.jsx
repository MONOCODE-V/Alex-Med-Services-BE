import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaHospital, FaUser, FaUserMd, FaUserShield } from 'react-icons/fa';

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'PATIENT',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: 'MALE',
    // Doctor specific
    yearsOfExperience: '',
    licenseNumber: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const dataToSend = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
      };

      if (formData.role === 'DOCTOR') {
        dataToSend.yearsOfExperience = parseInt(formData.yearsOfExperience);
        dataToSend.licenseNumber = formData.licenseNumber;
      }

      await signup(dataToSend);
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container px-6 mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <FaHospital className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Join Alex Medical Services
          </h1>
          <p className="text-gray-600">Create your account and get started with quality healthcare</p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Role Selection */}
          <div className="mb-8">
            <label className="block mb-4 text-lg font-semibold text-gray-700 text-center">Choose Your Role</label>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'PATIENT' })}
                className={`group flex flex-col items-center p-8 border-2 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${
                  formData.role === 'PATIENT'
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
                  formData.role === 'PATIENT' ? 'bg-blue-500' : 'bg-gray-100 group-hover:bg-blue-100'
                }`}>
                  <FaUser className={`w-7 h-7 ${formData.role === 'PATIENT' ? 'text-white' : 'text-blue-500'}`} />
                </div>
                <span className="text-xl font-bold text-gray-800 mb-2">Patient</span>
                <span className="text-sm text-gray-600 text-center">Book appointments and manage your health</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'DOCTOR' })}
                className={`group flex flex-col items-center p-8 border-2 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${
                  formData.role === 'DOCTOR'
                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-green-300'
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
                  formData.role === 'DOCTOR' ? 'bg-green-500' : 'bg-gray-100 group-hover:bg-green-100'
                }`}>
                  <FaUserMd className={`w-7 h-7 ${formData.role === 'DOCTOR' ? 'text-white' : 'text-green-500'}`} />
                </div>
                <span className="text-xl font-bold text-gray-800 mb-2">Doctor</span>
                <span className="text-sm text-gray-600 text-center">Manage patients and appointments</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
                className={`group flex flex-col items-center p-8 border-2 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${
                  formData.role === 'ADMIN'
                    ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
                  formData.role === 'ADMIN' ? 'bg-purple-500' : 'bg-gray-100 group-hover:bg-purple-100'
                }`}>
                  <FaUserShield className={`w-7 h-7 ${formData.role === 'ADMIN' ? 'text-white' : 'text-purple-500'}`} />
                </div>
                <span className="text-xl font-bold text-gray-800 mb-2">Admin</span>
                <span className="text-sm text-gray-600 text-center">Manage system and users</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 mb-6 text-sm text-red-800 rounded-xl bg-red-50 border-2 border-red-200 flex items-start shadow-md">
              <span className="text-lg mr-2">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 mb-6 text-sm text-green-800 rounded-xl bg-green-50 border-2 border-green-200 flex items-start shadow-md">
              <span className="text-lg mr-2">✅</span>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="firstName">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className="block w-full px-4 py-3 text-gray-700 placeholder-gray-400 bg-gray-50 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="lastName">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="block w-full px-4 py-3 text-gray-700 placeholder-gray-400 bg-gray-50 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john.doe@example.com"
                  className="block w-full px-4 py-3 text-gray-700 placeholder-gray-400 bg-gray-50 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="phoneNumber">
                  Phone Number
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="01234567890"
                  className="block w-full px-4 py-3 text-gray-700 placeholder-gray-400 bg-gray-50 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="dateOfBirth">
                  Date of Birth
                </label>
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 text-gray-700 bg-gray-50 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="gender">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 text-gray-700 bg-gray-50 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition duration-200"
                  required
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {formData.role === 'DOCTOR' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="yearsOfExperience">
                      Years of Experience
                    </label>
                    <input
                      id="yearsOfExperience"
                      name="yearsOfExperience"
                      type="number"
                      value={formData.yearsOfExperience}
                      onChange={handleChange}
                      placeholder="5"
                      className="block w-full px-4 py-3 text-gray-700 placeholder-gray-400 bg-gray-50 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition duration-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="licenseNumber">
                      License Number
                    </label>
                    <input
                      id="licenseNumber"
                      name="licenseNumber"
                      type="text"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      placeholder="MED-12345"
                      className="block w-full px-4 py-3 text-gray-700 placeholder-gray-400 bg-gray-50 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition duration-200"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="block w-full px-4 py-3 text-gray-700 placeholder-gray-400 bg-gray-50 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="block w-full px-4 py-3 text-gray-700 placeholder-gray-400 bg-gray-50 border border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none transition duration-200"
                  required
                />
              </div>
            </div>

            <div className="mt-8">
              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 text-base font-medium tracking-wide text-white transition-all duration-300 transform bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
