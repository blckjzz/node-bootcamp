import axios from 'axios';
import { showAlert } from '../js/alert';
const stripe = Stripe(
  'pk_test_51QqITOGbzrccJpkwVXdkgRt1bBDCiQ91prIXABoAwv0gi5KArccSlZizubzL62OMFFhvJOuJFLjxUUzgCLGcKrtI00uf6S4JYa',
);

export const bookTour = async (tourId) => {
  const url = `/api/v1/bookings/checkout-session/${tourId}`;

  try {
    const res = await axios.get(url, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log(res);

    await stripe.redirectToCheckout({
      sessionId: res.data.session.id,
    });
    // if (res.data.status === 'success') {
    //   showAlert('success', `It worked. ${res.data.session.url}`);
    //   //   window.setTimeout(() => {
    //   //     location.assign(window.location.href);
    //   //   }, 1500); // Espera 1.5 segundos antes de recarregar
    // }
  } catch (error) {
    showAlert('error', error);
    // Quando a API retorna um erro com uma resposta
    console.log('Erro da API:', error);
  }
};
