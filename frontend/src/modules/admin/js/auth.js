import api from '../../../shared/services/api.js';
import Swal, { Toast } from '../../../shared/utils/swal.js';
const isAdmin = user?.role == 1;
if(!isAdmin) {
  window.location.href = '/';
} 