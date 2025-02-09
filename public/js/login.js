/* eslint-disable */

import '@babel/polyfill';
import { displayMap } from './mapbox';
import axios from 'axios';
import { showAlert } from './alert';

export const login = async (email, password) => {
  try {
    const response = await axios.post(
      '/api/v1/users/login',
      {
        email,
        password,
      },
      { withCredentials: true },
    );

    if (response.data.status === 'success') {
      // console.log('Login successful:', response.data);
      showAlert('success', 'Login successful!');
      window.setTimeout(() => {
        location.assign('/', 1500);
      });
    }

    // Se o login for bem-sucedido, você pode tratar a resposta
  } catch (error) {
    // Caso de erro: capture todos os detalhes da resposta de erro
    if (error.response) {
      showAlert('error', error.response.data.message);
      // Quando a API retorna um erro com uma resposta
      console.log('Erro da API:', error.response);
    }
  }
};

export const logout = async () => {
  try {
    const response = await axios.get(
      '/api/v1/users/logout',
      // {
      //   // email,
      //   // password,
      // },
      { withCredentials: true },
    );

    if (response.data.status === 'success') {
      console.log('logout succesfull', response.data);
      showAlert('success', 'logout succesfull');
      location.reload(true);
      window.setTimeout(() => {
        location.assign('/', 2500);
      });
    }

    // Se o login for bem-sucedido, você pode tratar a resposta
  } catch (error) {
    // Caso de erro: capture todos os detalhes da resposta de erro
    if (error.response) {
      showAlert('error', error.response.data.message);
      // Quando a API retorna um erro com uma resposta
      console.log('Erro da API:', error.response);
    }
  }
};
