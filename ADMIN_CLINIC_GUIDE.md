# Admin Test Guide - Create Clinics

## Login as Admin
1. Go to http://localhost:5173/login
2. Enter credentials:
   - Email: `admin@test.com`
   - Password: `password123`

## Navigate to Manage Clinics
1. After login, you'll be at Admin Dashboard
2. Click on **"Manage Clinics"** button

## Create New Clinics

### Example Clinic 1: Gleem Medical Center
- **Name:** Gleem Medical Center
- **City:** Alexandria
- **Area:** Gleem
- **Address:** 45 Gleem Avenue, Alexandria
- **Phone:** 01234567899
- **Map URL:** https://maps.google.com/?q=gleem+alexandria (optional)

### Example Clinic 2: Maadi Specialized Clinic
- **Name:** Maadi Specialized Clinic
- **City:** Cairo
- **Area:** Maadi
- **Address:** 123 Road 9, Maadi, Cairo
- **Phone:** 01234567898
- **Map URL:** https://maps.google.com/?q=maadi+cairo (optional)

### Example Clinic 3: Mansoura General Hospital
- **Name:** Mansoura General Hospital
- **City:** Mansoura
- **Area:** Downtown
- **Address:** 78 El Gomhoreya Street, Mansoura
- **Phone:** 01234567897

## After Creating Clinics

Doctors can now:
1. Log in as doctor (doctor1@test.com, doctor2@test.com, or doctor3@test.com)
2. Go to "My Clinics" page
3. Click "Add Clinic" 
4. Select any of the newly created clinics
5. Set their consultation fee
6. Create schedules for those clinics

---

## API Test (Alternative using curl)

If you prefer testing via API:

```bash
# 1. Login as admin
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}'

# Copy the access token from response

# 2. Create a clinic
curl -X POST http://localhost:3000/api/clinics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "name": "Gleem Medical Center",
    "city": "Alexandria",
    "area": "Gleem",
    "address": "45 Gleem Avenue, Alexandria",
    "phone": "01234567899"
  }'
```

---

## Quick Summary

**Current Clinics in Database:**
1. Alex Medical Center (Alexandria, Smouha)
2. City Health Clinic (Cairo, Nasr City)

**Add more clinics as needed so doctors can:**
- Work at multiple locations
- Set different schedules for each location
- Set different consultation fees per clinic

**All test account password:** `password123`
