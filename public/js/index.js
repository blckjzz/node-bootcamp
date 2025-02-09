/* eslint-disable */

import { login, logout } from './login';
import { updateData } from './updateUserData';
import { bookTour } from './stripe';
import { showAlert } from './alert';

// DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const btnBookTour = document.getElementById('book-tour');

// if (mapBox) {
//   const locations = JSON.parse(mapBox.dataset.locations);
//   displayMap(locations);
// }

if (loginForm)
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });

if (logOutBtn) {
  logOutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });

  if (userDataForm) {
    userDataForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const form = new FormData();
      form.append('name', document.getElementById('name').value);
      form.append('email', document.getElementById('email').value);

      const photoFile = document.getElementById('photo').files[0];
      if (photoFile) {
        form.append('photo', photoFile);
      }

      updateData(form, 'user-data');
    });
  }

  if (userPasswordForm) {
    userPasswordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const passwordCurrent = document.getElementById('password-current').value;
      const password = document.getElementById('password').value;
      const passwordConfirm = document.getElementById('password-confirm').value;
      updateData({ passwordCurrent, password, passwordConfirm }, 'password');
    });
  }

  if (btnBookTour) {
    btnBookTour.addEventListener('click', (e) => {
      e.target.textContent = 'Processing';
      e.target.data;
      console.log(`clicked on btn: ${e.target.dataset}`);
      const { tourId } = e.target.dataset;
      console.log(`Tour Id: ${tourId}`);
      bookTour(tourId);
    });
  }
}
