/* eslint-disable */
import '@babel/polyfill';
import axios from 'axios';
import { showAlert } from './alert';

// export const updateData = async (name, email) => {

export const updateData = async (data, type) => {
  const typeAction =
    type === 'password' ? 'updateMyPassword' : 'update-my-data';
  try {
    const res = await axios.patch(
      `api/v1/users/${typeAction}`,
      data, // Enviar FormData diretamente
      {
        withCredentials: true,
        headers: {
          'Content-Type':
            type === 'password' ? 'application/json' : 'multipart/form-data',
        },
      },
    );
    if (res.data.status === 'success') {
      showAlert('success', `Your ${type} was updated!`);
      window.setTimeout(() => {
        location.assign(window.location.href);
      }, 1500); // Espera 1.5 segundos antes de recarregar
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
    // Quando a API retorna um erro com uma resposta
    console.log('Erro da API:', error.response);
  }
};
