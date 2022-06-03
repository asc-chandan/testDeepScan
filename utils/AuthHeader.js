import { getToken } from './Common';

export default function AuthHeader() {
    // return authorization header with jwt token
    const token = getToken();
    if (!token) { 
        return '';
    } else {
        return 'Bearer '+token;
    }
}