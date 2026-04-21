const axios = require('axios');
axios.post('http://localhost:8000/api/v1/auth/login', {username: 'teler', password: 'password111'}).then(async res => {
  console.log('Login Success');
  const token = res.data.access_token;
  const s = await axios.get('http://localhost:8000/api/v1/sidebar', {headers: {Authorization: 'Bearer '+token}});
  console.log('Sidebar count:', s.data.length);
}).catch(e => console.log(e.message));
