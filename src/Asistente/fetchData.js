import Swal from 'sweetalert2';

function getSuspender(promise) {
  let status = 'pending';
  let response;

  const suspender = promise.then(
    (res) => {
      status = "success";
      response = res;
    },
    (err) => {
      status = "error";
      response = err;
    }
  );

  const read = () => {
    switch (status) {
      case "pending":
        throw suspender;
      case "error":
        throw response;
      default:
        return response;
    }
  };

  return { read };
}

export function fetchData(url) {
  const promise = fetch(url)
    .then((response) => response.json())
    .then((json) => json);

  return getSuspender(promise);
}

export function showLoadingAlert() {
  Swal.fire({
    title: 'Cargando...',
    text: 'Por favor espera',
    allowOutsideClick: false,
    onBeforeOpen: () => {
      Swal.showLoading();
    }
  });
}

export function closeLoadingAlert() {
  Swal.close();
}
