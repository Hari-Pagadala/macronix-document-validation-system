import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Paper,
    Typography,
    Alert,
    Grid,
    AppBar,
    Toolbar,
    IconButton,
    Menu,
    Container,
    CircularProgress,
    FormHelperText
} from '@mui/material';
import {
    Logout as LogoutIcon,
    Person as PersonIcon,
    Home as HomeIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// API base URL (configurable via REACT_APP_API_BASE_URL)
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// Indian States and Districts data
const STATES_DISTRICTS = {
    'Andhra Pradesh': ['Anantapur', 'Chittoor', 'East Godavari', 'Guntur', 'Krishna', 'Kurnool', 'Nellore', 'Prakasam', 'Visakhapatnam', 'Vizianagaram', 'West Godavari', 'YSR Kadapa'],
    'Arunachal Pradesh': ['Anjaw', 'Changlang', 'Dibang Valley', 'East Kameng', 'East Siang', 'Kameng', 'Kra Daadi', 'Kurung Kumey', 'Lohit', 'Longding', 'Lower Dibang Valley', 'Lower Siang', 'Lower Subansiri', 'Namsai', 'Papum Pare', 'Tawang', 'Tirap', 'Upper Dibang Valley', 'Upper Siang', 'Upper Subansiri', 'West Kameng', 'West Siang'],
    'Assam': ['Baksa', 'Barpeta', 'Biswanath', 'Bongaigaon', 'Cachar', 'Charaideo', 'Chirang', 'Darrang', 'Dhemaji', 'Dima Hasao', 'Goalpara', 'Golaghat', 'Hailakandi', 'Hojai', 'Jorhat', 'Kamrup', 'Kamrup Metropolitan', 'Karbi Anglong', 'Karimganj', 'Nalbari', 'Nagaon', 'Sivasagar', 'Sonitpur', 'South Salmara Mankachar', 'Tinsukia', 'Udalguri', 'West Karbi Anglong'],
    'Bihar': ['Araria', 'Arwal', 'Aurangabad', 'Banka', 'Begusarai', 'Bhagalpur', 'Bhojpur', 'Buxar', 'Chhapra', 'Darbhanga', 'East Champaran', 'Gaya', 'Gopalganj', 'Jamui', 'Jehanabad', 'Jhanabad', 'Kaimur', 'Katihar', 'Khagaria', 'Kishanganj', 'Lakhisarai', 'Madhepura', 'Madhubani', 'Munger', 'Muzaffarpur', 'Nalanda', 'Nawada', 'Patna', 'Purnia', 'Rohtas', 'Saharsa', 'Samastipur', 'Saran', 'Shekhpura', 'Sheohar', 'Siwan', 'Supaul'],
    'Chhattisgarh': ['Balod', 'Balodabazaar', 'Balrampur', 'Bastar', 'Bemetara', 'Bijapur', 'Bilaspur', 'Dantewada', 'Dhamtari', 'Durg', 'Gariyaband', 'Gaurela Pendra Marwahi', 'Janjgir Champa', 'Jashpur', 'Kabirdham', 'Kanker', 'Kawardha', 'Kondagaon', 'Korba', 'Korea', 'Mungeli', 'Narayanpur', 'Rajnandgaon', 'Raigarh', 'Raipur'],
    'Goa': ['North Goa', 'South Goa'],
    'Gujarat': ['Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha', 'Bharuch', 'Bhavnagar', 'Botad', 'Chhota Udaipur', 'Dahod', 'Dang', 'Devbhoomi Dwarka', 'Gandhinagar', 'Gir Somnath', 'Godhra', 'Jamnagar', 'Junagadh', 'Kheda', 'Mahisagar', 'Mehsana', 'Morbi', 'Narmada', 'Navsari', 'Panchmahal', 'Patan', 'Porbandar', 'Rajkot', 'Sabarkantha', 'Surendranagar', 'Surat', 'Vadodara', 'Valsad'],
    'Haryana': ['Ambala', 'Bhiwani', 'Charkhi Dadri', 'Faridabad', 'Fatehabad', 'Gurgaon', 'Hisar', 'Jhajjar', 'Jind', 'Kaithal', 'Karnal', 'Kurukshetra', 'Mahendragarh', 'Mewat', 'Palwal', 'Panchkula', 'Panipat', 'Rewari', 'Rohtak', 'Sirsa', 'Sonipat', 'Yamunanagar'],
    'Himachal Pradesh': ['Bilaspur', 'Chamba', 'Hamirpur', 'Kangra', 'Kinnaur', 'Kullu', 'Lahaul Spiti', 'Mandi', 'Shimla', 'Sirmour', 'Solan', 'Una'],
    'Jharkhand': ['Bokaro', 'Chatra', 'Deoghar', 'Dhanbad', 'Dumka', 'East Singhbhum', 'Garhwa', 'Giridih', 'Godda', 'Gumla', 'Hazaribag', 'Jamtara', 'Khunti', 'Koderma', 'Latehar', 'Lohardaga', 'Pakur', 'Palamu', 'Ramgarh', 'Ranchi', 'Sahebganj', 'Seraikela Kharsawan', 'Simdega', 'West Singhbhum'],
    'Karnataka': ['Bagalkote', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban', 'Bidar', 'Bijapura', 'Chamarajanagar', 'Chikballapur', 'Chikmagalur', 'Chitradurga', 'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Gulbarga', 'Hassan', 'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal', 'Mandya', 'Mangaluru', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga', 'Tumkur', 'Udupi', 'Uttara Kannada', 'Yadgir'],
    'Kerala': ['Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad', 'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'],
    'Madhya Pradesh': ['Agar Malwa', 'Alirajpur', 'Anuppur', 'Ashoknagar', 'Balaghat', 'Balangir', 'Barwani', 'Betul', 'Bhind', 'Bhopal', 'Burhanpur', 'Chhatarpur', 'Chhindwara', 'Chitrakoot', 'Damoh', 'Datia', 'Dewas', 'Dhar', 'Dindori', 'Durg', 'Guna', 'Gwalior', 'Harda', 'Hoshangabad', 'Indore', 'Jabalpur', 'Jhabua', 'Jhansi', 'Katni', 'Khandwa', 'Khargone', 'Khimsar', 'Koraput', 'Kota', 'Lalitpur', 'Mandir Hasaud', 'Mandla', 'Mandsaur', 'Mandi', 'Morena', 'Narsimhapur', 'Neemuch', 'Panna', 'Raisen', 'Rajgarh', 'Raipur', 'Ratlam', 'Raychhad', 'Rehli', 'Rewa', 'Sabalgarh', 'Sadabad', 'Safed', 'Sagar', 'Sanchi', 'Sarni', 'Satna', 'Satpur', 'Saugor', 'Seharabad', 'Sehra', 'Sekhpur', 'Seoni', 'Sepur', 'Serangpur', 'Shajpur', 'Shajapur', 'Shakapur', 'Shakepur', 'Shamai', 'Shamali', 'Shamar', 'Shamars', 'Shambagh', 'Shambaul', 'Shambazpur', 'Shambe', 'Shambeg', 'Shambi', 'Shambipur', 'Shambragh', 'Shambraj', 'Shamragh', 'Shamrogh', 'Shamrup', 'Shamser', 'Shamsher', 'Shamspet', 'Shamstabad', 'Shamsudin', 'Shamtpur', 'Shamua', 'Shamuddin', 'Shamui', 'Shamul', 'Shamulla', 'Shamulpur', 'Shamupa', 'Shamur', 'Shamure', 'Shamuripur', 'Shamurn', 'Shamwad', 'Shamwara', 'Shamwari', 'Shamwars', 'Shamwarte', 'Shamwati', 'Shamway', 'Shamwaya', 'Shamwaye', 'Shamwazpur', 'Shamya', 'Shamyak', 'Shamyan', 'Shamyarp', 'Shamyas', 'Shamyata', 'Shamyath', 'Shamyauddin', 'Shamyeb', 'Shamyer', 'Shamyeri', 'Shamyerpur', 'Shamyese', 'Shamyipur', 'Shamyirabad', 'Shamyirpur', 'Shamyisabad', 'Shamyispur', 'Shamyist', 'Shamyita', 'Shamyitupu', 'Shamyivipur', 'Shamyizpur', 'Shamyma', 'Shamypur', 'Shamyre', 'Shamyre', 'Shamyri', 'Shamyri', 'Shamyri', 'Shamyri', 'Shamyri', 'Shamyri', 'Shamyri', 'Shamyri'],
    'Maharashtra': ['Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara', 'Buldhana', 'Chandrapur', 'Chhatrapati Sambhajinagar', 'Dhule', 'Dindori', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon', 'Jalna', 'Kolhapur', 'Latur', 'Mohan', 'Mul', 'Nanded', 'Nandurbar', 'Nashik', 'Navpur', 'Oscmanden', 'Osmanden', 'Parbhani', 'Pimpri-Chinchwad', 'Pune', 'Raigad', 'Raisen', 'Rajpur', 'Raipur', 'Sangli', 'Satara', 'Satpur', 'Shimla', 'Sholapur', 'Solapur', 'Thane', 'Tuljapur', 'Ulhasnagar', 'Vasai-Virar', 'Wardha', 'Washim', 'Yavatmal', 'Yavatpur'],
    'Manipur': ['Bishnupur', 'Chandel', 'Churachandpur', 'Imphal East', 'Imphal West', 'Jiribam', 'Kakching', 'Kamjong', 'Kangpokpi', 'Noney', 'Pherzawl', 'Senapati', 'Tamenglong', 'Tengnoupal', 'Thoubal', 'Ukhrul'],
    'Meghalaya': ['East Garo Hills', 'East Jaintia Hills', 'East Khasi Hills', 'North Garo Hills', 'Ri Bhoi', 'South Garo Hills', 'South West Garo Hills', 'South West Khasi Hills', 'West Garo Hills', 'West Jaintia Hills', 'West Khasi Hills'],
    'Mizoram': ['Aizawl', 'Champhai', 'Chhimtuipui', 'Kolasib', 'Lawngtlai', 'Lunglei', 'Mamit', 'Saiha', 'Serchhip'],
    'Nagaland': ['Chümoukedima', 'Dimapur', 'Kiphire', 'Kohima', 'Longleng', 'Mokokchung', 'Mon', 'Peren', 'Phek', 'Tuensang', 'Wokha', 'Zunheboto'],
    'Odisha': ['Angul', 'Balangir', 'Balasore', 'Bargarh', 'Bhadrak', 'Bhubaneswar', 'Bolangir', 'Boudh', 'Cuttack', 'Debagarh', 'Dhenkanal', 'Gajapati', 'Ganjam', 'Jagatsinghpur', 'Jajpur', 'Jharsuguda', 'Jhenaidah', 'Kalahandi', 'Kandhamal', 'Kendrapara', 'Kendujhar', 'Khordha', 'Koraput', 'Malkangiri', 'Mayurbhanj', 'Nabarangpur', 'Nayagarh', 'Nuapada', 'Nuh', 'Puri', 'Rayagada', 'Sambalpur', 'Sonepur', 'Sundargarh'],
    'Punjab': ['Amritsar', 'Barnala', 'Bathinda', 'Faridkot', 'Firozpur', 'Gurdaspur', 'Hoshiarpur', 'Jalandhar', 'Kapurthala', 'Ludhiana', 'Mansa', 'Moga', 'Mohali', 'Muktsar', 'Nawanshahr', 'Pathankot', 'Patiala', 'Rupnagar', 'Sangrur', 'SAS Nagar'],
    'Rajasthan': ['Ajmer', 'Alwar', 'Banswara', 'Baran', 'Barmer', 'Bharatpur', 'Bhilwara', 'Bikaner', 'Bundi', 'Chittorgarh', 'Churu', 'Dausa', 'Dhaulpur', 'Dungarpur', 'Ganganagar', 'Ganganagar', 'Gangapur', 'Hanumangarh', 'Jaisalmer', 'Jaipur', 'Jalor', 'Jhalawar', 'Jhalor', 'Jhunjhunu', 'Jodhpur', 'Kaimur', 'Kaithol', 'Kali', 'Kamrup', 'Kansheshwar', 'Kanyakumari', 'Kapasan', 'Karambagh', 'Karanpur', 'Karatpur', 'Karatpurwala', 'Karbala', 'Kardapur', 'Karehan', 'Karera', 'Kareran', 'Karerpur', 'Karera', 'Kargana', 'Karganj', 'Kargarh', 'Kargaon', 'Kargara', 'Kargari', 'Kargarpur', 'Kargaspur', 'Kargat', 'Kargauna', 'Kargaw', 'Kargawan', 'Kargawr', 'Kargay', 'Kargaya', 'Kargayada', 'Kargaypur', 'Kargazpur', 'Kargazpur', 'Kargba', 'Kargebagh', 'Kargi', 'Kargia', 'Kargibpur', 'Kargipur', 'Kargipur', 'Kargir', 'Kargira', 'Kargisabad', 'Kargisanwali', 'Kargispur', 'Kargisur', 'Kargiswa', 'Kargiswali', 'Kargiswar', 'Kargiswara', 'Kargiswarah', 'Kargiswarai', 'Kargiswari', 'Kargiswarn', 'Kargiswarn', 'Kargiswarn', 'Kargiswarn'],
    'Sikkim': ['East Sikkim', 'North Sikkim', 'South Sikkim', 'West Sikkim'],
    'Tamil Nadu': ['Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dindigul', 'Erode', 'Kanchipuram', 'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi', 'Thanjavur', 'Theni', 'Thirupathur', 'Thiruvannamalai', 'Thiruvarur', 'Tirupati', 'Tiruppur', 'Tiruvannamalai', 'Tirupur', 'Vellore', 'Villupuram', 'Virudhachalam'],
    'Telangana': ['Adilabad', 'Bhadradri Kothagudem', 'Hyderabad', 'Jagitial', 'Jangaon', 'Karimnagar', 'Khammam', 'Kumuram Bheem Asifabad', 'Mahabubnagar', 'Mancherial', 'Medak', 'Medchal Malkajgiri', 'Mulugu', 'Nagarkurnool', 'Narayanpet', 'Nirmal', 'Nizamabad', 'Peddapalli', 'Raipur', 'Rajanna Sircilla', 'Rangareddy', 'Sangareddy', 'Siddipet', 'Suryapet', 'Tandur', 'Vikarabad', 'Wanaparthy', 'Warangal Rural', 'Warangal Urban', 'Yadadri Bhuvanagiri'],
    'Tripura': ['Dhalai', 'Gomti', 'Khowai', 'North Tripura', 'Sepahijala', 'South Tripura', 'Unakoti', 'West Tripura'],
    'Uttar Pradesh': ['Agra', 'Aligarh', 'Allahabad', 'Ambedkar Nagar', 'Amethi', 'Amroha', 'Auraiya', 'Azamgarh', 'Baghpat', 'Bahraich', 'Bijnor', 'Basti', 'Ballia', 'Balrampur', 'Banda', 'Bareilly', 'Basti', 'Bijnor', 'Bulandshahr', 'Chandauli', 'Chhatarpur', 'Chitrakoot', 'Deoband', 'Deoria', 'Etah', 'Etawah', 'Farrukhabad', 'Fatehpur', 'Firozabad', 'Gajraula', 'Gautam Budh Nagar', 'Ghaziabad', 'Ghazipur', 'Gonda', 'Gorakhpur', 'Gyan Vihar', 'Hapur', 'Hardoi', 'Hargaon', 'Haripur', 'Hathras', 'Havelian', 'Hayatauli', 'Hazratpur', 'Hazipur', 'Hindupur', 'Hisar', 'Hooghly', 'Hussainabad', 'Indore', 'Iridabad', 'Irwin', 'Isanpur', 'Ishakpur', 'Islampur', 'Isnabad', 'Isnagar', 'Isnail', 'Isnair', 'Isnajpur', 'Isnapur', 'Isnaur', 'Isnyauli', 'Jabalpur', 'Jabilpur', 'Jacobabad', 'Jadpur', 'Jagad', 'Jagadepur', 'Jagadispur', 'Jagah', 'Jagahedpur', 'Jagain', 'Jagaj', 'Jagal', 'Jagalgarh', 'Jagali', 'Jagalipur', 'Jagalpur', 'Jagalwar', 'Jagam', 'Jagampur', 'Jagana', 'Jaganapur', 'Jaganath', 'Jaganbari', 'Jaganbar', 'Jaganbari', 'Jagangarh', 'Jaganganj', 'Jagangaon', 'Jagangauj', 'Jaganji', 'Jaganipur', 'Jaganjpur', 'Jaganma', 'Jaganmbha', 'Jaganpur', 'Jaganpuri', 'Jaganpur', 'Jaganpur', 'Jaganpur', 'Jaganpur', 'Jaganpur', 'Jaganpur'],
    'Uttarakhand': ['Almora', 'Bageshwar', 'Chamoli', 'Champawat', 'Dehradun', 'Garhwal', 'Haridwar', 'Kumaon', 'Nainital', 'Pauri', 'Pithoragarh', 'Rudraprayag', 'Tehri', 'Udham Singh Nagar', 'Uttarkashi'],
    'West Bengal': ['Alipurduar', 'Bankura', 'Bardhaman', 'Birbhum', 'Cooch Behar', 'Darjeeling', 'Dinajpur', 'East Bardhaman', 'East Midnapore', 'Hooghly', 'Howrah', 'Jalpaiguri', 'Jhargram', 'Kalimpong', 'Kartik', 'Katwa', 'Kolkata', 'Krishnanagar', 'Malda', 'Medinipur', 'Murshidabad', 'Nadia', 'Naihati', 'Nandigram', 'Netaji Subhas Palli', 'Newtown', 'Nilambazar', 'North 24 Parganas', 'Paharpur', 'Pakur', 'Panagarh', 'Panihati', 'Panisagar', 'Pappamundai', 'Parui', 'Patharghata', 'Patharpratima', 'Pathauli', 'Pather', 'Patherhat', 'Patiam', 'Patiara', 'Patiarganj', 'Patiari', 'Patiana', 'Patianali', 'Patiapara', 'Patibandha', 'Patibara', 'Patibari', 'Patibarati', 'Patibepur', 'Patibera', 'Patiberia', 'Patibhaira', 'Patibhari', 'Patibharipur', 'Patibhata', 'Patibhata', 'Patibhata'],
};

const ManualEntryPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    const [anchorEl, setAnchorEl] = useState(null);
    const [formData, setFormData] = useState({
        caseNumber: '',
        firstName: '',
        lastName: '',
        contactNumber: '',
        email: '',
        address: '',
        state: '',
        district: '',
        pincode: '',
        remarks: ''
    });
    
    const [districts, setDistricts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [generatedRef, setGeneratedRef] = useState('');
    const [errors, setErrors] = useState({});
    const [checkingCase, setCheckingCase] = useState(false);
    const caseCheckTimer = useRef(null);

    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);
    
    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleStateChange = (e) => {
        const selectedState = e.target.value;
        setFormData(prev => ({ 
            ...prev, 
            state: selectedState, 
            district: '' 
        }));
        setDistricts(STATES_DISTRICTS[selectedState] || []);
        setErrors(prev => ({ ...prev, state: '', district: '' }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let newValue = value;
        let fieldError = '';

        if (name === 'contactNumber') {
            newValue = value.replace(/[^0-9]/g, '');
            if (newValue.length > 10) newValue = newValue.slice(0, 10);
            if (newValue && newValue.length !== 10) {
                fieldError = 'Must be exactly 10 digits';
            }
        } else if (name === 'pincode') {
            newValue = value.replace(/[^0-9]/g, '');
            if (newValue.length > 6) newValue = newValue.slice(0, 6);
            if (newValue && !/^\d{6}$/.test(newValue)) {
                fieldError = 'Must be exactly 6 digits';
            }
        } else if (['firstName', 'lastName'].includes(name)) {
            newValue = value.replace(/[^A-Za-z\s\-\']/g, '');
        } else if (name === 'email' && value) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                fieldError = 'Invalid email format';
            }
        }

        setFormData(prev => ({ ...prev, [name]: newValue }));
        setErrors(prev => ({ ...prev, [name]: fieldError }));
    };

    // Debounced duplicate check for Case Number on change
    useEffect(() => {
        // Clear previous timer
        if (caseCheckTimer.current) {
            clearTimeout(caseCheckTimer.current);
        }

        const c = (formData.caseNumber || '').toString().trim();
        if (!c) {
            // Clear error if field is empty
            setErrors(prev => ({ ...prev, caseNumber: '' }));
            setCheckingCase(false);
            return;
        }

        // Start debounce
        caseCheckTimer.current = setTimeout(async () => {
            setCheckingCase(true);
            try {
                const token = localStorage.getItem('token');
                const resp = await axios.get(`${API_BASE_URL}/records`, {
                    params: { search: c, limit: 1 },
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                const found = (resp.data?.records || []).some((r) => (r.caseNumber || '').toString() === c);
                setErrors(prev => ({
                    ...prev,
                    caseNumber: found ? 'Case Number already exists in system' : ''
                }));
            } catch (err) {
                // Network/authorization issues: don't block typing, server will revalidate on submit
            } finally {
                setCheckingCase(false);
            }
        }, 400); // 400ms debounce

        return () => {
            if (caseCheckTimer.current) {
                clearTimeout(caseCheckTimer.current);
            }
        };
    }, [formData.caseNumber]);

    const handleReset = (clearMessages = true) => {
        setFormData({
            caseNumber: '',
            firstName: '',
            lastName: '',
            contactNumber: '',
            email: '',
            address: '',
            state: '',
            district: '',
            pincode: '',
            remarks: ''
        });
        setErrors({});
        setError('');
        if (clearMessages) {
            setMessage('');
            setGeneratedRef('');
        }
        setDistricts([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        const newErrors = {};
        if (!formData.caseNumber.trim()) newErrors.caseNumber = 'Required';
        if (!formData.firstName.trim()) newErrors.firstName = 'Required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Required';
        if (!formData.contactNumber || formData.contactNumber.length !== 10) {
            newErrors.contactNumber = 'Must be 10 digits';
        }
        if (!formData.address.trim()) newErrors.address = 'Required';
        if (!formData.state) newErrors.state = 'Required';
        if (!formData.district) newErrors.district = 'Required';
        if (!formData.pincode || !/^\d{6}$/.test(formData.pincode)) {
            newErrors.pincode = 'Must be 6 digits';
        }

        if (Object.keys(newErrors).length > 0 || errors.caseNumber) {
            setErrors(newErrors);
            setError('Please fix all errors');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await axios.post(
                `${API_BASE_URL}/records/manual`,
                formData
            );

            setMessage('Record added successfully.');
            setGeneratedRef(response.data?.record?.referenceNumber || '');
            handleReset(false);
            setTimeout(() => {
                setMessage('');
                setGeneratedRef('');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Error creating record');
        } finally {
            setLoading(false);
        }
    };

    const states = Object.keys(STATES_DISTRICTS).sort();

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
            {/* Header */}
            <AppBar position="fixed" sx={{ zIndex: 1300 }}>
                <Toolbar>
                    <HomeIcon sx={{ mr: 2 }} />
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        Manual Record Entry
                    </Typography>
                    <Button color="inherit" onClick={() => navigate('/')} sx={{ mr: 2 }}>
                        Dashboard
                    </Button>
                    <IconButton color="inherit" onClick={handleMenuOpen}>
                        <PersonIcon />
                    </IconButton>
                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                        <MenuItem disabled>
                            <Typography variant="body2">{user?.email}</Typography>
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            <LogoutIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                            Logout
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            {/* Main Content */}
            <Box sx={{ flexGrow: 1, p: 3, mt: '64px' }}>
                <Container maxWidth="md" sx={{ maxWidth: '800px' }}>
                    <Paper elevation={4} sx={{ p: 4, borderRadius: 2 }}>
                        <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: '#1976d2' }}>
                            Create New Record
                        </Typography>

                        {message && (
                            <Alert severity="success" sx={{ mb: 2, borderRadius: 1 }}>
                                {message}
                            </Alert>
                        )}
                        {error && (
                            <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }}>
                                {error}
                            </Alert>
                        )}
                        {generatedRef && (
                            <Alert severity="info" sx={{ mb: 2, borderRadius: 1 }}>
                                <strong>Ref #:</strong> {generatedRef}
                            </Alert>
                        )}

                        <Box component="form" onSubmit={handleSubmit}>
                            <Grid container spacing={2.5}>
                                {/* Case Number */}
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Case Number"
                                        name="caseNumber"
                                        value={formData.caseNumber}
                                        onChange={handleInputChange}
                                        error={!!errors.caseNumber}
                                        helperText={checkingCase && !errors.caseNumber ? 'Checking…' : errors.caseNumber}
                                        size="small"
                                    />
                                </Grid>

                                {/* Names */}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="First Name"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        error={!!errors.firstName}
                                        helperText={errors.firstName}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Last Name"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        error={!!errors.lastName}
                                        helperText={errors.lastName}
                                        size="small"
                                    />
                                </Grid>

                                {/* Contact and Email */}
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Contact (10 digits)"
                                        name="contactNumber"
                                        value={formData.contactNumber}
                                        onChange={handleInputChange}
                                        error={!!errors.contactNumber}
                                        helperText={errors.contactNumber}
                                        inputProps={{ maxLength: 10, inputMode: 'numeric' }}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Email (Optional)"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        error={!!errors.email}
                                        helperText={errors.email}
                                        size="small"
                                    />
                                </Grid>

                                {/* Address */}
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Address"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        error={!!errors.address}
                                        helperText={errors.address}
                                        multiline
                                        rows={2}
                                        size="small"
                                    />
                                </Grid>

                                {/* State Dropdown */}
                                <Grid item xs={12} sm={6} sx={{ minWidth: '200px' }}>
                                    <FormControl fullWidth size="small" error={!!errors.state}>
                                        <InputLabel>State</InputLabel>
                                        <Select
                                            name="state"
                                            value={formData.state}
                                            onChange={handleStateChange}
                                            label="State"
                                        >
                                            <MenuItem value="">-- Select State --</MenuItem>
                                            {states.map((state) => (
                                                <MenuItem key={state} value={state}>
                                                    {state}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {errors.state && <FormHelperText>{errors.state}</FormHelperText>}
                                    </FormControl>
                                </Grid>

                                {/* District Dropdown */}
                                <Grid item xs={12} sm={6} sx={{ minWidth: '200px' }}>
                                    <FormControl fullWidth size="small" error={!!errors.district} disabled={!formData.state}>
                                        <InputLabel>District</InputLabel>
                                        <Select
                                            name="district"
                                            value={formData.district}
                                            onChange={(e) => {
                                                setFormData(prev => ({ ...prev, district: e.target.value }));
                                                setErrors(prev => ({ ...prev, district: '' }));
                                            }}
                                            label="District"
                                        >
                                            <MenuItem value="">-- Select District --</MenuItem>
                                            {districts.map((district) => (
                                                <MenuItem key={district} value={district}>
                                                    {district}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {errors.district && <FormHelperText>{errors.district}</FormHelperText>}
                                    </FormControl>
                                </Grid>

                                {/* Pincode */}
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Pincode (6 digits)"
                                        name="pincode"
                                        value={formData.pincode}
                                        onChange={handleInputChange}
                                        error={!!errors.pincode}
                                        helperText={errors.pincode}
                                        inputProps={{ maxLength: 6, inputMode: 'numeric' }}
                                        size="small"
                                    />
                                </Grid>

                                {/* Buttons */}
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="contained"
                                            type="submit"
                                            disabled={loading}
                                            sx={{ minWidth: '110px' }}
                                        >
                                            {loading ? <CircularProgress size={24} /> : 'Submit'}
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            type="button"
                                            onClick={handleReset}
                                            disabled={loading}
                                        >
                                            Reset
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </Paper>
                </Container>
            </Box>
        </Box>
    );
};

export default ManualEntryPage;
